// Article-only markdown, rewritten before react-markdown sees it.
//
// Citations
//   \cite{vaswani2017}              → [1]
//   \cite{vaswani2017, bahdanau2014} → [1], [2]
//   A ```bib fence holds the entries, one per line:
//     @vaswani2017 Vaswani et al. Attention Is All You Need. 2017. https://arxiv.org/abs/1706.03762
//   Lines starting with % are comments. The list is rendered at the end.
//
// Side notes
//   :::note Title
//   Optional paragraphs, math, and citations.
//   :::
//
// Numbered equations. Only a display block that contains \label is numbered.
//   $$
//   \label{eq:cost}
//   T(n) = \bigo(n)
//   $$
//   \eqref{eq:cost} → [1], and \ref{eq:cost} does the same.
//
// Sections
//   \ref{softmax-attention} links to the heading with that id.
//   ## Softmax Attention {#softmax} pins the id instead of deriving it.

import { createHeadingId, normalizeLegacyMarkdown, splitHeadingLabel } from './markdown'

const htmlId = (value) =>
  value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'ref'

const uniqueId = (ctx, base) => {
  const cleaned = base.replace(/^-+|-+$/g, '') || 'ref'
  let id = cleaned
  let n = 2
  while (ctx.usedIds.has(id)) {
    id = `${cleaned}-${n}`
    n += 1
  }
  ctx.usedIds.add(id)
  return id
}

const fenceWrap = (language, body) => {
  let marker = '```'
  const payload = body.endsWith('\n') ? body : `${body}\n`
  while (payload.includes(marker)) marker += '`'
  return `${marker}${language}\n${payload}${marker}`
}

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
  return {
    body,
    next: index < lines.length ? index + 1 : index,
    closeLine: index < lines.length ? lines[index] : null,
  }
}

// A trailing CR has to be ignored by the matchers. `.` does not consume it and
// `$` does not treat it as the end of the line, so a CRLF article would miss
// every fence, note, and heading. The original line is what gets written back.
const bareLine = (line) => (line.endsWith('\r') ? line.slice(0, -1) : line)

const recordHeading = (line, ctx) => {
  const match = bareLine(line).match(/^(#{1,6})[ \t]+(.*)$/)
  if (!match) return
  const label = splitHeadingLabel(match[2])
  if (!ctx.headings.has(label.slug)) ctx.headings.set(label.slug, label.text || label.slug)
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

const tokenize = (content, ctx) => {
  const lines = content.split('\n')
  const tokens = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const bare = bareLine(line)
    const fence = bare.match(/^(```+|~~~+)(.*)$/)
    if (fence && fence[1].length >= 3) {
      const marker = fence[1]
      const info = fence[2].trim().split(/\s+/)[0] || ''
      const { body, next, closeLine } = readFence(lines, index + 1, marker)
      const rawLines = [line, ...body]
      if (closeLine != null) rawLines.push(closeLine)
      if (info === 'bib') ctx.bib.push(...parseBib(body.join('\n')))
      else tokens.push({ type: 'raw', value: rawLines.join('\n') })
      index = next
      continue
    }

    const note = bare.match(/^:::(sidenote|note)(?:[ \t]+(.*))?$/)
    if (note) {
      const title = (note[2] || '').trim()
      const body = []
      index += 1
      while (index < lines.length && lines[index].trim() !== ':::') {
        const inner = bareLine(lines[index]).match(/^(```+|~~~+)(.*)$/)
        if (inner && inner[1].length >= 3) {
          const marker = inner[1]
          const { body: innerBody, next, closeLine } = readFence(lines, index + 1, marker)
          body.push(lines[index], ...innerBody)
          if (closeLine != null) body.push(closeLine)
          index = next
          continue
        }
        body.push(lines[index])
        index += 1
      }
      if (index < lines.length && lines[index].trim() === ':::') index += 1
      tokens.push({
        type: 'note',
        title,
        tokens: body.length ? tokenize(body.join('\n'), ctx) : [],
      })
      continue
    }

    if (line.trim() === '$$') {
      const body = []
      const start = index
      index += 1
      while (index < lines.length && lines[index].trim() !== '$$') {
        body.push(lines[index])
        index += 1
      }
      const closed = index < lines.length
      const end = closed ? index : lines.length - 1
      if (closed) index += 1
      const raw = lines.slice(start, end + 1).join('\n')
      tokens.push(closed ? mathToken(raw, body.join('\n')) : { type: 'raw', value: raw })
      continue
    }

    const single = bare.match(/^\$\$([\s\S]+)\$\$$/)
    if (single) {
      tokens.push(mathToken(line, single[1]))
      index += 1
      continue
    }

    recordHeading(line, ctx)
    tokens.push({ type: 'line', value: line })
    index += 1
  }

  return tokens
}

const assignEquations = (tokens, ctx) => {
  for (const token of tokens) {
    if (token.type === 'equation') {
      ctx.equationCount += 1
      token.n = ctx.equationCount
      token.id = uniqueId(ctx, `equation-${htmlId(token.label)}`)
      for (const label of token.labels) ctx.equations.set(label, token)
    } else if (token.type === 'note') {
      assignEquations(token.tokens, ctx)
    }
  }
}

const visitCommands = (text, visitor) => {
  const pattern = /`[^`]*`|\$\$[\s\S]*?\$\$|\$[^$\n]*\$|\\(eqref|cite|ref)\{([^}]+)\}/g
  for (const match of text.matchAll(pattern)) {
    if (match[1]) visitor(match[1], match[2])
  }
}

const collectCites = (tokens, ctx) => {
  const visitLine = (line) => {
    visitCommands(line, (command, arg) => {
      if (command !== 'cite') return
      for (const key of arg.split(',').map((part) => part.trim()).filter(Boolean)) {
        if (ctx.cites.has(key)) continue
        ctx.cites.set(key, ctx.cites.size + 1)
        ctx.citeIds.set(key, uniqueId(ctx, `citation-${htmlId(key)}`))
      }
    })
  }

  for (const token of tokens) {
    if (token.type === 'line') visitLine(token.value)
    else if (token.type === 'note') collectCites(token.tokens, ctx)
  }
}

const articleHref = (slug, id) => (slug ? `#blog/${slug}/${id}` : `#${id}`)

const escapeLinkText = (text) => text
  .replace(/\\/g, '\\\\')
  .replace(/\[/g, '\\[')
  .replace(/\]/g, '\\]')
  .replace(/\n/g, ' ')

const markdownLink = (text, href) => `[${escapeLinkText(text)}](${href})`

const bracketLink = (n, href) => `[[${n}]](${href})`

const replaceCommands = (text, ctx, slug) => {
  const pattern = /`[^`]*`|\$\$[\s\S]*?\$\$|\$[^$\n]*\$|\\(eqref|cite|ref)\{([^}]+)\}/g
  return text.replace(pattern, (match, command, arg) => {
    if (!command) return match
    if (command === 'cite') {
      const keys = arg.split(',').map((part) => part.trim()).filter(Boolean)
      if (!keys.length) return match
      return keys.map((key) => {
        const id = ctx.citeIds.get(key)
        const n = ctx.cites.get(key)
        return id ? bracketLink(n, articleHref(slug, id)) : match
      }).join(', ')
    }

    const label = arg.trim()
    const equation = ctx.equations.get(label)
    if (equation) return bracketLink(equation.n, articleHref(slug, equation.id))
    if (command === 'eqref') return bracketLink('?', articleHref(slug, `equation-${htmlId(label)}`))

    const heading = ctx.headings.get(label)
    return markdownLink(heading || label, articleHref(slug, label))
  })
}

const emitLine = (line, ctx, slug) => {
  const bare = bareLine(line)
  const carriage = line.endsWith('\r') ? '\r' : ''
  const heading = bare.match(/^(#{1,6})([ \t]+)(.*)$/)
  if (!heading) return `${replaceCommands(bare, ctx, slug)}${carriage}`

  const replaced = replaceCommands(heading[3], ctx, slug)
  if (replaced === heading[3]) return line

  const label = splitHeadingLabel(heading[3])
  const id = label.explicit ? label.slug : createHeadingId(label.text)
  return `${heading[1]}${heading[2]}${replaceCommands(label.text, ctx, slug)} {#${id}}${carriage}`
}

const emit = (tokens, ctx, slug) => tokens.map((token) => {
  if (token.type === 'line') return emitLine(token.value, ctx, slug)
  if (token.type === 'raw') return token.value
  if (token.type === 'equation') {
    return fenceWrap('equation', JSON.stringify({
      id: token.id,
      n: token.n,
      href: articleHref(slug, token.id),
      latex: token.latex,
      label: token.label,
    }))
  }
  if (token.type === 'note') {
    return fenceWrap('sidenote', JSON.stringify({
      title: token.title,
      body: emit(token.tokens, ctx, slug),
    }))
  }
  return ''
}).join('\n')

const bibliographyEntries = (ctx) => {
  const byKey = new Map()
  for (const entry of ctx.bib) {
    if (!byKey.has(entry.key)) byKey.set(entry.key, entry.text)
  }

  const rows = []
  for (const [key, n] of ctx.cites) {
    rows.push({
      id: ctx.citeIds.get(key),
      n,
      text: byKey.get(key) || `Missing bibliography entry for \`${key}\`.`,
    })
  }

  const seen = new Set(ctx.cites.keys())
  let next = ctx.cites.size
  for (const entry of ctx.bib) {
    if (seen.has(entry.key)) continue
    seen.add(entry.key)
    next += 1
    rows.push({
      id: uniqueId(ctx, `citation-${htmlId(entry.key)}`),
      n: next,
      text: entry.text,
    })
  }
  return rows
}

export const prepareArticleMarkdown = (content, slug = '') => {
  const ctx = {
    equations: new Map(),
    equationCount: 0,
    bib: [],
    headings: new Map(),
    cites: new Map(),
    citeIds: new Map(),
    usedIds: new Set(),
    referencesSlug: null,
  }

  const tokens = tokenize(normalizeLegacyMarkdown(content), ctx)
  for (const id of ctx.headings.keys()) ctx.usedIds.add(id)
  assignEquations(tokens, ctx)
  collectCites(tokens, ctx)

  if (ctx.bib.length || ctx.cites.size) {
    ctx.referencesSlug = ctx.headings.has('references') ? 'article-references' : 'references'
    ctx.headings.set(ctx.referencesSlug, 'References')
    ctx.usedIds.add(ctx.referencesSlug)
  }

  let rendered = emit(tokens, ctx, slug)
  if (!ctx.referencesSlug) return rendered

  const heading = ctx.referencesSlug === 'references'
    ? '## References'
    : `## References {#${ctx.referencesSlug}}`
  const block = fenceWrap('bibliography', JSON.stringify({ entries: bibliographyEntries(ctx) }))
  rendered = rendered.replace(/\n*$/, '')
  return `${rendered}\n\n${heading}\n\n${block}\n`
}
