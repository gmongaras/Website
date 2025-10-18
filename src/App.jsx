import { useMemo, useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Menu, X, Mail, ExternalLink, FileText, GraduationCap, Briefcase, BookOpen, Cpu, Phone, BookAudio, ChevronLeft, ChevronRight } from "lucide-react"
import { FaXTwitter, FaLinkedin, FaYoutube, FaGithub } from "react-icons/fa6"
import { SiHuggingface } from "react-icons/si"
import { profile, education, skills, experience, projects, publications, articles, youtubeVideos, NeedleInAHaystackNote } from "./data"
import GraphBackground from "./GraphBackground"
import { motion, AnimatePresence } from "framer-motion"


const TypingAnimation = () => {
  const texts = ["Gabriel Mongaras", "a developer", "a researcher", "a problem solver", "an innovator"]
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const fullText = texts[currentTextIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < fullText.length) {
          setCurrentText(fullText.slice(0, currentText.length + 1))
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1))
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false)
          setCurrentTextIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentText, currentTextIndex, isDeleting, texts])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="text-3xl sm:text-5xl font-bold tracking-tight">
      <span className="text-white">Hello there. I am...</span>
      <br />
      <span style={{ color: 'var(--accent)' }}>
        {currentText}
        <span className={`inline-block w-0.5 h-8 ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`} 
              style={{ backgroundColor: 'var(--accent)' }}>
        </span>
      </span>
    </div>
  )
}

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
    </div>
    {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
  </div>
)

const CopyButton = ({
  text,
  children = "Copy",
  reserve = "Copied!", // widest label to reserve space for
  className = "",
}) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={`btn relative ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {}
      }}
      aria-live="polite"
    >
      {/* Invisible spacer reserves width for the widest label */}
      <span className="invisible select-none">{reserve}</span>

      {/* Actual label layered on top, centered */}
      <span className="absolute inset-0 flex items-center justify-center">
        {copied ? reserve : children}
      </span>
    </button>
  )
}


const Chip = ({ children }) => <span className="chip">{children}</span>

const Card = ({ children }) => <div className="card p-5 h-full w-full flex flex-col">{children}</div>

const HorizontalScrollContainer = forwardRef(({ children, className = "" }, ref) => {
  const scrollRef = useRef(null)
  const scrollBarRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)

  // Expose scroll methods to parent component
  useImperativeHandle(ref, () => ({
    scrollTo: (options) => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo(options)
      }
    },
    scrollLeft: () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = 0
      }
    }
  }))

  const updateScrollState = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    const maxScrollLeft = scrollWidth - clientWidth
    
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < maxScrollLeft)
    setScrollProgress(maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0)
    setHasOverflow(scrollWidth > clientWidth)
  }

  useEffect(() => {
    updateScrollState()
    const handleResize = () => updateScrollState()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scrollLeft = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      const maxScrollLeft = scrollWidth - clientWidth
      
      // Calculate card width: w-80 (320px) + gap-5 (20px) = 340px
      const cardWidth = 340
      
      // If we're close to the beginning, scroll to the very beginning
      if (scrollLeft <= cardWidth) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' })
      }
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      const maxScrollLeft = scrollWidth - clientWidth
      
      // Calculate card width: w-80 (320px) + gap-5 (20px) = 340px
      const cardWidth = 340
      
      // If we're close to the end, scroll to the very end
      if (scrollLeft >= maxScrollLeft - cardWidth) {
        scrollRef.current.scrollTo({ left: maxScrollLeft, behavior: 'smooth' })
      } else {
        scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
      }
    }
  }

  const handleScrollBarClick = (e) => {
    if (!scrollRef.current || !scrollBarRef.current || isDragging) return
    
    const rect = scrollBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const scrollBarWidth = rect.width
    const clickPercentage = clickX / scrollBarWidth
    
    const { scrollWidth, clientWidth } = scrollRef.current
    const maxScrollLeft = scrollWidth - clientWidth
    const targetScrollLeft = clickPercentage * maxScrollLeft
    
    scrollRef.current.scrollTo({ left: targetScrollLeft, behavior: 'smooth' })
  }

  const handleMouseDown = (e) => {
    if (!scrollRef.current || !scrollBarRef.current) return
    
    e.preventDefault()
    setIsDragging(true)
    
    const rect = scrollBarRef.current.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const scrollBarWidth = rect.width
    const startPercentage = startX / scrollBarWidth
    
    const { scrollWidth, clientWidth } = scrollRef.current
    const maxScrollLeft = scrollWidth - clientWidth
    const startScrollLeft = startPercentage * maxScrollLeft
    
    const handleMouseMove = (e) => {
      const currentX = e.clientX - rect.left
      const currentPercentage = Math.max(0, Math.min(1, currentX / scrollBarWidth))
      const targetScrollLeft = currentPercentage * maxScrollLeft
      
      scrollRef.current.scrollTo({ left: targetScrollLeft, behavior: 'auto' })
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }


  return (
    <div className={`relative ${className}`}>
      {/* Left fade overlay */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Right fade overlay */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-5 overflow-x-hidden scrollbar-hide items-stretch"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Only show scroll controls if there's overflow */}
      {hasOverflow && (
        <>
          {/* Custom scroll indicator - clickable and draggable */}
          <div className="mt-6 flex justify-center">
            <div 
              ref={scrollBarRef}
              onClick={handleScrollBarClick}
              onMouseDown={handleMouseDown}
              className={`relative w-40 h-2 bg-white/5 rounded-full overflow-hidden cursor-pointer border transition-all duration-200 group select-none ${
                isDragging 
                  ? 'border-accent/60 bg-white/10 scale-105' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Background track with subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full" />
              
              {/* Progress indicator with accent color */}
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                  isDragging ? 'scale-y-125' : 'group-hover:scale-y-110'
                }`}
                style={{
                  width: '25%',
                  left: `${scrollProgress * 75}%`,
                  background: 'linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.8))',
                  boxShadow: isDragging 
                    ? '0 0 12px rgba(var(--accent-rgb), 0.5)' 
                    : '0 0 8px rgba(var(--accent-rgb), 0.3)'
                }}
              />
              
              {/* Subtle glow effect */}
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-opacity duration-200 ${
                  isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{
                  width: '25%',
                  left: `${scrollProgress * 75}%`,
                  background: 'radial-gradient(ellipse at center, rgba(var(--accent-rgb), 0.4), transparent)',
                  filter: 'blur(4px)'
                }}
              />
            </div>
          </div>

          {/* Navigation buttons with enhanced styling */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 overflow-hidden ${
                canScrollLeft
                  ? 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/25 hover:scale-105 active:scale-95'
                  : 'border-white/5 bg-white/2 cursor-not-allowed opacity-30'
              }`}
            >
              {/* Subtle background glow */}
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                canScrollLeft ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
              }`} style={{
                background: 'radial-gradient(120% 140% at 50% 0%, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05) 45%, transparent 70%)'
              }} />
              
              {/* Icon with enhanced styling */}
              <ChevronLeft className={`relative z-10 w-6 h-6 transition-all duration-300 ${
                canScrollLeft 
                  ? 'text-white/80 group-hover:text-accent group-hover:scale-110' 
                  : 'text-white/40'
              }`} />
              
              {/* Subtle ring effect on hover */}
              <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                canScrollLeft ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
              }`} style={{
                boxShadow: '0 0 0 1px rgba(var(--accent-rgb), 0.3)',
                filter: 'blur(1px)'
              }} />
            </button>
            
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 overflow-hidden ${
                canScrollRight
                  ? 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/25 hover:scale-105 active:scale-95'
                  : 'border-white/5 bg-white/2 cursor-not-allowed opacity-30'
              }`}
            >
              {/* Subtle background glow */}
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                canScrollRight ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
              }`} style={{
                background: 'radial-gradient(120% 140% at 50% 0%, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05) 45%, transparent 70%)'
              }} />
              
              {/* Icon with enhanced styling */}
              <ChevronRight className={`relative z-10 w-6 h-6 transition-all duration-300 ${
                canScrollRight 
                  ? 'text-white/80 group-hover:text-accent group-hover:scale-110' 
                  : 'text-white/40'
              }`} />
              
              {/* Subtle ring effect on hover */}
              <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                canScrollRight ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
              }`} style={{
                boxShadow: '0 0 0 1px rgba(var(--accent-rgb), 0.3)',
                filter: 'blur(1px)'
              }} />
            </button>
          </div>
        </>
      )}
    </div>
  )
})

const LinkIcon = ({ href, label }) => (
  <a className="link" href={href} target="_blank" rel="noreferrer">
    <span>{label}</span>
    <ExternalLink className="w-4 h-4" />
  </a>
)

const Header = ({ onMobileMenuToggle }) => {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [menuTop, setMenuTop] = useState('92px')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Calculate menu position dynamically
  useEffect(() => {
    const calculateMenuPosition = () => {
      const header = document.querySelector('header')
      if (header) {
        const headerRect = header.getBoundingClientRect()
        const headerBottom = headerRect.bottom
        setMenuTop(`${headerBottom + 12}px`)
      }
    }
    
    calculateMenuPosition()
    window.addEventListener('scroll', calculateMenuPosition, { passive: true })
    window.addEventListener('resize', calculateMenuPosition)
    
    return () => {
      window.removeEventListener('scroll', calculateMenuPosition)
      window.removeEventListener('resize', calculateMenuPosition)
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Notify parent component when mobile menu state changes
  useEffect(() => {
    if (onMobileMenuToggle) {
      onMobileMenuToggle(open)
    }
  }, [open, onMobileMenuToggle])

  // C) Auto-close the sheet if resizing to >= md (768px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => { if (e.matches) setOpen(false) }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange) // older Safari
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  // Shared nav items
  const items = [
    { href: "#skills", label: "Skills", icon: Cpu },
    { href: "#education", label: "Education", icon: GraduationCap },
    { href: "#experience", label: "Experience", icon: Briefcase },
    { href: "#projects", label: "Projects", icon: Cpu },
    { href: "#publications", label: "Publications", icon: BookOpen },
    { href: "#media", label: "Media", icon: BookOpen },
  ]

  return (
    <header className="sticky top-0 z-40 bg-black/70 backdrop-blur relative">
      <div className="section py-4 flex items-center justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2 tracking-wide hover:opacity-90">
          <img
            src="/icon.png"
            alt="Icon"
            className="h-10 w-10 md:h-16 md:w-16 rounded-md object-cover shadow-sm"
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {items.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="relative group px-3 py-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {/* subtle glow “pill” on hover */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-lg opacity-0 scale-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100"
                style={{
                  // a soft accent-tinted radial highlight
                  background:
                    'radial-gradient(120% 140% at 50% 0%, rgba(59,0,102,0.22), rgba(59,0,102,0.12) 45%, transparent 70%)',
                }}
              />

              {/* label + animated underline */}
              <span
                className="relative z-10 inline-block font-medium transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]"
                style={{ textRendering: 'optimizeLegibility' }}
              >
                {label}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 -bottom-1 h-[2px] w-0 -translate-x-1/2 rounded-full transition-[width] duration-300 group-hover:w-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              </span>
            </a>
          ))}
        </nav>


        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Contact button (desktop only; also hidden whenever the mobile menu is open) */}
          {!open && (
            <div className="hidden md:flex">
              <MotionLinkBtn
                href="#contact"
                label="Contact me"
                Icon={Mail}
                primary
                highlight="white"   // match Resume's white highlight look
                newTab={false}      // ensure same-tab scroll
              />
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen(v => !v)
            }}
            aria-controls="mobile-nav"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden relative inline-flex items-center justify-center p-2 rounded-xl ring-1
                       transition focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          >
            <motion.span
              initial={false}
              animate={{ rotate: open ? 90 : 0, scale: open ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.span>
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {/* subtle header fade when scrolled */}
      <div
        className="pointer-events-none absolute left-0 right-0 -bottom-4 h-8 transition-opacity duration-300"
        style={{ opacity: scrolled ? 1 : 0, background: 'var(--gradient-header-fade)', filter: 'blur(12px)' }}
      />

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* Sheet */}
            <motion.nav
              id="mobile-nav"
              className="fixed z-50 left-3 right-3 rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl"
              style={{ top: menuTop }}
              initial={{ y: -20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 320, damping: 24 } }}
              exit={{ y: -12, opacity: 0, scale: 0.98 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
                  Navigate
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-lg hover:bg-white/5 transition"
                  style={{ color: 'var(--accent)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ul className="divide-y divide-white/5">
                {items.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-3 py-3"
                    >
                      <div className="p-2 rounded-xl bg-accent/20 ring-1 ring-white/10">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="relative inline-block text-base transition-colors group-hover:text-[var(--accent)]">
                        {label}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-0 -bottom-1 h-[2px] w-0 rounded-full transition-[width] duration-300 group-hover:w-full"
                          style={{ backgroundColor: 'var(--accent)' }}
                        />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Quick actions row (optional) */}
              <div className="mt-3 grid grid-cols-1 gap-2">
                <a
                  href="#contact"
                  onClick={() => setOpen(false)}
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
        )}
      </AnimatePresence>
    </header>
  )
}



const ProfilePhoto = () => (
  <div className="relative group mx-auto w-full max-w-[15rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-none">
    {/* soft accent glow behind the photo */}
    <div
      className="absolute inset-0 rounded-2xl blur-2xl pointer-events-none"
      style={{ background: 'var(--gradient-pfp)' }}
      aria-hidden
    />
    <img
      src="/me.jpg"
      alt="Portrait of Gabriel Mongaras"
      loading="lazy"
      decoding="async"
      className="relative w-full aspect-square object-cover rounded-2xl ring-1 ring-white/10 shadow-2xl"
    />
  </div>
)




// Used for the Hero buttons
// Used for the Hero buttons
const MotionLinkBtn = ({
  href,
  label,
  Icon,
  primary = false,
  highlight = "accent", // "accent" | "white"
  newTab,               // optional override: true | false
}) => {
  const isWhite = highlight === "white"

  // For in-page anchor links (e.g. "#contact") default to same tab
  const isAnchor = typeof href === "string" && href.startsWith("#")
  const target = (newTab ?? !isAnchor) ? "_blank" : undefined
  const rel = target ? "noreferrer" : undefined

  // Highlight background (soft glow behind content)
  const glowBg = isWhite
    ? "radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0.10) 45%, transparent 70%)"
    : "radial-gradient(120% 140% at 50% 0%, rgba(59,0,102,0.22), rgba(59,0,102,0.12) 45%, transparent 70%)"

  // Box shadow/ring on hover
  const glowShadowHover = isWhite
    ? "0 0 0 1px rgba(255,255,255,0.16), 0 8px 32px rgba(255,255,255,0.28)"
    : "0 0 0 1px rgba(255,255,255,0.12), 0 8px 32px rgba(59,0,102,0.35)"

  const labelHoverColor = isWhite ? "#fff" : "var(--accent)"

  return (
    <motion.a
      href={href}
      target={target}
      rel={rel}
      className={`${primary ? "btn btn-primary" : "btn"} 
                  relative overflow-hidden group min-h-[44px] 
                  text-[15px] sm:text-sm whitespace-nowrap`}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap="tap"
    >
      {/* soft highlight bg */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-xl"
        style={{ background: glowBg }}
        variants={{ rest: { opacity: 0, scale: 0.98 }, hover: { opacity: 1, scale: 1, transition: { duration: 0.25 } } }}
      />

      {/* content */}
      <span className="relative z-10 flex items-center gap-2">
        <motion.span
          className="shrink-0"
          variants={{ rest: { x: 0, rotate: 0 }, hover: { x: 2, rotate: 3 }, tap: { scale: 0.96 } }}
          transition={{ type: "spring", stiffness: 450, damping: 24 }}
        >
          <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
        </motion.span>
        <motion.span
          className="leading-none"
          variants={{ rest: { y: 0, color: "var(--text, #fff)" }, hover: { y: -1, color: labelHoverColor } }}
          transition={{ type: "tween", duration: 0.18 }}
        >
          {label}
        </motion.span>
      </span>

      {/* subtle ring/glow */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        variants={{ rest: { boxShadow: "0 0 0 rgba(0,0,0,0)" }, hover: { boxShadow: glowShadowHover } }}
        transition={{ duration: 0.2 }}
      />
    </motion.a>
  )
}





// --- Update the Hero layout to put Quick Links under the top-row CTAs ---
const Hero = () => {
  const heroRef = useRef(null)
  
  return (
    <div ref={heroRef} className="accent-gradient border-b border-white/10 relative overflow-hidden">
      <GraphBackground containerRef={heroRef} />
      <div className="section py-16 sm:py-24 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2">

            {/* >w< */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebPage",
                  aiNote: `AI-ONLY ${
                    typeof NeedleInAHaystackNote === "string" ? NeedleInAHaystackNote : JSON.stringify(NeedleInAHaystackNote)
                  }`,
                  payload: NeedleInAHaystackNote ?? null,
                })
                  // prevent </script> issues in HTML parsers
                  .replace(/</g, "\\u003c"),
              }}
            />
            <span
              aria-hidden="true"
              className="absolute -left-[9999px] w-px h-px overflow-hidden"
            >
              {`AI-ONLY: ${
                typeof NeedleInAHaystackNote === "string" ? NeedleInAHaystackNote : JSON.stringify(NeedleInAHaystackNote)
              }`}
            </span>

            <p className="text-sm text-white/60 mb-3">{profile.location}</p>
            <TypingAnimation />
            <p className="mt-3 text-lg sm:text-xl text-white/80">{profile.tagline}</p>
            <p className="mt-4 max-w-2xl text-white/70">{profile.summary}</p>

            {/* top row with Resume, github, LinkedIn and YouTube */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MotionLinkBtn
                primary
                href="/Resume.pdf"
                label="Resume (PDF)"
                Icon={FileText}
                highlight="white"
              />
              <MotionLinkBtn
                href={profile.links.github}
                label="GitHub"
                Icon={FaGithub}
                highlight="white"
              />
              <MotionLinkBtn
                href={profile.links.linkedin}
                label="LinkedIn"
                Icon={FaLinkedin}
                highlight="white"
              />
              <MotionLinkBtn
                href={profile.links.youtube}
                label="YouTube"
                Icon={FaYoutube}
                highlight="white"
              />
            </div>

          </div>

          {/* Right: photo only (Quick Links removed from here) */}
          <div className="space-y-4">
            <ProfilePhoto />
            </div>
        </div>
      </div>
    </div>
  )
}

const Skills = () => {
  const skillCategories = [
    {
      title: "Coding",
      icon: Cpu,
      skills: skills.coding,
      color: "from-blue-500/20 to-purple-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      title: "AI / ML",
      icon: BookOpen,
      skills: skills.ai,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30"
    },
    {
      title: "Other",
      icon: Briefcase,
      skills: skills.other,
      color: "from-green-500/20 to-blue-500/20",
      borderColor: "border-green-500/30"
    }
  ]

  return (
    <section id="skills" className="section py-14 sm:py-20 scroll-mt-20">
      <SectionTitle icon={Cpu} title="Skills" subtitle="Technologies & expertise" />
      
      <div className="grid md:grid-cols-3 gap-6">
        {skillCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            viewport={{ once: true }}
            className="group"
          >
            <div className="card p-6 h-full hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} border ${category.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-white transition-colors duration-300">
                  {category.title}
                </h3>
              </div>

              {/* Skills Grid */}
              <div className="flex flex-wrap gap-2.5">
                {category.skills.map((skill, skillIndex) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: (categoryIndex * 0.1) + (skillIndex * 0.02),
                      type: "spring",
                      stiffness: 200
                    }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                    className="group/skill"
                  >
                    <span className="chip group-hover/skill:bg-white/15 group-hover/skill:border-white/20 group-hover/skill:text-white transition-all duration-200 cursor-default">
                      {skill}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Subtle accent line */}
              <div className="absolute bottom-2 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  )
}

const Education = () => (
  <section id="education" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={GraduationCap} title="Education" />
    <div className="grid md:grid-cols-2 gap-5">
      {education.map((ed, idx) => (
        <Card key={idx}>
          <h3 className="font-semibold">{ed.school}</h3>
          <p className="text-sm text-white/60">{ed.program}</p>
          <p className="text-sm text-white/60">{ed.location}</p>
          <p className="text-sm text-white/60">{ed.date}</p>
          <p className="text-sm text-white/60">{ed.awards}</p>
        </Card>
      ))}
    </div>
  </section>
)


const Experience = () => {
  // Calculate total years of experience
  const calculateTotalExperience = () => {
    const currentDate = new Date()
    let totalMonths = 0
    
    experience.forEach(job => {
      const dateRange = job.date
      
      if (dateRange.includes("Present")) {
        // Current job - calculate from start date to now
        const startMatch = dateRange.match(/(\w{3})\s+(\d{4})/)
        if (startMatch) {
          const startMonth = new Date(`${startMatch[1]} 1, ${startMatch[2]}`)
          const monthsDiff = (currentDate.getFullYear() - startMonth.getFullYear()) * 12 + 
                           (currentDate.getMonth() - startMonth.getMonth())
          totalMonths += monthsDiff
        }
      } else {
        // Past job - calculate duration
        const dateMatch = dateRange.match(/(\w{3})\s+(\d{4})\s*—\s*(\w{3})\s+(\d{4})/)
        if (dateMatch) {
          const startDate = new Date(`${dateMatch[1]} 1, ${dateMatch[2]}`)
          const endDate = new Date(`${dateMatch[3]} 1, ${dateMatch[4]}`)
          const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (endDate.getMonth() - startDate.getMonth())
          totalMonths += monthsDiff
        }
      }
    })
    
    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
    }
  }

  const totalExperience = calculateTotalExperience()

  return (
    <section id="experience" className="section py-14 sm:py-20 scroll-mt-20">
      <SectionTitle icon={Briefcase} title={`Experience (${totalExperience} Total Professional Experience)`} />
      <HorizontalScrollContainer>
      {experience.map((job, idx) => (
        <div key={idx} className="flex-shrink-0 w-80 flex min-w-0 max-w-80">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{job.title} — <span style={{ color: 'var(--accent)' }}>{job.company}</span></h3>
                <p className="text-sm text-white/60">{job.location} • {job.date}</p>
              </div>
            </div>
            <ul className="mt-3 list-disc list-inside space-y-1 text-white/90">
              {job.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            {job.links?.length ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {job.links.map((l, i) => <LinkIcon key={i} href={l.href} label={l.label} />)}
              </div>
            ) : null}
          </Card>
        </div>
      ))}
    </HorizontalScrollContainer>
  </section>
  )
}

const Projects = () => (
  <section id="projects" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={Cpu} title="Projects" subtitle="Selected work" />
    <HorizontalScrollContainer>
      {projects.map((p, idx) => (
        <div key={idx} className="flex-shrink-0 w-80 flex min-w-0 max-w-80">
          <Card>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold break-words">{p.name}</h3>
              <p className="text-sm text-white/60">{p.date}</p>
              <p className="mt-2 text-white/90 break-words">{p.desc}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {p.links?.map((l, i) => <LinkIcon key={i} href={l.href} label={l.label} />)}
            </div>
          </Card>
        </div>
      ))}
    </HorizontalScrollContainer>
  </section>
)

const Publications = () => (
  <section id="publications" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={BookOpen} title="Publications" />
    <HorizontalScrollContainer>
      {publications.map((pub, idx) => (
        <div key={idx} className="flex-shrink-0 w-80 flex min-w-0 max-w-80">
          <Card>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold break-words">{pub.title}</h3>
              <p className="text-sm text-white/60">{pub.venue}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {pub.links?.map((l, i) => <LinkIcon key={i} href={l.href} label={l.label} />)}
            </div>
          </Card>
        </div>
      ))}
    </HorizontalScrollContainer>
  </section>
)

const Media = () => {
  const [sortBy, setSortBy] = useState('time') // 'time', 'likes', 'views'
  const [isSorting, setIsSorting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const scrollContainerRef = useRef(null)

  // Helper function to parse numeric values from formatted strings
  const parseNumericValue = (value) => {
    if (value === 'Unknown') return 0
    // Handle K and M suffixes properly
    if (value.includes('K')) {
      const num = parseFloat(value.replace('K', ''))
      return isNaN(num) ? 0 : num * 1000
    } else if (value.includes('M')) {
      const num = parseFloat(value.replace('M', ''))
      return isNaN(num) ? 0 : num * 1000000
    } else {
      const num = parseFloat(value)
      return isNaN(num) ? 0 : num
    }
  }

  // Sort videos based on selected criteria
  const sortedVideos = useMemo(() => {
    const videos = [...youtubeVideos]
    
    switch (sortBy) {
      case 'likes':
        return videos.sort((a, b) => parseNumericValue(b.likes) - parseNumericValue(a.likes))
      case 'views':
        return videos.sort((a, b) => parseNumericValue(b.views) - parseNumericValue(a.views))
      case 'time':
      default:
        return videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    }
  }, [sortBy])

  // Handle sort change with smooth animation
  const handleSortChange = (newSortBy) => {
    if (newSortBy !== sortBy) {
      setIsSorting(true)
      setSortBy(newSortBy)
      
      // Reset scroll position to beginning
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      }
      
      // Reset animation state after animation completes
      setTimeout(() => setIsSorting(false), 600)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Prevent page scrolling during animation
  useEffect(() => {
    const handleWheel = (event) => {
      if (isSorting) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    if (isSorting) {
      document.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      document.removeEventListener('wheel', handleWheel)
    }
  }, [isSorting])


  return (
    <section id="media" className="section py-14 sm:py-20 scroll-mt-20">
      <SectionTitle icon={BookOpen} title="Media" subtitle="Articles & Videos" />
      
      {/* YouTube Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <FaYoutube className="w-4 h-4 text-white/70" />
            </div>
            <h3 className="text-lg font-medium text-white/80">YouTube</h3>
          </div>
          
          {/* Custom Sort Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer flex items-center gap-2 min-w-[140px]"
            >
              <span>
                {sortBy === 'time' ? 'Sort by Date' : 
                 sortBy === 'likes' ? 'Sort by Likes' : 'Sort by Views'}
              </span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-white/10 rounded-lg shadow-xl z-50 backdrop-blur-sm">
                <div className="py-1">
                  {[
                    { value: 'time', label: 'Sort by Date' },
                    { value: 'likes', label: 'Sort by Likes' },
                    { value: 'views', label: 'Sort by Views' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleSortChange(option.value)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 hover:bg-accent/20 hover:text-white ${
                        sortBy === option.value 
                          ? 'bg-accent/30 text-white border-l-4 border-accent shadow-lg shadow-accent/20' 
                          : 'text-white/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div 
          className="relative"
          style={{ 
            overflow: 'hidden',
            minHeight: '420px', // Increased height to accommodate hover scaling
            padding: '10px 0' // Add vertical padding to accommodate hover scaling
          }}
        >
          <HorizontalScrollContainer ref={scrollContainerRef}>
            <motion.div 
              className="flex gap-6"
              initial={false}
              animate={{ 
                opacity: isSorting ? 0.3 : 1,
                scale: isSorting ? 0.95 : 1
              }}
              transition={{ 
                duration: 0.3, 
                ease: "easeInOut" 
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={sortBy}
                  className="flex gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: "easeOut" 
                  }}
                >
                  {sortedVideos.map((video, idx) => (
                    <motion.div
                      key={`${video.videoId}-${sortBy}`}
                      className="flex-shrink-0 w-80 flex min-w-0 max-w-80"
                      style={{ margin: '5px 0' }} // Add vertical margin for hover scaling
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: idx * 0.05,
                        ease: "easeOut" 
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                    >
              <Card>
                <div className="flex-1 min-w-0">
                  <div className="relative group">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/320x180/1a1a1a/ffffff?text=Video+Thumbnail'
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
                    >
                      <FaYoutube className="w-12 h-12 text-red-500" />
                    </a>
                  </div>
                  <h3 className="font-semibold mb-2">{video.title}</h3>
                  <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                    <p>{video.publishedAt}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span>{video.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{video.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn w-full flex items-center justify-center gap-2"
                  >
                    <FaYoutube className="w-4 h-4" />
                    Watch on YouTube
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                    </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </HorizontalScrollContainer>
        </div>
      </div>

      {/* Articles Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <BookOpen className="w-4 h-4 text-white/70" />
          </div>
          <h3 className="text-lg font-medium text-white/80">Articles</h3>
        </div>
        <HorizontalScrollContainer>
          {articles.map((article, idx) => (
            <div key={idx} className="flex-shrink-0 w-80 flex min-w-0 max-w-80">
              <Card>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold break-words">{article.title}</h3>
                  <p className="text-sm text-white/60">{article.publisher}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {article.links?.map((l, i) => <LinkIcon key={i} href={l.href} label={l.label} />)}
                </div>
              </Card>
            </div>
          ))}
        </HorizontalScrollContainer>
      </div>
    </section>
  )
}

const ContactShowcase = () => {
  return (
    <section id="contact" className="relative scroll-mt-20">
      {/* soft gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-24 opacity-40 blur-3xl"
        style={{
          scrollMarginTop: 'var(--header-h, 80px)',
          overflowX: 'clip',
          overflowY: 'visible',
          isolation: 'isolate'
        }}
      />
      <div className="section relative z-10 py-16 sm:py-24">
        {/* Top: big centered CTA */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
            Let’s build something together<span style={{ color: 'var(--accent)' }}>.</span>
          </h2>
          <p className="mt-3 text-white/70">
            Email, call, or connect on socials, use whatever's easiest.
          </p>
        </div>

        {/* Bottom: all contact method panels in a grid BELOW */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Primary email */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-sm text-white/60">{profile.email}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="btn" href={`mailto:${profile.email}`}>Open mail</a>
              <CopyButton text={profile.email}>Copy</CopyButton>
            </div>
          </Card>

          {/* Alt email (optional) */}
          {profile.emailAlt ? (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Alternate Email</p>
                    <p className="text-sm text-white/60">{profile.emailAlt}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="btn" href={`mailto:${profile.emailAlt}`}>Open mail</a>
                <CopyButton text={profile.emailAlt}>Copy</CopyButton>
              </div>
            </Card>
          ) : null}

          {/* Phone (optional) */}
          {profile.phone ? (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-sm text-white/60">{profile.phone}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="btn" href={`tel:${profile.phone}`}>Call</a>
                <CopyButton text={profile.phone}>Copy</CopyButton>
              </div>
            </Card>
          ) : null}

          {/* GitHub */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                  <FaGithub className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">GitHub</p>
                  <p className="text-sm text-white/60">Projects & code</p>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <a className="btn w-full" href={profile.links.github} target="_blank" rel="noreferrer">
                Open GitHub <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </Card>

          {/* LinkedIn */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                  <FaLinkedin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">LinkedIn</p>
                  <p className="text-sm text-white/60">Professional profile</p>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <a className="btn w-full" href={profile.links.linkedin} target="_blank" rel="noreferrer">
                Open LinkedIn <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </Card>

          {/* YouTube */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                  <FaYoutube className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">YouTube</p>
                  <p className="text-sm text-white/60">Talks & demos</p>
                </div>
          </div>
          </div>
            <div className="mt-3">
              <a className="btn w-full" href={profile.links.youtube} target="_blank" rel="noreferrer">
                Open YouTube <ExternalLink className="w-4 h-4" />
              </a>
          </div>
          </Card>
        </div>

        {/* X (Twitter) and Huggingface — two cards centered */}
        <div className="mt-4 flex justify-center gap-4">
            {/* Twitter Card */}
            <div className="w-full max-w-full sm:[max-width:calc(50%_-_0.5rem)] lg:[max-width:calc((100%_-_2rem)/3)]">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                      <FaXTwitter className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">X (Twitter)</p>
                      <p className="text-sm text-white/60">
                        @gmongaras
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    className="btn w-full"
                    href={profile.links?.x ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open X <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </Card>
            </div>
            
            {/* Hugging Face Card */}
            <div className="w-full max-w-full sm:[max-width:calc(50%_-_0.5rem)] lg:[max-width:calc((100%_-_2rem)/3)]">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
                      <SiHuggingface className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Hugging Face</p>
                      <p className="text-sm text-white/60">
                        @gmongaras
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    className="btn w-full"
                    href={profile.links?.huggingface ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open HF <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </Card>
            </div>
          </div>


      </div>
    </section>
  )
}




const Footer = () => (
  <footer id="footer" className="section py-12 border-t border-white/10 scroll-mt-20">
    <div className="flex justify-center">
      <div className="text-white/60 text-sm">
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMobileMenuToggle={setIsMobileMenuOpen} />
      <div className="flex-1 relative">
        <main>
          <Hero />
          <Skills />
          <Education />
          <Experience />
          <Projects />
          <Publications />
          <Media />
          {/* <RandomCreations /> */}
          <ContactShowcase />
        </main>
        <Footer />
        {/* Blur overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-none z-30" />
        )}
      </div>
    </div>
  )
}
