import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { nextPaint } from '../../lib/dom'
import { extractHeadings } from '../../lib/markdown'
import Header from '../Header'
import SEO from '../SEO'
import { PrintModeContext } from '../PrintModeContext'
import ArticleToc from './ArticleToc'
import MarkdownContent from './MarkdownContent'

const isCompilePdf = () => (
  typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('compilePdf')
)

const SITE_URL = 'https://gmongaras.me'

// Windows and macOS both reject these characters in file names.
const toPdfFileName = (title) =>
  title.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'article'

const buildStructuredData = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  author: { '@type': 'Person', name: 'Gabriel Mongaras', url: SITE_URL },
  publisher: { '@type': 'Person', name: 'Gabriel Mongaras' },
  datePublished: post.date,
  dateModified: post.date,
  url: `${SITE_URL}/#blog/${post.slug}`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/#blog/${post.slug}` },
  keywords: post.tags.join(', '),
  articleSection: 'Technology',
  wordCount: post.body.split(' ').length,
})

const formatPostDate = (date) => new Date(date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const BlogPostNotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <SEO
      title="Blog Post Not Found"
      description="The requested blog post could not be found."
      url="/#blog/not-found"
    />
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-4">Blog Post Not Found</h1>
      <a href="/" className="btn">Back to Home</a>
    </div>
  </div>
)

/**
 * Headless PDF compilation loads `?compilePdf` and expects the finished
 * data-URI on `window.__compiledPdf`. The build script waits on that flag.
 */
const useCompilePdf = (articleRef, post) => {
  const compiling = isCompilePdf()

  useEffect(() => {
    if (!compiling) return

    window.__compiledPdf = { status: 'pending', slug: post.slug }
    let cancelled = false

    const run = async () => {
      try {
        while (!cancelled && !articleRef.current?.querySelector('.blog-markdown')) {
          await nextPaint()
        }
        if (cancelled || !articleRef.current) return

        await nextPaint()
        const { exportArticlePdf } = await import('../../pdf/exportArticlePdf')
        const dataUrl = await exportArticlePdf({
          article: articleRef.current,
          fileName: toPdfFileName(post.title),
          returnBytes: true,
        })
        if (!cancelled) window.__compiledPdf = { status: 'ready', slug: post.slug, dataUrl }
      } catch (error) {
        console.error('Failed to compile article PDF:', error)
        if (!cancelled) {
          window.__compiledPdf = {
            status: 'error',
            slug: post.slug,
            message: String(error?.message || error),
          }
        }
      }
    }

    run()
    return () => { cancelled = true }
  }, [articleRef, compiling, post.slug, post.title])

  return compiling
}

// Mirrors the browser's own print dialog into print mode, so Ctrl+P produces
// the same clean article as the download button.
const useBrowserPrintMode = () => {
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    const root = document.getElementById('root')

    const enable = () => {
      setIsPrinting(true)
      root?.classList.add('pdf-paper')
    }
    const disable = () => {
      setIsPrinting(false)
      root?.classList.remove('pdf-paper')
    }

    window.addEventListener('beforeprint', enable)
    window.addEventListener('afterprint', disable)

    return () => {
      window.removeEventListener('beforeprint', enable)
      window.removeEventListener('afterprint', disable)
      root?.classList.remove('pdf-paper')
    }
  }, [])

  return isPrinting
}

/**
 * A single article: sticky table of contents, the rendered markdown, and a
 * button that exports the very same markup as a vector PDF.
 */
const Article = ({ post, initialSection }) => {
  const articleRef = useRef(null)
  const isPrinting = useBrowserPrintMode()
  const compilingPdf = useCompilePdf(articleRef, post)

  const headings = useMemo(() => extractHeadings(post.body), [post.body])
  const structuredData = useMemo(() => buildStructuredData(post), [post])
  const subtitle = post.subtitle || post.excerpt || ''

  // A new article opens at the top, unless the link pointed at a section.
  useEffect(() => {
    if (initialSection) document.getElementById(initialSection)?.scrollIntoView({ behavior: 'auto' })
    else window.scrollTo({ top: 0, behavior: 'auto' })
  }, [post.slug, initialSection])

  const handleNavigateSection = useCallback((sectionId) => {
    history.replaceState(null, '', `#blog/${post.slug}/${sectionId}`)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'auto' })
  }, [post.slug])

  return (
    <PrintModeContext.Provider value={isPrinting || compilingPdf}>
      <div className="min-h-screen">
        <SEO
          title={post.title}
          description={post.excerpt}
          keywords={post.tags}
          url={`/#blog/${post.slug}`}
          type="article"
          structuredData={structuredData}
        />
        <Header />
        <div className="section py-16 sm:py-24 pdf-page">
          <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1024px)] pdf-grid">
            <ArticleToc
              headings={headings}
              postSlug={post.slug}
              onNavigateSection={handleNavigateSection}
              initialSection={initialSection}
            />
            <div className="min-w-0 w-full">
              <article ref={articleRef} className="pdf-article prose prose-invert max-w-5xl mx-auto min-w-0">
                <header className="mb-10">
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
                  <div className="no-print mb-6">
                    <a
                      href={`/blogs/pdfs/${post.slug}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn text-sm"
                      title="Open this article as a PDF"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </a>
                  </div>
                  {subtitle ? <p className="max-w-3xl text-white/70 mb-6">{subtitle}</p> : null}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-6">
                    <time>{formatPostDate(post.date)}</time>
                    <div className="flex gap-2 flex-wrap">
                      {post.tags.map((tag) => <span key={tag} className="chip text-xs">{tag}</span>)}
                    </div>
                  </div>
                  {post.authors?.length ? (
                    <div className="mb-4 text-sm text-white/70">
                      <span className="font-semibold text-white">Authors:</span> {post.authors.join(', ')}
                    </div>
                  ) : null}
                  {post.affiliations?.length ? (
                    <div className="mb-6 text-sm text-white/70">
                      <span className="font-semibold text-white">Affiliations:</span> {post.affiliations.join(', ')}
                    </div>
                  ) : null}
                </header>

                <div className="prose prose-invert max-w-none">
                  <MarkdownContent content={post.body} />
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </PrintModeContext.Provider>
  )
}

// The guard lives out here so `Article` can rely on always having a post, and
// therefore on always running the same hooks.
const BlogPost = ({ post, initialSection }) => (
  post
    ? <Article post={post} initialSection={initialSection} />
    : <BlogPostNotFound />
)

export default BlogPost
