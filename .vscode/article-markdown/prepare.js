// Rewrites article syntax into Markdown the built-in preview understands.
// Numbering matches the site: first \cite wins the number, labeled $$ blocks
// are numbered in order, and \ref prefers an equation label over a heading.

const htmlId = (value) =>
  value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'ref'

const uniqueId = (used, base) => {
  const cleaned = base.replace(/^-+|-+$/g, '') || 'ref'
  let id = cleaned
  let n = 2
  while (used.has(id)) id = `${cleaned}-${n++}`
  used.add(id)
  return id
}

const createHeadingId = (text) => text
  .replace(/\$\$?[^$]+\$\$?/g, '')
  .replace(/<[^>]+>/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')

const splitHeadingLabel = (raw) => {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(.*?)\s*\{#([A-Za-z0-9_-]+)\}\s*$/)
  if (!match) return { text: trimmed, slug: createHeadingId(trimmed), explicit: false }
  return { text: match[1].trim(), slug: match[2], explicit: true }
}

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const escapeLinkText = (text) => text
  .replace(/\\/g, '\\\\')
  .replace(/\[/g, '\\[')
  .replace(/\]/g, '\\]')
  .replace(/\n/g, ' ')

const needsPreview = (content) =>
  /\\(eqref|cite|ref)\{|^:::(?:sidenote|note)(?:[ \t]|$)|^```bib\b|\\label\{|^\\(?:begin|being)\{code\}|^!\[[^\]]*\]\([^)\n]+\)\s*\{#/m.test(content)

const parseBib = (source) => {
  const entries = []
  for (const line of source.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('%')) continue
    const match = trimmed.match(/^@(\S+)(?:\s+([\s\S]*))?$/)
    if (match) entries.push({ key: match[1], text: (match[2] || '').trim() })
    else if (entries.length) entries[entries.length - 1].text += ` ${trimmed}`
  }
  return entries
}

const readFence = (lines, start, marker) => {
  const body = []
  let index = start
  while (index < lines.length && lines[index].trim() !== marker) {
    body.push(lines[index])
    index += 1
  }
  return { body, next: index < lines.length ? index + 1 : index }
}

const fenceWrap = (language, body) => {
  let marker = '```'
  const payload = body.endsWith('\n') ? body : `${body}\n`
  while (payload.includes(marker)) marker += '`'
  return `${marker}${language}\n${payload}${marker}`
}

const codeEnvironment = (line) => {
  const match = line.match(/^\\(?:begin|being)\{code\}(?:\{([^{}]*)\}|\[([^\]]*)\])?\s*$/)
  if (!match) return null
  return (match[1] || match[2] || 'text').trim() || 'text'
}

const labeledImage = (line) => {
  const match = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*\{#([A-Za-z0-9:_-]+)\}\s*$/)
  if (!match) return null
  return { alt: match[1], src: match[2], caption: match[3] || '', label: match[4] }
}

const readCodeEnvironment = (lines, start, language) => {
  const body = []
  let index = start + 1
  while (index < lines.length && !/^\\end\{code\}\s*$/.test(lines[index])) {
    body.push(lines[index])
    index += 1
  }
  return { language, code: body.join('\n'), next: index < lines.length ? index + 1 : index }
}

const tokenize = (content, ctx, lineOffset = 0) => {
  const lines = content.split('\n')
  const tokens = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const fence = line.match(/^(```+|~~~+)(.*)$/)
    if (fence && fence[1].length >= 3) {
      const marker = fence[1]
      const info = fence[2].trim().split(/\s+/)[0] || ''
      const { body, next } = readFence(lines, index + 1, marker)
      if (info === 'bib') {
        if (ctx.bibSourceLine == null) ctx.bibSourceLine = lineOffset + index
        ctx.bib.push(...parseBib(body.join('\n')))
      } else {
        tokens.push({
          type: 'raw',
          value: lines.slice(index, next).join('\n'),
          sourceLine: lineOffset + index,
        })
      }
      index = next
      continue
    }

    const language = codeEnvironment(line.trim())
    if (language) {
      const code = readCodeEnvironment(lines, index, language)
      tokens.push({ type: 'code', language: code.language, code: code.code, sourceLine: lineOffset + index })
      index = code.next
      continue
    }

    const image = labeledImage(line.trim())
    if (image) {
      tokens.push({ type: 'figure', ...image, sourceLine: lineOffset + index })
      index += 1
      continue
    }

    const note = line.match(/^:::(sidenote|note)(?:[ \t]+(.*))?$/)
    if (note) {
      const title = (note[2] || '').trim()
      const noteLine = lineOffset + index
      const body = []
      index += 1
      let nested = null
      while (index < lines.length) {
        const innerFence = !nested && lines[index].match(/^(```+|~~~+)/)
        if (innerFence) nested = innerFence[1]
        else if (nested && lines[index].trim() === nested) nested = null
        else if (!nested && lines[index].trim() === ':::') break
        body.push(lines[index])
        index += 1
      }
      const closeLine = index < lines.length ? lineOffset + index : lineOffset + lines.length - 1
      if (index < lines.length && lines[index].trim() === ':::') index += 1
      tokens.push({
        type: 'note',
        title,
        sourceLine: noteLine,
        closeLine,
        tokens: body.length ? tokenize(body.join('\n'), ctx, noteLine + 1) : [],
      })
      continue
    }

    if (line.trim() === '$$') {
      const start = index
      const body = []
      index += 1
      while (index < lines.length && lines[index].trim() !== '$$') {
        body.push(lines[index])
        index += 1
      }
      const closed = index < lines.length
      if (closed) index += 1
      const raw = lines.slice(start, closed ? index : lines.length).join('\n')
      const token = closed ? mathToken(raw, body.join('\n')) : { type: 'raw', value: raw }
      token.sourceLine = lineOffset + start
      tokens.push(token)
      continue
    }

    const single = line.match(/^\$\$([\s\S]+)\$\$$/)
    if (single) {
      const token = mathToken(line, single[1])
      token.sourceLine = lineOffset + index
      tokens.push(token)
      index += 1
      continue
    }

    const sourceLine = lineOffset + index
    const headingId = recordHeading(line, ctx, sourceLine)
    tokens.push({ type: 'line', value: line, sourceLine, headingId })
    index += 1
  }

  return tokens
}

const recordHeading = (line, ctx, sourceLine) => {
  const match = line.match(/^(#{1,6})[ \t]+(.*)$/)
  if (!match) return null
  const label = splitHeadingLabel(match[2])
  if (!ctx.headings.has(label.slug)) ctx.headings.set(label.slug, label.text || label.slug)
  const id = uniqueId(ctx.usedIds, label.slug)
  ctx.headingIds.set(sourceLine, id)
  return id
}

const mathToken = (raw, latex) => {
  const labels = []
  const stripped = latex.replace(/\\label\{([^}]*)\}/g, (match, id) => {
    const label = id.trim()
    if (label) labels.push(label)
    return ''
  })
  if (!labels.length) return { type: 'raw', value: raw }
  return { type: 'equation', labels, label: labels[0], latex: stripped.trim() }
}

const assignEquations = (tokens, ctx) => {
  for (const token of tokens) {
    if (token.type === 'equation') {
      ctx.equationCount += 1
      token.n = ctx.equationCount
      token.id = uniqueId(ctx.usedIds, `equation-${htmlId(token.label)}`)
      for (const label of token.labels) ctx.equations.set(label, token)
    } else if (token.type === 'note') assignEquations(token.tokens, ctx)
  }
}

const assignFigures = (tokens, ctx) => {
  for (const token of tokens) {
    if (token.type === 'figure') {
      ctx.figureCount += 1
      token.n = ctx.figureCount
      token.id = uniqueId(ctx.usedIds, `figure-${htmlId(token.label)}`)
      if (!ctx.figures.has(token.label)) ctx.figures.set(token.label, token)
    } else if (token.type === 'note') {
      assignFigures(token.tokens, ctx)
    }
  }
}

const commandPattern = () => /`[^`]*`|\$\$[\s\S]*?\$\$|\$[^$\n]*\$|\\(eqref|cite|ref)\{([^}]+)\}/g

const collectCites = (tokens, ctx) => {
  const visit = (line) => {
    for (const match of line.matchAll(commandPattern())) {
      if (match[1] !== 'cite') continue
      for (const key of match[2].split(',').map((part) => part.trim()).filter(Boolean)) {
        if (ctx.cites.has(key)) continue
        ctx.cites.set(key, ctx.cites.size + 1)
        ctx.citeIds.set(key, uniqueId(ctx.usedIds, `citation-${htmlId(key)}`))
      }
    }
  }
  for (const token of tokens) {
    if (token.type === 'line') visit(token.value)
    else if (token.type === 'note') collectCites(token.tokens, ctx)
  }
}

const replaceCommands = (text, ctx) => text.replace(commandPattern(), (match, command, arg) => {
  if (!command) return match
  if (command === 'cite') {
    const keys = arg.split(',').map((part) => part.trim()).filter(Boolean)
    if (!keys.length) return match
    return keys.map((key) => {
      const id = ctx.citeIds.get(key)
      const n = ctx.cites.get(key)
      return id ? `[[${n}]](#${id})` : match
    }).join(', ')
  }

  const label = arg.trim()
  const equation = ctx.equations.get(label)
  if (equation) return `[[${equation.n}]](#${equation.id})`
  const figure = ctx.figures.get(label)
  if (figure) return `[Figure ${figure.n}](#${figure.id})`
  if (command === 'eqref') return `[[?]](#equation-${htmlId(label)})`
  const heading = ctx.headings.get(label)
  return `[${escapeLinkText(heading || label)}](#${label})`
})

const emit = (tokens, ctx) => {
  const parts = tokens.map((token) => {
    if (token.type === 'raw') {
      const lines = token.value.split('\n')
      return {
        content: token.value,
        lineMap: lines.map((_, index) => token.sourceLine + index),
      }
    }

    if (token.type === 'code') {
      const content = fenceWrap(token.language, token.code)
      return { content, lineMap: content.split('\n').map(() => token.sourceLine) }
    }

    if (token.type === 'figure') {
      const content = fenceWrap('article-figure', JSON.stringify({
        id: token.id,
        n: token.n,
        alt: token.alt,
        src: token.src,
        caption: token.caption,
      }))
      return { content, lineMap: content.split('\n').map(() => token.sourceLine) }
    }

    if (token.type === 'equation') {
      const latex = token.latex ? `${token.latex} \\tag{${token.n}}` : `\\tag{${token.n}}`
      const content = `<a id="${token.id}"></a>\n\n$$\n${latex}\n$$`
      return { content, lineMap: content.split('\n').map(() => token.sourceLine) }
    }

    if (token.type === 'note') {
      const title = token.title || 'Side note'
      const body = emit(token.tokens, ctx)
      const content = `:::note ${title}\n${body.content}\n:::`
      const bodyMap = body.lineMap.length ? body.lineMap : [token.sourceLine + 1]
      return {
        content,
        lineMap: [token.sourceLine, ...bodyMap, token.closeLine],
      }
    }

    const heading = token.value.match(/^(#{1,6})([ \t]+)(.*)$/)
    const label = heading ? splitHeadingLabel(heading[3]) : null
    const content = heading
      ? `${heading[1]}${heading[2]}${replaceCommands(label.text, ctx)}`
      : replaceCommands(token.value, ctx)

    return { content, lineMap: content.split('\n').map(() => token.sourceLine) }
  })

  return {
    content: parts.map((part) => part.content).join('\n'),
    lineMap: parts.flatMap((part) => part.lineMap),
  }
}

const linkify = (text) => {
  const escaped = escapeHtml(text)
  return escaped.replace(/https?:\/\/[^\s<]+/g, (url) => {
    const trimmed = url.replace(/[.,;:)]+$/, '')
    const rest = url.slice(trimmed.length)
    return `<a href="${trimmed}">${trimmed}</a>${rest}`
  })
}

const bibliography = (ctx) => {
  const byKey = new Map()
  for (const entry of ctx.bib) {
    if (!byKey.has(entry.key)) byKey.set(entry.key, entry.text)
  }

  const rows = []
  for (const [key, n] of ctx.cites) {
    rows.push({
      id: ctx.citeIds.get(key),
      text: byKey.get(key) || `Missing bibliography entry for ${key}.`,
    })
  }
  const seen = new Set(ctx.cites.keys())
  for (const entry of ctx.bib) {
    if (seen.has(entry.key)) continue
    seen.add(entry.key)
    rows.push({
      id: uniqueId(ctx.usedIds, `citation-${htmlId(entry.key)}`),
      text: entry.text,
    })
  }
  if (!rows.length) return ''

  const slug = ctx.headings.has('references') ? 'article-references' : 'references'
  const items = rows.map((row) => `<li><a id="${row.id}"></a>${linkify(row.text)}</li>`).join('\n')
  return `\n\n<h2 id="${slug}">References</h2>\n<ol>\n${items}\n</ol>\n`
}

const preparePreviewMarkdown = (content, withSourceMap = false) => {
  const normalized = content.replace(/\r\n/g, '\n')
  if (!needsPreview(normalized)) {
    if (!withSourceMap) return content
    return {
      content,
      sourceLineMap: normalized.split('\n').map((_, index) => index),
      headingIds: {},
    }
  }

  const ctx = {
    equations: new Map(),
    equationCount: 0,
    figures: new Map(),
    figureCount: 0,
    bib: [],
    bibSourceLine: null,
    headings: new Map(),
    headingIds: new Map(),
    cites: new Map(),
    citeIds: new Map(),
    usedIds: new Set(),
  }
  const tokens = tokenize(normalized, ctx)
  assignEquations(tokens, ctx)
  assignFigures(tokens, ctx)
  collectCites(tokens, ctx)

  const emitted = emit(tokens, ctx)
  const body = emitted.content.replace(/\n*$/, '')
  const lineMap = emitted.lineMap.slice(0, body.split('\n').length)
  const references = bibliography(ctx)
  const prepared = `${body}${references}`
  const outputLineCount = prepared.split('\n').length
  const fallbackLine = ctx.bibSourceLine ?? normalized.split('\n').length - 1
  while (lineMap.length < outputLineCount) lineMap.push(fallbackLine)
  lineMap.length = outputLineCount

  const result = {
    content: prepared,
    sourceLineMap: lineMap,
    headingIds: Object.fromEntries(ctx.headingIds),
  }
  return withSourceMap ? result : result.content
}

module.exports = { preparePreviewMarkdown }
