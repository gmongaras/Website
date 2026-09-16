import { Suspense, lazy, useEffect, useState } from 'react'
import { loadPost, posts } from './blogs'
import { parseBlogHash } from './lib/blogHash'
import { scrollToHash } from './lib/dom'
import Header from './components/Header'
import SEO from './components/SEO'
import DeferredSection from './components/ui/DeferredSection'
import Hero from './components/sections/Hero'
import Skills from './components/sections/Skills'
import Education from './components/sections/Education'
import Experience from './components/sections/Experience'
import Publications from './components/sections/Publications'
import Blogs from './components/sections/Blogs'
import Contact from './components/sections/Contact'
import Footer from './components/sections/Footer'

// Article rendering pulls in the markdown and maths toolchain, which the home
// page never needs, so it is fetched only when a post is opened.
const loadBlogPostComponent = () => import('./components/blog/BlogPost')
const BlogPost = lazy(loadBlogPostComponent)
const Projects = lazy(() => import('./components/sections/Projects'))
const Media = lazy(() => import('./components/sections/Media'))

// Anchors are only in the DOM after the sections have mounted.
const ANCHOR_SCROLL_DELAY_MS = 100

const readRoute = () => {
  const parsed = parseBlogHash(window.location.hash)
  if (!parsed?.slug) return { isBlog: false, post: null, section: null }

  return {
    isBlog: true,
    post: posts.find((post) => post.slug === parsed.slug) ?? null,
    section: parsed.section,
  }
}

const DeferredHomeSection = ({ id, children }) => (
  <DeferredSection id={id}>
    <Suspense fallback={<div style={{ minHeight: 640 }} />}>
      {children}
    </Suspense>
  </DeferredSection>
)

const HomePage = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Gabriel Mongaras — AI Engineer & Researcher"
      description="AI Engineer & Researcher focused on diffusion models, attention mechanisms, and efficient AI systems. Experience at Etched, Google, Amazon, and Meta."
      keywords={['AI Engineer', 'Machine Learning', 'Diffusion Models', 'Neural Networks', 'Research', 'PyTorch', 'Transformers']}
      url="/"
    />
    <Header />
    <div className="flex-1 relative">
      <main>
        <Hero />
        <Skills />
        <Education />
        <Experience />
        <Publications />
        <DeferredHomeSection id="projects">
          <Projects />
        </DeferredHomeSection>
        <Blogs />
        <DeferredHomeSection id="media">
          <Media />
        </DeferredHomeSection>
        <Contact />
      </main>
      <Footer />
    </div>
  </div>
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
 * The site is one static page, so the "route" is just the location hash:
 * "#blog/<slug>" opens an article, anything else is a home page anchor.
 */
export default function App() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (route.isBlog) return

    const timer = setTimeout(() => scrollToHash(window.location.hash), ANCHOR_SCROLL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [route])

  // Keep article navigation instant without competing with the initial page
  // load. Slow and data-saver connections retain true on-demand loading.
  useEffect(() => {
    if (route.isBlog) return

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
  }, [route.isBlog])

  if (!route.isBlog) return <HomePage />

  return <BlogRoute metadata={route.post} initialSection={route.section} />
}
