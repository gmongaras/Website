import { Children, isValidElement, memo, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import katex from 'katex'
import { ChevronRight } from 'lucide-react'
import 'katex/dist/katex.min.css'
import { katexMacros } from '../../katexMacros'
import { getYoutubeVideoId, normalizeLegacyMarkdown, splitHeadingLabel } from '../../lib/markdown'
import { PrintModeContext } from '../PrintModeContext'
import CodeBlock from './CodeBlock'
import Figure from './Figure'
import YouTubeEmbed from './YouTubeEmbed'

const HEADING_CLASSES = {
  1: 'text-3xl font-bold mt-8 mb-6 text-white',
  2: 'text-2xl font-bold mt-8 mb-4 text-white',
  3: 'text-xl font-bold mt-8 mb-4 text-white',
}

const MarkdownImage = ({ src, alt, title }) => (
  <Figure alt={alt || ''} src={src} caption={title} />
)

// An image on its own line is parsed as a paragraph containing an image. The
// wrapping <p> is dropped so the figure keeps its own block spacing.
const MarkdownParagraph = ({ children }) => (
  Children.count(children) === 1 && isValidElement(children) && children.type === MarkdownImage
    ? children
    : <p className="mb-4 text-white/90 leading-relaxed">{children}</p>
)

const stripExplicitId = (children) => {
  const list = Children.toArray(children)
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (typeof list[index] !== 'string') continue
    list[index] = list[index].replace(/\s*\{#[A-Za-z0-9_-]+\}\s*$/, '')
    if (!list[index]) list.splice(index, 1)
    break
  }
  return list
}

const MarkdownHeading = ({ level, children }) => {
  const text = Children.toArray(children)
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('')
  const label = splitHeadingLabel(text)
  const Tag = `h${level}`

  return (
    <Tag id={label.slug} className={`${HEADING_CLASSES[level]} scroll-mt-24`}>
      {label.explicit ? stripExplicitId(children) : children}
    </Tag>
  )
}

const Equation = ({ id, n, href, latex }) => {
  const html = katex.renderToString(latex || '', {
    displayMode: true,
    macros: { ...katexMacros },
    throwOnError: false,
  })

  return (
    <div id={id} className="equation pdf-block scroll-mt-24">
      <div className="equation-body" dangerouslySetInnerHTML={{ __html: html }} />
      <a href={href} className="equation-number article-ref">[{n}]</a>
    </div>
  )
}

const SideNote = ({ title, body }) => {
  const printing = useContext(PrintModeContext)

  return (
    <details className="article-note" open={printing ? true : undefined}>
      <summary>
        <ChevronRight className="article-note-chevron" aria-hidden />
        <span>{title || 'Side note'}</span>
      </summary>
      <div className="article-note-body">
        <MarkdownContent content={body} />
      </div>
    </details>
  )
}

const Bibliography = ({ entries }) => (
  <ol className="article-references">
    {entries.map((entry) => (
      <li key={entry.id} id={entry.id} value={entry.n} className="scroll-mt-24">
        <MarkdownContent content={entry.text} compact />
      </li>
    ))}
  </ol>
)

// react-markdown routes both inline code and fenced blocks here. Fenced blocks
// carry a language class; the "youtube" language is treated as an embed.
const MarkdownCode = ({ className, children, inline }) => {
  const rawCode = String(children)

  if (inline || (!className && !rawCode.includes('\n'))) {
    return <code>{children}</code>
  }

  const language = className?.replace('language-', '') || 'text'
  const code = rawCode.replace(/\n$/, '')

  if (language === 'equation' || language === 'sidenote' || language === 'bibliography') {
    try {
      const data = JSON.parse(code)
      if (language === 'equation') return <Equation {...data} />
      if (language === 'sidenote') return <SideNote title={data.title} body={data.body} />
      return <Bibliography entries={data.entries || []} />
    } catch {
      // A broken payload is still shown, as a code block, so the source is visible.
    }
  }

  if (language === 'youtube') {
    const videoId = getYoutubeVideoId(code)
    return videoId ? <YouTubeEmbed videoId={videoId} /> : <code>{children}</code>
  }

  return <CodeBlock code={code} language={language} />
}

const COMPONENTS = {
  p: MarkdownParagraph,
  img: MarkdownImage,
  h1: (props) => <MarkdownHeading level={1} {...props} />,
  h2: (props) => <MarkdownHeading level={2} {...props} />,
  h3: (props) => <MarkdownHeading level={3} {...props} />,
  ul: ({ children }) => <ul className="list-disc list-outside mb-4 space-y-1 ml-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside mb-4 space-y-1 ml-6">{children}</ol>,
  li: ({ children }) => <li className="mb-1 pl-2 leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-accent/50 pl-4 my-4 text-white/80">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="table-scroll my-4">
      <table>{children}</table>
    </div>
  ),
  // CodeBlock and YouTubeEmbed bring their own container, so <pre> is dropped.
  pre: ({ children }) => <>{children}</>,
  code: MarkdownCode,
  a: ({ href, children }) => {
    const internal = typeof href === 'string' && (href.startsWith('#') || href.startsWith('/'))
    return (
      <a
        href={href}
        className={typeof href === 'string' && (href.startsWith('/blog/') || href.startsWith('#blog/')) ? 'article-ref' : undefined}
        target={internal ? undefined : '_blank'}
        rel={internal ? undefined : 'noreferrer'}
      >
        {children}
      </a>
    )
  },
}

const REMARK_PLUGINS = [remarkGfm, remarkMath]

const MarkdownContent = memo(({ content, compact = false }) => (
  <div className={compact ? 'article-markdown-compact text-white/90' : 'blog-markdown text-white/90'}>
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={[[rehypeKatex, { macros: { ...katexMacros } }]]}
      components={COMPONENTS}
    >
      {normalizeLegacyMarkdown(content)}
    </ReactMarkdown>
  </div>
))

MarkdownContent.displayName = 'MarkdownContent'

export default MarkdownContent
