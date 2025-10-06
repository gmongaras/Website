import { useMemo, useState, useEffect, useRef } from "react"
import { Menu, X, Mail, ExternalLink, FileText, GraduationCap, Briefcase, BookOpen, Cpu, Phone } from "lucide-react"
import { FaXTwitter, FaLinkedin, FaYoutube, FaGithub } from "react-icons/fa6"
import { profile, education, skills, experience, projects, publications, activitiesAwards } from "./data"
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
  <div className="flex items-end justify-between mb-6">
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

const Card = ({ children }) => <div className="card p-5">{children}</div>

const LinkIcon = ({ href, label }) => (
  <a className="link" href={href} target="_blank" rel="noreferrer">
    <span>{label}</span>
    <ExternalLink className="w-4 h-4" />
  </a>
)

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll and close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false) }
    document.body.style.overflow = open ? "hidden" : ""
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  // C) Auto-close the sheet if resizing to >= sm (640px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
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
    { href: "#experience", label: "Experience", icon: Briefcase },
    { href: "#projects", label: "Projects", icon: Cpu },
    { href: "#publications", label: "Publications", icon: BookOpen },
    { href: "#education", label: "Education", icon: GraduationCap },
    { href: "#skills", label: "Skills", icon: Cpu },
    { href: "#contact", label: "Contact", icon: Mail },
  ]

  return (
    <header className="sticky top-0 z-40 bg-black/70 backdrop-blur relative">
      <div className="section py-4 flex items-center justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2 tracking-wide hover:opacity-90">
          <img
            src="/canvas.png"
            alt="Canvas"
            className="h-10 w-10 sm:h-16 sm:w-16 rounded-md object-cover shadow-sm"
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
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
            <div className="hidden sm:flex">
              <a
                className="btn btn-primary"
                href="#contact"
                aria-label="Jump to contact section"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden md:inline">Contact me</span>
              </a>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-controls="mobile-nav"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="sm:hidden relative inline-flex items-center justify-center p-2 rounded-xl ring-1 ring-[color:var(--accent)]/50
                       transition focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            style={{ background: 'var(--gradient-pfp)', color: 'var(--accent)' }}
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
              className="fixed z-50 left-3 right-3 top-3 rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl"
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
                <a className="btn btn-primary w-full" href="#contact">
                  <Mail className="w-4 h-4" /> Contact
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
  <div className="relative group mx-auto md:mx-0 w-full max-w-[15rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-none">
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


// --- Update the Hero layout to put Quick Links under the top-row CTAs ---
const Hero = () => {
  const heroRef = useRef(null)
  
  return (
    <div ref={heroRef} className="accent-gradient border-b border-white/10 relative overflow-hidden">
      <GraphBackground containerRef={heroRef} />
      <div className="section py-16 sm:py-24 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2">
            <p className="text-sm text-white/60 mb-3">{profile.location}</p>
            <TypingAnimation />
            <p className="mt-3 text-lg sm:text-xl text-white/80">{profile.tagline}</p>
            <p className="mt-4 max-w-2xl text-white/70">{profile.summary}</p>

            {/* top row with Resume, github, LinkedIn and YouTube */}
            <div className="mt-6 grid grid-cols-4 gap-3">
              <a className="btn btn-primary" href="/Resume.pdf" target="_blank" rel="noreferrer">
                <FileText className="w-4 h-4" />
                <span>Resume (PDF)</span>
              </a>
              <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
                <FaGithub className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <a className="btn" href={profile.links.linkedin} target="_blank" rel="noreferrer">
                <FaLinkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
              <a className="btn" href={profile.links.youtube} target="_blank" rel="noreferrer">
                <FaYoutube className="w-4 h-4" />
                <span>YouTube</span>
              </a>
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


const Experience = () => (
  <section id="experience" className="section py-14 sm:py-20">
    <SectionTitle icon={Briefcase} title="Experience" />
    <div className="grid md:grid-cols-2 gap-5">
      {experience.map((job, idx) => (
        <Card key={idx}>
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
      ))}
    </div>
  </section>
)

const Projects = () => (
  <section id="projects" className="section py-14 sm:py-20">
    <SectionTitle icon={Cpu} title="Projects" subtitle="Selected work" />
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((p, idx) => (
        <Card key={idx}>
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-sm text-white/60">{p.date}</p>
          <p className="mt-2 text-white/90">{p.desc}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {p.links?.map((l, i) => <LinkIcon key={i} href={l.href} label={l.label} />)}
          </div>
        </Card>
      ))}
    </div>
  </section>
)

const Publications = () => (
  <section id="publications" className="section py-14 sm:py-20">
    <SectionTitle icon={BookOpen} title="Publications & Articles" />
    <div className="grid md:grid-cols-2 gap-5">
      {publications.map((pub, idx) => (
        <Card key={idx}>
          <h3 className="font-semibold">{pub.title}</h3>
          <p className="text-sm text-white/60">{pub.venue}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {pub.links?.map((l, i) => <LinkIcon key={i} href={l.href} label={l.label} />)}
          </div>
        </Card>
      ))}
    </div>
  </section>
)

const Education = () => (
  <section id="education" className="section py-14 sm:py-20">
    <SectionTitle icon={GraduationCap} title="Education" />
    <div className="grid md:grid-cols-3 gap-5">
      {education.map((ed, idx) => (
        <Card key={idx}>
          <h3 className="font-semibold">{ed.school}</h3>
          <p className="text-sm text-white/60">{ed.program}</p>
          <p className="text-sm text-white/60">{ed.location}</p>
          <p className="text-sm text-white/60">{ed.date}</p>
        </Card>
      ))}
    </div>
  </section>
)

const Skills = () => {
  const all = useMemo(() => [
    ...skills.coding.map(s => ({ group: "Coding", s })),
    ...skills.ai.map(s => ({ group: "AI/ML", s })),
    ...skills.other.map(s => ({ group: "Other", s })),
  ], [])

  return (
    <section id="skills" className="section py-14 sm:py-20">
      <SectionTitle icon={Cpu} title="Skills" />
      <div className="card p-0">
        <div className="grid md:grid-cols-3">
          <div className="p-5 border-b md:border-b-0 md:border-r border-white/10">
            <h4 className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>Coding</h4>
            <div className="flex flex-wrap gap-2">{skills.coding.map((c,i)=><Chip key={i}>{c}</Chip>)}</div>
          </div>
          <div className="p-5 border-b md:border-b-0 md:border-r border-white/10">
            <h4 className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>AI / ML</h4>
            <div className="flex flex-wrap gap-2">{skills.ai.map((c,i)=><Chip key={i}>{c}</Chip>)}</div>
          </div>
          <div className="p-5">
            <h4 className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>Other</h4>
            <div className="flex flex-wrap gap-2">{skills.other.map((c,i)=><Chip key={i}>{c}</Chip>)}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

const ContactShowcase = () => {
  return (
    <section id="contact" className="relative scroll-mt-24">
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

        {/* X (Twitter) — single centered card */}
        <div className="mt-4 flex justify-center">
            {/* Match grid column width: 
                - base: full
                - sm: (50% - gap/2)
                - lg: ((100% - 2*gap)/3)
                (your grid uses gap-4 => 1rem) */}
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
          </div>

      </div>
    </section>
  )
}




const Footer = () => (
  <footer id="footer" className="section py-12 border-t border-white/10" style={{ scrollMarginTop: 'var(--header-h, 80px)' }}>
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center gap-6">
      <div className="text-white/60 text-sm justify-self-end">
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Experience />
        <Projects />
        <Publications />
        <Education />
        <Skills />
        <ContactShowcase />
      </main>
      <Footer />
    </div>
  )
}
