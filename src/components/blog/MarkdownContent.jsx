import { Children, isValidElement, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { createHeadingId, getYoutubeVideoId, normalizeLegacyMarkdown } from '../../lib/markdown'
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

const MarkdownHeading = ({ level, children }) => {
  const text = Children.toArray(children)
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('')
  const Tag = `h${level}`

  return (
    <Tag id={createHeadingId(text)} className={`${HEADING_CLASSES[level]} scroll-mt-24`}>
      {children}
    </Tag>
  )
}

// react-markdown routes both inline code and fenced blocks here. Fenced blocks
// carry a language class; the "youtube" language is treated as an embed.
const MarkdownCode = ({ className, children, inline }) => {
  const rawCode = String(children)

  if (inline || (!className && !rawCode.includes('\n'))) {
    return <code>{children}</code>
  }

  const language = className?.replace('language-', '') || 'text'
  const code = rawCode.replace(/\n$/, '')

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
  // CodeBlock and YouTubeEmbed bring their own container, so <pre> is dropped.
  pre: ({ children }) => <>{children}</>,
  code: MarkdownCode,
}

const REMARK_PLUGINS = [remarkGfm, remarkMath]
const REHYPE_PLUGINS = [rehypeKatex]

const MarkdownContent = memo(({ content }) => (
  <div className="blog-markdown text-white/90">
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      components={COMPONENTS}
    >
      {normalizeLegacyMarkdown(content)}
    </ReactMarkdown>
  </div>
))

MarkdownContent.displayName = 'MarkdownContent'

export default MarkdownContent
