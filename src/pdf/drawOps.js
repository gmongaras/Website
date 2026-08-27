// Turns a laid-out DOM subtree into a flat list of PDF drawing operations.
//
// The browser has already done the hard part - line breaking, font selection,
// maths positioning - so this only reads the resulting geometry. Every text run
// is emitted as real text at its measured position, which is what makes the
// exported PDF selectable and searchable rather than a picture of a page.

import { isKatexFamily, variantOf } from './fonts.js'

const measureCanvas = document.createElement('canvas')
const measureCtx = measureCanvas.getContext('2d')
const metricsCache = new Map()

const fontMetrics = (family, variant, sizePx) => {
  const key = `${family}|${variant}|${sizePx}`
  const cached = metricsCache.get(key)
  if (cached) return cached

  const style = variant.includes('italic') ? 'italic' : 'normal'
  const weight = variant.includes('bold') ? '700' : '400'
  measureCtx.font = `${style} ${weight} ${sizePx}px "${family}"`
  const m = measureCtx.measureText('Hxg')

  const metrics = {
    ascent: m.fontBoundingBoxAscent || m.actualBoundingBoxAscent || sizePx * 0.8,
    descent: m.fontBoundingBoxDescent || m.actualBoundingBoxDescent || sizePx * 0.2,
  }
  metricsCache.set(key, metrics)
  return metrics
}

const parseColor = (value) => {
  if (!value) return null
  const match = value.match(/rgba?\(([^)]+)\)/)
  if (!match) return null

  const parts = match[1].split(/[,/]/).map((p) => parseFloat(p.trim()))
  const [r, g, b] = parts
  const a = parts.length > 3 ? parts[3] : 1
  if ([r, g, b].some(Number.isNaN)) return null
  return { r, g, b, a }
}

const primaryFamily = (fontFamily) => (fontFamily || '')
  .split(',')[0]
  .trim()
  .replace(/^["']|["']$/g, '')

const uniformRadius = (style) => {
  const values = [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map((v) => parseFloat(v) || 0)

  return values.every((v) => Math.abs(v - values[0]) < 0.5) ? values[0] : 0
}

// Walks a text node line by line. Each line is found by binary searching for the
// longest prefix that still occupies a single client rect.
const splitIntoLines = (node, isPre) => {
  const text = node.nodeValue
  if (!text || !text.trim()) return []

  const range = document.createRange()
  range.selectNodeContents(node)
  if (range.getClientRects().length === 0) return []

  const lines = []
  const length = text.length
  let start = 0
  let guard = 0

  while (start < length && guard++ < 10000) {
    let lo = start + 1
    let hi = length
    let end = start + 1

    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      range.setStart(node, start)
      range.setEnd(node, mid)
      if (range.getClientRects().length <= 1) {
        end = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    if (end <= start) end = start + 1

    // Trim the parts that occupy no visual space so the drawn run lines up with
    // its measured box. Leading space is meaningful in preformatted text.
    let from = start
    let to = end
    if (isPre) {
      while (to > from && /[\r\n]/.test(text[to - 1])) to -= 1
    } else {
      while (from < to && /\s/.test(text[from])) from += 1
      while (to > from && /\s/.test(text[to - 1])) to -= 1
    }

    if (to > from) {
      range.setStart(node, from)
      range.setEnd(node, to)
      const rect = range.getBoundingClientRect()
      if (rect.width > 0) {
        lines.push({ text: text.slice(from, to).replace(/[\r\n]+/g, ' '), rect })
      }
    }

    start = end
  }

  return lines
}

export const collectDrawOps = (root) => {
  const origin = root.getBoundingClientRect()
  const ops = []
  const katexFaces = new Set()

  // Borders are drawn as thin filled rectangles. This is what puts fraction
  // bars, radicals, blockquote rules and code-block outlines on the page.
  const pushBorders = (style, box) => {
    const width = {
      top: parseFloat(style.borderTopWidth) || 0,
      right: parseFloat(style.borderRightWidth) || 0,
      bottom: parseFloat(style.borderBottomWidth) || 0,
      left: parseFloat(style.borderLeftWidth) || 0,
    }

    const sides = {
      top: { x: box.x, y: box.y, w: box.w, h: width.top },
      bottom: { x: box.x, y: box.y + box.h - width.bottom, w: box.w, h: width.bottom },
      left: { x: box.x, y: box.y, w: width.left, h: box.h },
      right: { x: box.x + box.w - width.right, y: box.y, w: width.right, h: box.h },
    }

    for (const [side, geometry] of Object.entries(sides)) {
      if (geometry.w <= 0 || geometry.h <= 0) continue

      const name = side[0].toUpperCase() + side.slice(1)
      if (style[`border${name}Style`] === 'none') continue

      const color = parseColor(style[`border${name}Color`])
      if (!color || color.a <= 0.01) continue

      ops.push({ kind: 'rect', ...geometry, color, radius: 0 })
    }
  }

  const visitText = (node, style) => {
    const family = primaryFamily(style.fontFamily)
    const variant = variantOf(style.fontWeight, style.fontStyle)
    const sizePx = parseFloat(style.fontSize)
    const color = parseColor(style.color) || { r: 0, g: 0, b: 0, a: 1 }
    const isPre = (style.whiteSpace || '').startsWith('pre')
    const katex = isKatexFamily(family)
    if (katex) katexFaces.add(`${family}|${variant}`)

    const { ascent, descent } = fontMetrics(family, variant, sizePx)
    const underline = (style.textDecorationLine || '').includes('underline')

    for (const line of splitIntoLines(node, isPre)) {
      const { rect } = line
      ops.push({
        kind: 'text',
        x: rect.left - origin.left,
        // Centre the font's box within the line box, which is how an inline box
        // is positioned, then step down to the baseline.
        y: rect.top - origin.top + (rect.height - (ascent + descent)) / 2 + ascent,
        width: rect.width,
        text: line.text,
        family,
        variant,
        sizePx,
        color,
        katex,
        underline,
      })
    }
  }

  const visitElement = (el) => {
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return
    if (parseFloat(style.opacity) === 0) return

    const rect = el.getBoundingClientRect()

    // KaTeX renders every formula twice: a MathML copy for screen readers and
    // the visual one. The MathML copy is clipped to a 1px box, so drawing it
    // would pile the whole formula onto a single point.
    if (el.classList.contains('katex-mathml')) return
    if (style.overflow === 'hidden' && (rect.width <= 1 || rect.height <= 1)) return
    const box = {
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      w: rect.width,
      h: rect.height,
    }

    if (box.w > 0 && box.h > 0) {
      const background = parseColor(style.backgroundColor)
      if (background && background.a > 0.01) {
        ops.push({ kind: 'rect', ...box, color: background, radius: uniformRadius(style) })
      }
      pushBorders(style, box)
    }

    if (el.tagName === 'IMG') {
      if (box.w > 0 && box.h > 0) ops.push({ kind: 'image', ...box, element: el })
      return
    }

    if (el.tagName === 'A' && el.href) {
      for (const linkRect of el.getClientRects()) {
        ops.push({
          kind: 'link',
          x: linkRect.left - origin.left,
          y: linkRect.top - origin.top,
          w: linkRect.width,
          h: linkRect.height,
          url: el.href,
        })
      }
    }

    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) visitText(child, style)
      else if (child.nodeType === Node.ELEMENT_NODE) visitElement(child)
    }
  }

  visitElement(root)
  return { ops, katexFaces }
}
