import { Suspense, lazy, useEffect, useState } from 'react'
import { loadPost, posts } from './blogs'
import { parseBlogHash } from './lib/blogHash'
import { scrollToHash } from './lib/dom'
import Header from './components/Header'
import SEO from './components/SEO'
import Hero from './components/sections/Hero'
import Publications from './components/sections/Publications'
import Blogs from './components/sections/Blogs'
import Contact from './components/sections/Contact'
import Footer from './components/sections/Footer'

// Article rendering pulls in the markdown and maths toolchain, which the home
// page never needs, so it is fetched only when a post is opened.
const loadBlogPostComponent = () => import('./components/blog/BlogPost')
const BlogPost = lazy(loadBlogPostComponent)
const Projects = lazy(() => import('./components/sections/Projects'))

// Anchors are only in the DOM after the sections have mounted.
const ANCHOR_SCROLL_DELAY_MS = 100

const readRoute = () => {
  const hash = window.location.hash
  const parsed = parseBlogHash(hash)
  if (parsed?.slug) {
    return {
      page: 'blog',
      post: posts.find((post) => post.slug === parsed.slug) ?? null,
      section: parsed.section,
    }
  }

  if (hash === '#blogs') return { page: 'blogs', post: null, section: null }
  if (hash === '#research' || hash === '#publications') return { page: 'research', post: null, section: null }
  if (hash === '#projects') return { page: 'projects', post: null, section: null }
  return { page: 'home', post: null, section: null }
}

const PageFrame = ({ seo, children, fill = false, below = null }) => (
  <div className={fill ? undefined : 'min-h-screen flex flex-col'}>
    {seo}
    {fill ? (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-4.5rem)] flex-col md:min-h-[calc(100vh-6rem)]">{children}</main>
        {below}
        <Footer />
      </>
    ) : (
      <>
        <Header />
        <div className="flex-1 relative">
          <main>{children}</main>
          <Footer />
        </div>
      </>
    )}
  </div>
)

const HomePage = () => (
  <PageFrame
    seo={(
      <SEO
        title="Gabriel Mongaras — AI Engineer & Researcher"
        description="AI Engineer & Researcher focused on diffusion models, attention mechanisms, and efficient AI systems. Experience at Etched, Google, Amazon, and Meta."
        keywords={['AI Engineer', 'Machine Learning', 'Diffusion Models', 'Neural Networks', 'Research', 'PyTorch', 'Transformers']}
        url="/"
      />
    )}
    fill
    below={<Contact />}
  >
    <Hero />
  </PageFrame>
)

const BlogsPage = () => (
  <PageFrame
    seo={(
      <SEO
        title="Blogs"
        description="Notes on models, attention, and the details in between."
        url="/#blogs"
      />
    )}
  >
    <Blogs />
  </PageFrame>
)

const ResearchPage = () => (
  <PageFrame
    seo={(
      <SEO
        title="Research"
        description="Papers on attention, and the thesis behind them."
        url="/#research"
      />
    )}
  >
    <Publications />
  </PageFrame>
)

const ProjectsPage = () => (
  <PageFrame
    seo={(
      <SEO
        title="Projects"
        description="Code from papers, kernels, and experiments."
        url="/#projects"
      />
    )}
  >
    <Suspense fallback={<div className="section py-16" />}>
      <Projects />
    </Suspense>
  </PageFrame>
)

const BlogRoute = ({ metadata, initialSection }) => {
  const [post, setPost] = useState(metadata ? undefined : null)

  useEffect(() => {
    let isCurrent = true

    if (!metadata) {
      setPost(null)
      return () => { isCurrent = false }
    }

    setPost(undefined)
    Promise.all([loadPost(metadata.slug), loadBlogPostComponent()])
      .then(([loadedPost]) => {
        if (isCurrent) setPost(loadedPost)
      })
      .catch(() => {
        if (isCurrent) setPost(null)
      })

    return () => { isCurrent = false }
  }, [metadata])

  if (post === undefined) return <div className="min-h-screen" />

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BlogPost post={post} initialSection={initialSection} />
    </Suspense>
  )
}

/**
 * "#blog/<slug>" opens an article. "#blogs", "#research", and "#projects"
 * are separate pages. Resume links straight to the PDF. No hash is home.
 */
export default function App() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('popstate', onHashChange)
    }
  }, [])

  useEffect(() => {
    if (route.page === 'blog') return

    if (window.location.hash === '#contact') {
      const timer = setTimeout(() => scrollToHash('#contact'), ANCHOR_SCROLL_DELAY_MS)
      return () => clearTimeout(timer)
    }

    window.scrollTo({ top: 0 })
  }, [route])

  // Keep article navigation instant without competing with the initial page
  // load. Slow and data-saver connections retain true on-demand loading.
  useEffect(() => {
    if (route.page === 'blog') return

    if (new URLSearchParams(window.location.search).has('compilePdf')) return

    const connection = navigator.connection
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return

    const prefetchArticles = () => {
      Promise.allSettled([
        loadBlogPostComponent(),
        ...posts.map((post) => loadPost(post.slug)),
      ])
    }

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(prefetchArticles, { timeout: 2500 })
      return () => window.cancelIdleCallback(handle)
    }

    const timer = setTimeout(prefetchArticles, 1200)
    return () => clearTimeout(timer)
  }, [route.page])

  if (route.page === 'blogs') return <BlogsPage />
  if (route.page === 'research') return <ResearchPage />
  if (route.page === 'projects') return <ProjectsPage />
  if (route.page === 'blog') return <BlogRoute metadata={route.post} initialSection={route.section} />

  return <HomePage />
}
