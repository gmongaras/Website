// Markdown helpers shared by the blog renderer and its table of contents.
//
// Article bodies are rendered by react-markdown, but a few strings arrive as
// raw markdown outside of that pipeline (image captions and heading text), so
// the small subset of syntax the articles actually use is expanded here.

import katex from 'katex'

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g
const STRONG = /\*\*(.*?)\*\*/g
const EMPHASIS = /\*(.*?)\*/g
const INLINE_CODE = /`(.*?)`/g
const INLINE_MATH = /\$([^$]+)\$/g
const BLOCK_MATH = /\$\$([^$]+)\$\$/g

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const renderMath = (latex, displayMode) => {
  try {
    return katex.renderToString(latex, { displayMode })
  } catch {
    return null
  }
}

const inlineMath = (match, latex) => renderMath(latex, false)
  ?? `<span class="text-red-400">LaTeX Error: ${latex}</span>`

const blockMath = (match, latex) => {
  const rendered = renderMath(latex, true)
  return rendered
    ? `<div class="my-6 text-center">${rendered}</div>`
    : `<div class="my-6 text-center text-red-400">LaTeX Error: ${latex}</div>`
}

// Captions come from the markdown image title, which react-markdown hands over
// verbatim. Bold is deliberately absent: captions use single asterisks for
// emphasis and doubling them up has never been part of the article syntax.
export const renderCaptionHtml = (caption) => escapeHtml(caption)
  .replace(LINK, '<a href="$2" target="_blank" rel="noreferrer" class="underline">$1</a>')
  .replace(EMPHASIS, '<em>$1</em>')
  .replace(INLINE_CODE, '<code class="bg-white/10 px-1 py-0.5 rounded text-sm">$1</code>')
  .replace(INLINE_MATH, inlineMath)
  .replace(BLOCK_MATH, blockMath)

// Table-of-contents entries keep their maths and drop everything else, since
// the surrounding markup belongs to the TOC. Unparseable maths is left as the
// literal source rather than shouting an error in the sidebar.
export const renderHeadingMathHtml = (text) => escapeHtml(text)
  .replace(BLOCK_MATH, (match, latex) => renderMath(latex, true) ?? match)
  .replace(INLINE_MATH, (match, latex) => renderMath(latex, false) ?? match)

// Anchor ids are derived from the heading source so that a link built from the
// markdown matches the id the renderer puts on the element.
export const createHeadingId = (text) => text
  .replace(/\$\$?[^$]+\$\$?/g, '')
  .replace(/<[^>]+>/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')

export const extractHeadings = (content) => content
  .split(/\r?\n/)
  .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
  .filter(Boolean)
  .map(([, hashes, rawText]) => {
    const text = rawText.trim()
    return { level: hashes.length, text, slug: createHeadingId(text) }
  })

// Level-2 headings become sections; level-3 headings nest under the section
// above them and are dropped if they appear before any section.
export const buildTocTree = (headings) => {
  const tree = []

  for (const heading of headings) {
    if (heading.level === 2) {
      tree.push({ ...heading, children: [] })
    } else if (tree.length) {
      tree[tree.length - 1].children.push(heading)
    }
  }

  return tree
}

// Older articles use {{code(lang)}} and {{youtube(url)}} blocks. Rewriting them
// as fenced blocks lets the standard markdown pipeline handle both syntaxes.
export const normalizeLegacyMarkdown = (content) => content
  .replace(
    /^\{\{code\(([^)]*)\)\}\}\r?\n([\s\S]*?)^\{\{code\}\}$/gm,
    (match, language, code) => `\n\`\`\`${language.trim() || 'text'}\n${code}\n\`\`\`\n`,
  )
  .replace(
    /^\{\{youtube\(([^)]+)\)\}\}$/gm,
    (match, url) => `\n\`\`\`youtube\n${url}\n\`\`\`\n`,
  )

export const getYoutubeVideoId = (url) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1]
  }
  if (url.includes('youtu.be/')) {
    return url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1]
  }
  return url.match(/^[a-zA-Z0-9_-]{11}$/)?.[0]
}
