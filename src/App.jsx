import { useMemo, useState, useEffect, useRef } from "react"
import { Github, Linkedin, Mail, Youtube, ExternalLink, FileText, GraduationCap, Briefcase, BookOpen, Cpu } from "lucide-react"
import { profile, education, skills, experience, projects, publications, activitiesAwards } from "./data"
import GraphBackground from "./GraphBackground"

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

const Chip = ({ children }) => <span className="chip">{children}</span>

const Card = ({ children }) => <div className="card p-5">{children}</div>

const LinkIcon = ({ href, label }) => (
  <a className="link" href={href} target="_blank" rel="noreferrer">
    <span>{label}</span>
    <ExternalLink className="w-4 h-4" />
  </a>
)

const Header = () => {
  return (
    <header className="border-b border-white/10 sticky top-0 z-40 bg-black/70 backdrop-blur">
      <div className="section py-4 flex items-center justify-between">
        <a href="#" className="font-semibold tracking-wide hover:opacity-90">
          <span className="text-white/70">gm</span>
          <span className="ml-1 px-2 py-1 rounded-md bg-accent/40 border border-accent/50">AI</span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a className="hover:text-accent" href="#experience">Experience</a>
          <a className="hover:text-accent" href="#projects">Projects</a>
          <a className="hover:text-accent" href="#publications">Publications</a>
          <a className="hover:text-accent" href="#education">Education</a>
          <a className="hover:text-accent" href="#skills">Skills</a>
          <a className="hover:text-accent" href="#contact">Contact</a>
        </nav>
        <div className="flex items-center gap-2">
          <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github className="w-4 h-4" /> <span className="hidden md:inline">GitHub</span>
          </a>
          <a className="btn" href={profile.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <Linkedin className="w-4 h-4" /> <span className="hidden md:inline">LinkedIn</span>
          </a>
        </div>
      </div>
    </header>
  )
}

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
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a className="btn btn-primary" href="/Resume.pdf" target="_blank" rel="noreferrer">
                <FileText className="w-4 h-4" />
                <span>Resume (PDF)</span>
              </a>
              <a className="btn" href={profile.links.site} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" />
                <span>gabrielm.cc</span>
              </a>
              <a className="btn" href={profile.links.youtube} target="_blank" rel="noreferrer">
                <Youtube className="w-4 h-4" />
                <span>YouTube</span>
              </a>
            </div>
          </div>
          <Card>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <div className="flex flex-wrap gap-2">
              <Chip>{profile.email}</Chip>
              <Chip>{profile.emailAlt}</Chip>
              <Chip>{profile.phone}</Chip>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a className="btn" href={`mailto:${profile.email}`}><Mail className="w-4 h-4" /> Email me</a>
              <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer"><Github className="w-4 h-4" /> GitHub</a>
              <a className="btn" href={profile.links.linkedin} target="_blank" rel="noreferrer"><Linkedin className="w-4 h-4" /> LinkedIn</a>
              <a className="btn" href={profile.links.youtube} target="_blank" rel="noreferrer"><Youtube className="w-4 h-4" /> YouTube</a>
            </div>
          </Card>
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

const Footer = () => (
  <footer id="contact" className="section py-12 border-t border-white/10">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <h3 className="text-lg font-semibold">{profile.name}</h3>
        <p className="text-white/70">{profile.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a className="btn" href={`mailto:${profile.email}`}><Mail className="w-4 h-4" /> {profile.email}</a>
          <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer"><Github className="w-4 h-4" /> GitHub</a>
          <a className="btn" href={profile.links.linkedin} target="_blank" rel="noreferrer"><Linkedin className="w-4 h-4" /> LinkedIn</a>
          <a className="btn" href={profile.links.youtube} target="_blank" rel="noreferrer"><Youtube className="w-4 h-4" /> YouTube</a>
        </div>
      </div>
      <div className="text-white/60 text-sm">
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
      </main>
      <Footer />
    </div>
  )
}
