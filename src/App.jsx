import { Suspense, lazy, useEffect, useState } from 'react'
import { posts } from './blogs'
import { parseBlogHash } from './lib/blogHash'
import { scrollToHash } from './lib/dom'
import Header from './components/Header'
import SEO from './components/SEO'
import Hero from './components/sections/Hero'
import Skills from './components/sections/Skills'
import Education from './components/sections/Education'
import Experience from './components/sections/Experience'
import Projects from './components/sections/Projects'
import Publications from './components/sections/Publications'
import Media from './components/sections/Media'
import Blogs from './components/sections/Blogs'
import Contact from './components/sections/Contact'
import Footer from './components/sections/Footer'

// Article rendering pulls in the markdown and maths toolchain, which the home
// page never needs, so it is fetched only when a post is opened.
const BlogPost = lazy(() => import('./components/blog/BlogPost'))

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
        <Projects />
        <Blogs />
        <Media />
        <Contact />
      </main>
      <Footer />
    </div>
  </div>
)

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

  // Warm the article chunk while the visitor reads the home page, so opening a
  // post does not wait on a download.
  useEffect(() => {
    if (route.isBlog) return

    const prefetch = () => { import('./components/blog/BlogPost') }
    const supportsIdle = typeof window.requestIdleCallback === 'function'
    const handle = supportsIdle ? window.requestIdleCallback(prefetch) : setTimeout(prefetch, 2000)

    return () => {
      if (supportsIdle) window.cancelIdleCallback(handle)
      else clearTimeout(handle)
    }
  }, [route.isBlog])

  if (!route.isBlog) return <HomePage />

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BlogPost post={route.post} initialSection={route.section} />
    </Suspense>
  )
}
