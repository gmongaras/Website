// Chooses where the article is cut into pages.
//
// Page boundaries only ever land in the gaps between blocks, so a paragraph,
// figure or equation is never split across two pages. Code listings are the
// exception: they are long enough that keeping one whole would routinely strand
// half a page of blank paper, so they may be cut between two lines of code.

import { CONTENT_PX } from './page.js'

// A code panel's caption bar behaves like a heading: it introduces the lines
// underneath it, so it must not be left alone at the foot of a page.
const isHeading = (el) => /^H[1-6]$/.test(el.tagName)
  || el.classList.contains('pdf-block-header')

// The elements worth keeping whole. Anything else is a layout wrapper, and
// treating a wrapper as indivisible would push all of its content onto the next
// page rather than just the part that does not fit.
const ATOMIC_TAGS = /^(P|LI|TABLE|BLOCKQUOTE|IMG|FIGURE|HR|H[1-6])$/
const ATOMIC_CLASSES = ['pdf-figure', 'pdf-block', 'katex-display']

const isAtomic = (el) => ATOMIC_TAGS.test(el.tagName)
  || ATOMIC_CLASSES.some((name) => el.classList.contains(name))

// Collects the boxes that must stay intact. Wrappers are descended into, as is
// any block too tall to fit a page, which otherwise could not be placed at all.
export const collectBlocks = (root, pageHeight = CONTENT_PX.height) => {
  const rootTop = root.getBoundingClientRect().top
  const blocks = []

  const push = (top, bottom, heading) => {
    blocks.push({ top: top - rootTop, bottom: bottom - rootTop, heading })
  }

  // A listing becomes one block per line of code, so a break can fall anywhere
  // a reader would accept it. The line boxes come from the text itself, since
  // there is no element per line to measure.
  const pushCodeLines = (pre) => {
    const box = pre.getBoundingClientRect()
    const range = document.createRange()
    const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
    const lines = new Map()

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.nodeValue) continue
      range.selectNodeContents(node)

      for (const rect of range.getClientRects()) {
        if (rect.height <= 0) continue
        const key = Math.round(rect.top)
        const line = lines.get(key)
        if (line) line.bottom = Math.max(line.bottom, rect.bottom)
        else lines.set(key, { top: rect.top, bottom: rect.bottom })
      }
    }

    const sorted = [...lines.values()].sort((a, b) => a.top - b.top)
    if (!sorted.length) {
      push(box.top, box.bottom, false)
      return
    }

    // Stretch the outer lines over the listing's padding, so a break can never
    // land between the code and the edge of the panel around it.
    sorted[0].top = box.top
    sorted[sorted.length - 1].bottom = box.bottom

    for (const line of sorted) push(line.top, line.bottom, false)
  }

  const visit = (parent) => {
    for (const child of parent.children) {
      const rect = child.getBoundingClientRect()
      if (rect.height <= 0) continue

      if (child.tagName === 'PRE') {
        pushCodeLines(child)
        continue
      }

      // A code panel's own wrapper is normally atomic, but it has to be opened
      // up to reach the listing inside it.
      const tooTall = rect.height > pageHeight * 0.85
      const divisible = !isAtomic(child) || tooTall || child.querySelector('pre')
      if (divisible && child.children.length) {
        visit(child)
        continue
      }

      push(rect.top, rect.bottom, isHeading(child))
    }
  }

  visit(root)
  return blocks.sort((a, b) => a.top - b.top)
}

// A heading is pulled onto the next page along with the content it introduces.
export const computePageBreaks = (blocks, totalHeight, pageHeight = CONTENT_PX.height) => {
  const breaks = [0]
  let cursor = 0
  let guard = 0

  while (totalHeight - cursor > pageHeight && guard++ < 2000) {
    const limit = cursor + pageHeight

    const straddling = blocks.find((block) => block.top > cursor && block.top < limit && block.bottom > limit)
    let candidate = straddling ? straddling.top : 0

    if (!candidate) {
      const lastFitting = blocks.filter((block) => block.bottom > cursor && block.bottom <= limit).pop()
      candidate = lastFitting ? lastFitting.bottom : 0
    }

    // Never strand a heading at the foot of a page: if the break would land
    // just after one, move it above the heading instead.
    for (;;) {
      const index = blocks.findIndex((block) => block.top >= candidate)
      const preceding = index === -1 ? blocks[blocks.length - 1] : blocks[index - 1]
      if (!preceding || !preceding.heading || preceding.top <= cursor) break
      candidate = preceding.top
    }

    // Nothing breakable in range means the block is taller than a page and has
    // to be cut regardless.
    if (!candidate || candidate <= cursor) candidate = limit

    breaks.push(candidate)
    cursor = candidate
  }

  breaks.push(totalHeight)
  return breaks
}
