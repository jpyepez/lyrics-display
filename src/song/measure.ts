import type { TextMeasurer } from './fit'
import type { Stanza } from './lyrics'

/** Builds the same markup the Song view renders for a Stanza. */
function stanzaElement(stanza: Stanza): HTMLElement {
  const element = document.createElement('div')
  element.className = 'stanza'
  if (stanza.sectionLabel) {
    const label = document.createElement('h2')
    label.className = 'section-label'
    label.textContent = stanza.sectionLabel
    element.append(label)
  }
  for (const line of stanza.lines) {
    const p = document.createElement('p')
    p.className = 'line'
    p.textContent = line
    element.append(p)
  }
  return element
}

export type DomMeasurer = TextMeasurer & {
  /** Removes the hidden measuring elements; the next measurement adds them back. */
  dispose(): void
}

/**
 * Measures Stanzas with the browser's real font metrics, as the Song view styles them.
 * Text width does not scale linearly with font size, so each size is laid out for real.
 * Every Stanza stays mounted in one hidden host and the font size is set on the host,
 * so all Stanzas at one size cost a single layout.
 */
export function createDomMeasurer(): DomMeasurer {
  let host: HTMLElement | undefined
  let elements = new WeakMap<Stanza, HTMLElement>()
  let wrapped = new WeakMap<Stanza, Map<string, number>>()

  function mounted(stanza: Stanza, fontSize: number): HTMLElement {
    if (!host) {
      host = document.createElement('div')
      host.className = 'lyrics'
      host.setAttribute('aria-hidden', 'true')
      // Fixed, so it never makes the page taller: a printed page count stays the Sheet count.
      host.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;display:block;'
      document.body.append(host)
    }
    host.style.fontSize = `${fontSize}px`
    let element = elements.get(stanza)
    if (!element) {
      element = stanzaElement(stanza)
      element.style.width = 'max-content'
      host.append(element)
      elements.set(stanza, element)
    }
    return element
  }

  function wrappedHeight(stanza: Stanza, fontSize: number, columnWidth: number): number {
    const element = stanzaElement(stanza)
    element.style.width = `${columnWidth}px`
    mounted(stanza, fontSize).after(element)
    const height = element.getBoundingClientRect().height
    element.remove()
    return height
  }

  return {
    width: (stanza, fontSize) => mounted(stanza, fontSize).getBoundingClientRect().width,
    height(stanza, fontSize, columnWidth) {
      const box = mounted(stanza, fontSize).getBoundingClientRect()
      if (box.width <= columnWidth) return box.height
      // Only a line wider than the whole surface at the minimum font gets here.
      let heights = wrapped.get(stanza)
      if (!heights) wrapped.set(stanza, (heights = new Map()))
      const key = `${fontSize}|${columnWidth}`
      let height = heights.get(key)
      if (height === undefined) {
        height = wrappedHeight(stanza, fontSize, columnWidth)
        heights.set(key, height)
      }
      return height
    },
    dispose() {
      host?.remove()
      host = undefined
      elements = new WeakMap()
      wrapped = new WeakMap()
    },
  }
}
