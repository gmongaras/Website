const { preparePreviewMarkdown } = require('./prepare')

const sidenote = (md) => {
  md.block.ruler.before('fence', 'sidenote', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const line = state.src.slice(start, state.eMarks[startLine])
    const match = line.match(/^:::(sidenote|note)(?:[ \t]+(.*))?$/)
    if (!match) return false
    if (silent) return true

    let next = startLine + 1
    let nested = null
    while (next < endLine) {
      const pos = state.bMarks[next] + state.tShift[next]
      const text = state.src.slice(pos, state.eMarks[next])
      const fence = !nested && text.match(/^(```+|~~~+)/)
      if (fence) nested = fence[1]
      else if (nested && text.trim() === nested) nested = null
      else if (!nested && text.trim() === ':::') break
      next += 1
    }

    const open = state.push('sidenote_open', 'details', 1)
    open.block = true
    open.info = (match[2] || '').trim() || 'Side note'
    open.map = [startLine, next]
    open.attrJoin('class', 'article-note')

    const parent = state.parentType
    const lineMax = state.lineMax
    state.parentType = 'sidenote'
    state.lineMax = next
    state.md.block.tokenize(state, startLine + 1, next)
    state.parentType = parent
    state.lineMax = lineMax

    const close = state.push('sidenote_close', 'details', -1)
    close.block = true
    const closeLine = next < endLine ? next : Math.max(startLine, endLine - 1)
    close.map = [closeLine, Math.min(closeLine + 1, endLine)]
    state.line = Math.min(next + 1, endLine)
    return true
  })

  md.renderer.rules.sidenote_open = (tokens, idx) =>
    `<details${md.renderer.renderAttrs(tokens[idx])}><summary>${md.renderInline(tokens[idx].info)}</summary>\n`
  md.renderer.rules.sidenote_close = (tokens, idx) =>
    `</details>\n<div${md.renderer.renderAttrs(tokens[idx])}>&#8203;</div>\n`

  const renderFence = md.renderer.rules.fence
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (token.info.trim() !== 'article-figure') {
      return renderFence
        ? renderFence(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options)
    }

    try {
      const figure = JSON.parse(token.content)
      const escape = md.utils.escapeHtml
      const caption = figure.caption ? ` ${md.renderInline(figure.caption)}` : ''
      return `<figure id="${escape(figure.id)}" class="article-figure">`
        + `<img src="${escape(figure.src)}" alt="${escape(figure.alt)}">`
        + `<figcaption>Figure ${figure.n}.${caption}</figcaption></figure>\n`
    } catch {
      return renderFence
        ? renderFence(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options)
    }
  }
}

function activate() {
  return {
    extendMarkdownIt(md) {
      sidenote(md)
      const parse = md.parse.bind(md)
      md.parse = (src, env) => {
        if (env?.articlePreview) return parse(src, env)
        const prepared = preparePreviewMarkdown(src, true)
        const next = env ? Object.create(env) : {}
        next.articlePreview = true
        const tokens = parse(prepared.content, next)

        for (const token of tokens) {
          if (!token.map) continue

          const [start, end] = token.map
          const sourceLine = prepared.sourceLineMap[start] ?? start
          const sourceEnd = end > start
            ? (prepared.sourceLineMap[end - 1] ?? sourceLine) + 1
            : sourceLine + 1

          token.map = [sourceLine, sourceEnd]
          token.attrSet('data-line', String(sourceLine))

          if (token.type === 'heading_open') {
            const headingId = prepared.headingIds[sourceLine]
            if (headingId) token.attrSet('id', headingId)
          }
        }

        return tokens
      }
      return md
    },
  }
}

function deactivate() {}

module.exports = { activate, deactivate }
