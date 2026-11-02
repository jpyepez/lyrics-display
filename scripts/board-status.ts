// Moves an issue to a column of the lyrics-display board (project 3), adding it to the board
// first if it isn't there. Columns are looked up by name each run, so Done, and any column the
// owner adds later, works without editing this file. Names match case-insensitively.
// Ported from dev-website-2026's scripts/board-status.ts. Needs a token that can edit the
// user-owned Project (GH_TOKEN, or gh's own login).
//
//   bun run board-status <issue-number> <column>     e.g. bun run board-status 26 In progress

import { execFileSync } from 'node:child_process'

export const OWNER = 'jpyepez'
export const REPO = 'jpyepez/lyrics-display'
const PROJECT_NUMBER = '3'
const PROJECT_ID = 'PVT_kwHOAJXAFM4BpG0W'
const STATUS_FIELD_ID = 'PVTSSF_lAHOAJXAFM4BpG0Wzhnj5Ps'

export const USAGE = 'Usage: bun run board-status <issue-number> <column>  (e.g. 26 "In progress")'

export type StatusOption = { id: string; name: string }

export function parseArgs(args: string[]): { issue: number; column: string } {
  const [issue = '', ...rest] = args
  const column = rest.join(' ').trim()
  if (!/^[1-9]\d*$/.test(issue) || column === '') throw new Error(USAGE)
  return { issue: Number(issue), column }
}

export function findOption(options: StatusOption[], column: string): StatusOption {
  const wanted = column.trim().toLowerCase()
  const option = options.find((o) => o.name.toLowerCase() === wanted)
  if (!option) {
    const valid = options.map((o) => o.name).join(', ')
    throw new Error(`No column named "${column}" on the board. Valid columns: ${valid}.`)
  }
  return option
}

export function gh(args: string[]): string {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim() ?? String(error)
    throw new Error(`gh ${args[0]} ${args[1]} failed:\n${stderr}`)
  }
}

function statusOptions(): StatusOption[] {
  const { fields } = JSON.parse(
    gh(['project', 'field-list', PROJECT_NUMBER, '--owner', OWNER, '--format', 'json']),
  ) as { fields: { id: string; options?: StatusOption[] }[] }
  const status = fields.find((f) => f.id === STATUS_FIELD_ID)
  if (!status?.options) throw new Error(`Status field ${STATUS_FIELD_ID} not found on project ${PROJECT_NUMBER}.`)
  return status.options
}

// Also used by scripts/triage-outcome.ts. Returns the column's name as the board spells it.
export function moveToColumn(issue: number, column: string): string {
  const option = findOption(statusOptions(), column)
  const url = `https://github.com/${REPO}/issues/${issue}`
  const item = gh(['project', 'item-add', PROJECT_NUMBER, '--owner', OWNER, '--url', url, '--format', 'json', '--jq', '.id'])
  gh([
    'project', 'item-edit', '--project-id', PROJECT_ID, '--id', item,
    '--field-id', STATUS_FIELD_ID, '--single-select-option-id', option.id,
  ])
  return option.name
}

if (import.meta.main) {
  try {
    const { issue, column } = parseArgs(process.argv.slice(2))
    console.log(`#${issue} → ${moveToColumn(issue, column)}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
