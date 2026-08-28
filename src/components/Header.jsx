import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookAudio, BookOpen, Briefcase, ChevronDown, Cpu, GraduationCap, Mail, Menu, X } from 'lucide-react'
import { posts } from '../blogs'
import MotionLinkBtn from './ui/MotionLinkBtn'

const NAV_ITEMS = [
  { href: '#skills', label: 'Skills', icon: Cpu },
  { href: '#education', label: 'Education', icon: GraduationCap },
  { href: '#experience', label: 'Experience', icon: Briefcase },
  { href: '#projects', label: 'Projects', icon: Cpu },
  { href: '#publications', label: 'Publications', icon: BookOpen },
  { href: '#media', label: 'Media', icon: BookOpen },
  { href: '#blogs', label: 'Blogs', icon: BookAudio },
]

const HOVER_PILL = 'radial-gradient(120% 140% at 50% 0%, rgba(59,0,102,0.22), rgba(59,0,102,0.12) 45%, transparent 70%)'

const NAV_LINK_CLASS = 'relative group px-3 py-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black'

// Follows an in-page or blog link without letting the browser jump the page.
const navigateTo = (href) => {
  if (!href.startsWith('#')) return

  const isBlogLink = href.startsWith('#blog/')
  const onBlogPage = window.location.hash.startsWith('#blog/')

  if (isBlogLink && window.location.hash === href) {
    // Already reading this post, so treat the link as "back to the top".
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else if (isBlogLink || onBlogPage) {
    // Leaving the current view: let the hash change drive the render.
    window.location.hash = href
  } else {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }
}

const HoverPill = () => (
  <span
    aria-hidden
    className="absolute inset-0 rounded-lg opacity-0 scale-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100"
    style={{ background: HOVER_PILL }}
  />
)

const Underline = ({ centered = true }) => (
  <span
    aria-hidden
    className={`pointer-events-none absolute -bottom-1 h-[2px] w-0 rounded-full transition-[width] duration-300 group-hover:w-full ${
      centered ? 'left-1/2 -translate-x-1/2' : 'left-0'
    }`}
    style={{ backgroundColor: 'var(--accent)' }}
  />
)

const NavLink = ({ href, label }) => (
  <a href={href} onClick={(event) => { event.preventDefault(); navigateTo(href) }} className={NAV_LINK_CLASS}>
    <HoverPill />
    <span
      className="relative z-10 inline-block font-medium transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]"
      style={{ textRendering: 'optimizeLegibility' }}
    >
      {label}
      <Underline />
    </span>
  </a>
)

// The Blogs entry doubles as a hover menu listing the most recent posts.
const BlogsNavMenu = ({ label }) => {
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <div className="relative" onMouseEnter={open} onMouseLeave={close}>
      <a
        href="#blogs"
        onClick={(event) => { event.preventDefault(); navigateTo('#blogs') }}
        className={NAV_LINK_CLASS}
      >
        <HoverPill />
        <span
          className="relative z-10 inline-flex items-center gap-1 font-medium transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]"
          style={{ textRendering: 'optimizeLegibility' }}
        >
          {label}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
          <Underline />
        </span>
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
                className="block px-3 py-2 rounded-md hover:bg-white/5 transition-colors text-sm"
              >
                <div className="font-medium text-white/90 truncate">{post.title}</div>
                <div className="text-xs text-white/60 mt-1">{post.date}</div>
              </a>
            ))}
            <div className="border-t border-white/10 my-1" />
            <a
              href="#blogs"
              onClick={(event) => { event.preventDefault(); navigateTo('#blogs') }}
              className="block px-3 py-2 rounded-md hover:bg-white/5 transition-colors text-sm font-medium text-[var(--accent)]"
            >
              All Blogs
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const MobileNavSheet = ({ onClose }) => (
  <>
    <motion.div
      key="backdrop"
      aria-label="Close menu"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onClose() }}
      className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm pointer-events-auto cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />

    <motion.nav
      key="sheet"
      id="mobile-nav"
      role="dialog"
      aria-modal="true"
      className="fixed z-[9999] top-[72px] left-3 right-3 rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl pointer-events-auto"
      initial={{ y: -20, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 24 } }}
      exit={{ y: -12, opacity: 0, scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>Navigate</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="p-2 rounded-lg hover:bg-white/5 transition"
          style={{ color: 'var(--accent)' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ul className="divide-y divide-white/5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <a
              href={href}
              onClick={(event) => { event.preventDefault(); onClose(); navigateTo(href) }}
              className="group flex items-center gap-3 py-3"
            >
              <div className="p-2 rounded-xl bg-accent/20 ring-1 ring-white/10">
                <Icon className="w-5 h-5" />
              </div>
              <span className="relative inline-block text-base transition-colors group-hover:text-[var(--accent)]">
                {label}
                <Underline centered={false} />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <a
          href="#contact"
          onClick={(event) => { event.preventDefault(); onClose(); navigateTo('#contact') }}
          className="btn btn-primary relative overflow-hidden group min-h-[44px] text-[15px] sm:text-sm whitespace-nowrap"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Mail className="w-5 h-5 sm:w-4 sm:h-4" />
            <span>Contact</span>
          </span>
        </a>
      </div>
    </motion.nav>
  </>
)

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The sheet is mobile-only, so it closes on Escape and on growing past `md`.
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event) => { if (event.key === 'Escape') setMenuOpen(false) }
    const desktop = window.matchMedia('(min-width: 768px)')
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
        <a href="/" className="flex items-center gap-2 tracking-wide hover:opacity-90">
          <img
            src="/favicon.ico"
            alt="Icon"
            loading="eager"
            className="h-10 w-10 md:h-16 md:w-16 rounded-md object-cover shadow-sm"
          />
        </a>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV_ITEMS.map(({ href, label }) => (
            href === '#blogs'
              ? <BlogsNavMenu key={href} label={label} />
              : <NavLink key={href} href={href} label={label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!menuOpen && (
            <div className="hidden md:flex">
              <MotionLinkBtn href="#contact" label="Contact me" Icon={Mail} primary highlight="white" newTab={false} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-controls="mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden relative inline-flex items-center justify-center p-2 rounded-xl ring-1
                       transition focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          >
            <motion.span
              initial={false}
              animate={{ rotate: menuOpen ? 90 : 0, scale: menuOpen ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.span>
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-0 right-0 -bottom-4 h-8 transition-opacity duration-300"
        style={{ opacity: scrolled ? 1 : 0, background: 'var(--gradient-header-fade)', filter: 'blur(12px)' }}
      />

      {/* Kept mounted so the sheet can animate out as well as in. */}
      {createPortal(
        <AnimatePresence>
          {menuOpen && <MobileNavSheet key="mobile-nav" onClose={() => setMenuOpen(false)} />}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  )
}

export default Header
