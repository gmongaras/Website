import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, BookAudio, BookOpen, ChevronDown, Cpu, FileText, House, Menu, X } from 'lucide-react'
import { loadPost, posts } from '../blogs'
import { nextPaint } from '../lib/dom'
import { formatDate } from '../lib/formatDate'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: House },
  { href: '#blogs', label: 'Blogs', icon: BookAudio },
  { href: '#research', label: 'Research', icon: BookOpen },
  { href: '#projects', label: 'Projects', icon: Cpu },
]

const PAGE_HASHES = new Set(['#blogs', '#research', '#projects', '#publications', '#contact'])

const pageForHash = (hash) => {
  if (hash === '#blogs' || hash.startsWith('#blog/')) return '#blogs'
  if (hash === '#research' || hash === '#publications') return '#research'
  if (hash === '#projects') return '#projects'
  return '/'
}

const ACTIVE_RING = { boxShadow: 'inset 0 0 0 1px rgba(var(--accent-rgb), 0.9)' }

const NAV_LINK_CLASS = (active) =>
  `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
    active
      ? 'bg-white/10 text-white'
      : 'text-white/65 hover:bg-white/5 hover:text-white'
  }`

// Follows an in-page or blog link without letting the browser jump the page.
const navigateTo = (href) => {
  if (href === '/') {
    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname + window.location.search)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return
  }

  if (!href.startsWith('#')) return

  if (window.location.hash === href) {
    if (href === '#contact') document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  const isBlogLink = href.startsWith('#blog/')
  const onBlogPage = window.location.hash.startsWith('#blog/')

  if (isBlogLink || onBlogPage || PAGE_HASHES.has(href)) {
    window.location.hash = href
  } else {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }
}

const closeMobileMenuAndNavigate = (event, href, onClose) => {
  event.preventDefault()
  onClose()
  nextPaint().then(() => navigateTo(href))
}

const NavLink = ({ href, label, active = false }) => (
  <a
    href={href}
    aria-current={active ? 'page' : undefined}
    onClick={(event) => { event.preventDefault(); navigateTo(href) }}
    className={NAV_LINK_CLASS(active)}
    style={{ textRendering: 'optimizeLegibility', ...(active ? ACTIVE_RING : null) }}
  >
    {label}
  </a>
)

// The Blogs entry doubles as a hover menu listing the most recent posts.
const BlogsNavMenu = ({ label, active = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <div className="relative" onMouseEnter={open} onMouseLeave={close}>
      <a
        href="#blogs"
        aria-current={active ? 'page' : undefined}
        onClick={(event) => { event.preventDefault(); navigateTo('#blogs') }}
        className={`${NAV_LINK_CLASS(active)} inline-flex items-center gap-1`}
        style={{ textRendering: 'optimizeLegibility', ...(active ? ACTIVE_RING : null) }}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </a>

      {/* The top padding bridges the gap under the link, so moving the pointer
          down into the menu does not count as leaving it. */}
      <div className={`absolute top-full left-0 pt-2 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`w-64 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl transition-all duration-200 ${
            isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <div className="p-2">
            {posts.slice(0, 3).map((post) => (
              <a
                key={post.slug}
                href={`#blog/${post.slug}`}
                onClick={(event) => { event.preventDefault(); navigateTo(`#blog/${post.slug}`) }}
                onPointerEnter={() => { loadPost(post.slug).catch(() => {}) }}
                onFocus={() => { loadPost(post.slug).catch(() => {}) }}
                className="block px-3 py-2 rounded-md hover:bg-white/5 transition-colors text-sm"
              >
                <div className="font-medium text-white/90 truncate">{post.title}</div>
                <div className="text-xs text-white/60 mt-1">{formatDate(post.date)}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const MobileNavSheet = ({ onClose, currentHref }) => (
  <>
    <div
      key="backdrop"
      aria-label="Close menu"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onClose() }}
      className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm pointer-events-auto cursor-pointer animate-[fadeIn_150ms_ease-out]"
    />

    <nav
      key="sheet"
      id="mobile-nav"
      role="dialog"
      aria-modal="true"
      className="fixed z-[9999] top-[72px] left-3 right-3 rounded-2xl border border-white/10 bg-black p-4 shadow-2xl pointer-events-auto animate-[menuIn_180ms_ease-out]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold tracking-wide text-white/80">Navigate</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="p-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ul className="divide-y divide-white/5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === currentHref
          return (
            <li key={href}>
              <a
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => closeMobileMenuAndNavigate(event, href, onClose)}
                className={`flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'
                }`}
                style={active ? ACTIVE_RING : undefined}
              >
                <div className={`p-2 rounded-xl ring-1 ring-white/10 ${active ? 'bg-white/10' : 'bg-white/5'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-base">{label}</span>
              </a>
            </li>
          )
        })}
        <li>
          <a
            href="/Resume.pdf"
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-white/75 transition-colors hover:bg-white/5 hover:text-white"
          >
            <div className="p-2 rounded-xl bg-white/5 ring-1 ring-white/10">
              <FileText className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-base">
              Resume
              <ArrowUpRight aria-hidden className="h-4 w-4" />
            </span>
          </a>
        </li>
      </ul>
    </nav>
  </>
)

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentHref, setCurrentHref] = useState(() => pageForHash(window.location.hash))

  useEffect(() => {
    const sync = () => setCurrentHref(pageForHash(window.location.hash))
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  useEffect(() => {
    let lastScrolled
    const onScroll = () => {
      const nextScrolled = window.scrollY > 0
      if (nextScrolled === lastScrolled) return
      lastScrolled = nextScrolled
      setScrolled(nextScrolled)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The row only fits once Home through Resume are all on screen.
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event) => { if (event.key === 'Escape') setMenuOpen(false) }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onBreakpointChange = (event) => { if (event.matches) setMenuOpen(false) }

    window.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onBreakpointChange)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onBreakpointChange)
    }
  }, [menuOpen])

  return (
    <header className="no-print sticky top-0 z-40 bg-black/70 backdrop-blur">
      <div className="section py-4 flex items-center justify-between">
        <a
          href="/"
          onClick={(event) => { event.preventDefault(); navigateTo('/') }}
          className="flex items-center gap-2 tracking-wide hover:opacity-90"
        >
          <img
            src="/optimized/icon-full.png"
            alt="Icon"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="h-10 w-10 md:h-16 md:w-16 rounded-md object-cover shadow-sm"
          />
        </a>

        <div className="flex items-center">
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              href === '#blogs'
                ? <BlogsNavMenu key={href} label={label} active={currentHref === href} />
                : <NavLink key={href} href={href} label={label} active={currentHref === href} />
            ))}
            <a href="/Resume.pdf" target="_blank" rel="noreferrer" className={`${NAV_LINK_CLASS(false)} inline-flex items-center gap-1`}>
              Resume
              <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-controls="mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden relative inline-flex items-center justify-center p-2 rounded-xl ring-1 transition focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          >
            <span
              className={`flex transition-transform duration-200 ${menuOpen ? 'rotate-90 scale-105' : ''}`}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </span>
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-0 right-0 -bottom-4 h-8 transition-opacity duration-300"
        style={{ opacity: scrolled ? 1 : 0, background: 'var(--gradient-header-fade)', filter: 'blur(12px)' }}
      />

      {createPortal(
        menuOpen ? <MobileNavSheet key="mobile-nav" currentHref={currentHref} onClose={() => setMenuOpen(false)} /> : null,
        document.body,
      )}
    </header>
  )
}

export default Header
