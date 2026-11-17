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

    const parent = state.parentType
    const lineMax = state.lineMax
    state.parentType = 'sidenote'
    state.lineMax = next
    state.md.block.tokenize(state, startLine + 1, next)
    state.parentType = parent
    state.lineMax = lineMax

    state.push('sidenote_close', 'details', -1).block = true
    state.line = Math.min(next + 1, endLine)
    return true
  })

  md.renderer.rules.sidenote_open = (tokens, idx) =>
    `<details class="article-note"><summary>${md.utils.escapeHtml(tokens[idx].info)}</summary>\n`
  md.renderer.rules.sidenote_close = () => '</details>\n'
}

function activate() {
  return {
    extendMarkdownIt(md) {
      sidenote(md)
      const parse = md.parse.bind(md)
      md.parse = (src, env) => {
        if (env?.articlePreview) return parse(src, env)
        const next = env ? Object.create(env) : {}
        next.articlePreview = true
        return parse(preparePreviewMarkdown(src), next)
      }
      return md
    },
  }
}

function deactivate() {}

module.exports = { activate, deactivate }
