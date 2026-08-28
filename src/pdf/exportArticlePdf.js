// Exports a blog article as a text-based PDF, without the print dialog.
//
// The article is cloned off-screen at the printable page width and laid out by
// the browser. That layout is then read back and replayed as real PDF text,
// vector rectangles and embedded images, so the result stays selectable,
// searchable and sharp at any zoom.

import { nextPaint } from '../lib/dom.js'
import { collectDrawOps } from './drawOps.js'
import { embedKatexFonts, toWinAnsi } from './fonts.js'
import { collectBlocks, computePageBreaks } from './pagination.js'
import { CONTENT_PX, MARGIN, MM_PER_PX, PT_PER_PX } from './page.js'

const waitForImages = (root, timeoutMs = 20000) => {
  const pending = Array.from(root.querySelectorAll('img'))
    .filter((img) => !img.complete)
    .map((img) => new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
    }))

  if (!pending.length) return Promise.resolve()

  return Promise.race([
    Promise.all(pending),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}

// List markers are painted by the browser rather than being real nodes, so they
// are replaced with text that the DOM walk can actually see.
const materialiseListMarkers = (root) => {
  for (const list of root.querySelectorAll('ul, ol')) {
    const ordered = list.tagName === 'OL'
    const first = Number(list.getAttribute('start') || 1)
    list.style.listStyle = 'none'

    let index = first
    for (const item of list.children) {
      if (item.tagName !== 'LI') continue

      const marker = document.createElement('span')
      marker.textContent = ordered ? `${index}.` : '\u2022'
      marker.style.cssText = 'display:inline-block;width:1.5em;margin-left:-1.5em'
      item.insertBefore(marker, item.firstChild)
      index += 1
    }
  }
}

const buildOffscreenClone = (article) => {
  const container = document.createElement('div')
  container.className = 'pdf-paper'
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText = [
    'position:absolute',
    'top:0',
    'left:-100000px',
    `width:${CONTENT_PX.width}px`,
    'background:#ffffff',
    'pointer-events:none',
  ].join(';')

  const clone = article.cloneNode(true)
  clone.removeAttribute('id')
  clone.querySelectorAll('.no-print').forEach((node) => node.remove())
  clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'))
  clone.querySelectorAll('img').forEach((img) => {
    img.loading = 'eager'
    img.style.opacity = '1'
  })
  materialiseListMarkers(clone)

  container.appendChild(clone)
  document.body.appendChild(container)
  return { container, clone }
}

const imageCache = new Map()

// Images are embedded as-is where possible so nothing is re-compressed.
const encodeImage = async (element) => {
  const src = element.currentSrc || element.src
  if (imageCache.has(src)) return imageCache.get(src)

  const encode = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      if (blob.type === 'image/png' || blob.type === 'image/jpeg') {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        return { dataUrl, format: blob.type === 'image/png' ? 'PNG' : 'JPEG' }
      }
    } catch {
      // Fall through to rasterising whatever the browser managed to decode.
    }

    const canvas = document.createElement('canvas')
    canvas.width = element.naturalWidth || element.width
    canvas.height = element.naturalHeight || element.height
    if (!canvas.width || !canvas.height) return null

    const ctx = canvas.getContext('2d')
    ctx.drawImage(element, 0, 0)
    return { dataUrl: canvas.toDataURL('image/png'), format: 'PNG' }
  }

  const promise = encode().catch(() => null)
  imageCache.set(src, promise)
  return promise
}

const setFillColor = (pdf, color) => pdf.setFillColor(color.r, color.g, color.b)

const drawText = (pdf, op, y, katexFonts) => {
  const size = op.sizePx * PT_PER_PX
  if (size <= 0) return

  if (op.katex) {
    const fontName = katexFonts.get(`${op.family}|${op.variant}`)
    if (!fontName) return
    pdf.setFont(fontName, 'normal')
  } else {
    const mono = /mono|courier|consolas|menlo/i.test(op.family)
    pdf.setFont(mono ? 'courier' : 'helvetica', op.variant === 'regular' ? 'normal' : op.variant)
  }

  pdf.setFontSize(size)
  pdf.setTextColor(op.color.r, op.color.g, op.color.b)

  const text = op.katex ? op.text : toWinAnsi(op.text)
  const x = MARGIN.left + op.x * MM_PER_PX
  const targetWidth = op.width * MM_PER_PX

  // Nudge letter spacing so each run occupies exactly the width the browser
  // measured. Keeps runs from drifting out of their column.
  let charSpace = 0
  if (text.length > 1 && targetWidth > 0) {
    const naturalWidth = pdf.getTextWidth(text)
    const delta = targetWidth - naturalWidth
    if (Math.abs(delta) < targetWidth * 0.25) {
      charSpace = delta / (text.length - 1)
    }
  }

  if (charSpace) pdf.setCharSpace(charSpace)
  pdf.text(text, x, y, { baseline: 'alphabetic' })
  if (charSpace) pdf.setCharSpace(0)

  if (op.underline) {
    const thickness = Math.max(0.12, op.sizePx * 0.05 * MM_PER_PX)
    setFillColor(pdf, op.color)
    pdf.rect(x, y + op.sizePx * 0.12 * MM_PER_PX, targetWidth, thickness, 'F')
  }
}

export const exportArticlePdf = async ({ article, fileName, onProgress }) => {
  const report = (value) => onProgress && onProgress(Math.min(1, Math.max(0, value)))

  report(0.02)
  const { jsPDF } = await import('jspdf')

  const { container, clone } = buildOffscreenClone(article)

  try {
    await waitForImages(clone)
    if (document.fonts?.ready) await document.fonts.ready
    await nextPaint()
    report(0.1)

    const totalHeight = clone.getBoundingClientRect().height
    if (totalHeight < 1) throw new Error('The article has no measurable content to export')

    const breaks = computePageBreaks(collectBlocks(clone), totalHeight)
    const pageCount = breaks.length - 1

    const { ops, katexFaces } = collectDrawOps(clone)
    report(0.35)

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
      putOnlyUsedFonts: true,
    })
    pdf.setProperties({ title: fileName })

    const katexFonts = await embedKatexFonts(pdf, katexFaces)
    report(0.5)

    const images = new Map()
    await Promise.all(ops
      .filter((op) => op.kind === 'image')
      .map(async (op) => images.set(op, await encodeImage(op.element))))
    report(0.6)

    // Each operation belongs to the page its top edge falls on.
    const pageOf = (top) => {
      for (let i = pageCount - 1; i >= 0; i -= 1) {
        if (top >= breaks[i] - 0.5) return i
      }
      return 0
    }

    const buckets = Array.from({ length: pageCount }, () => [])
    for (const op of ops) {
      if (op.kind !== 'rect') {
        buckets[pageOf(op.kind === 'text' ? op.y - op.sizePx : op.y)].push(op)
        continue
      }

      // A code panel can now flow across a break, so the fill and borders
      // around it are repeated on every page they reach into.
      for (let page = pageOf(op.y); page <= pageOf(op.y + op.h); page += 1) {
        if (op.y < breaks[page + 1] && op.y + op.h > breaks[page]) buckets[page].push(op)
      }
    }

    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) pdf.addPage()
      const pageTop = breaks[page]
      const pageBottom = breaks[page + 1]

      for (const op of buckets[page]) {
        const y = MARGIN.top + (op.y - pageTop) * MM_PER_PX
        const x = MARGIN.left + op.x * MM_PER_PX

        if (op.kind === 'rect') {
          const top = Math.max(op.y, pageTop)
          const bottom = Math.min(op.y + op.h, pageBottom)
          const h = (bottom - top) * MM_PER_PX
          if (h <= 0.01) continue

          setFillColor(pdf, op.color)
          const w = op.w * MM_PER_PX
          const trimmed = top > op.y + 0.01 || bottom < op.y + op.h - 0.01
          const yTop = MARGIN.top + (top - pageTop) * MM_PER_PX

          // Rounding only survives while both ends of the shape are intact.
          if (op.radius > 0 && !trimmed) {
            const r = Math.min(op.radius * MM_PER_PX, w / 2, h / 2)
            pdf.roundedRect(x, yTop, w, h, r, r, 'F')
          } else {
            pdf.rect(x, yTop, w, h, 'F')
          }
        } else if (op.kind === 'image') {
          const image = images.get(op)
          if (image) {
            pdf.addImage(image.dataUrl, image.format, x, y, op.w * MM_PER_PX, op.h * MM_PER_PX, undefined, 'FAST')
          }
        } else if (op.kind === 'link') {
          pdf.link(x, y, op.w * MM_PER_PX, op.h * MM_PER_PX, { url: op.url })
        } else if (op.kind === 'text') {
          drawText(pdf, op, y, katexFonts)
        }
      }

      report(0.6 + 0.38 * ((page + 1) / pageCount))
    }

    pdf.save(`${fileName}.pdf`)
    report(1)
  } finally {
    container.remove()
  }
}
