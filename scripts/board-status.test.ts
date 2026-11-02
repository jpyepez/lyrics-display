import { describe, expect, test } from 'vitest'
import { findOption, parseArgs, USAGE } from './board-status.ts'

const options = [
  { id: '549ca079', name: 'Inbox' },
  { id: 'bc2c8ae3', name: 'HITL' },
  { id: 'd1c6b124', name: 'Ready' },
  { id: '37a6af55', name: 'In progress' },
  { id: '5a52b564', name: 'Done' },
]

describe('findOption', () => {
  test('finds a column by its exact name', () => {
    expect(findOption(options, 'In progress')).toEqual({ id: '37a6af55', name: 'In progress' })
  })

  test('finds Done, which the old shell script rejected', () => {
    expect(findOption(options, 'Done')).toEqual({ id: '5a52b564', name: 'Done' })
  })

  test('ignores case and surrounding spaces in the name', () => {
    expect(findOption(options, ' in PROGRESS ')).toEqual({ id: '37a6af55', name: 'In progress' })
  })

  test("rejects a column the board doesn't have, listing the ones it does", () => {
    expect(() => findOption(options, 'Backlog')).toThrow(
      'No column named "Backlog" on the board. Valid columns: Inbox, HITL, Ready, In progress, Done.',
    )
  })
})

describe('parseArgs', () => {
  test('reads the issue number and a column name, quoted or not', () => {
    expect(parseArgs(['26', 'In progress'])).toEqual({ issue: 26, column: 'In progress' })
    expect(parseArgs(['26', 'In', 'progress'])).toEqual({ issue: 26, column: 'In progress' })
  })

  test.each([[[]], [['26']], [['abc', 'Ready']], [['0', 'Ready']], [['2.5', 'Ready']], [['26', ' ']]])(
    'rejects %j with the usage message',
    (args) => {
      expect(() => parseArgs(args)).toThrow(USAGE)
    },
  )
})
