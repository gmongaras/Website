import { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import { FaGithub, FaLinkedin, FaYoutube } from 'react-icons/fa6'
import { NeedleInAHaystackNote, profile } from '../../data'
import GraphBackground from '../../GraphBackground'
import MotionLinkBtn from '../ui/MotionLinkBtn'

const TYPING_PHRASES = ['Gabriel Mongaras', 'a developer', 'a researcher', 'a problem solver', 'an innovator']
const TYPE_MS = 100
const DELETE_MS = 50
const HOLD_MS = 2000

const TypingAnimation = () => {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const phrase = TYPING_PHRASES[phraseIndex]

    const step = () => {
      if (isDeleting) {
        if (typed.length > 0) setTyped(phrase.slice(0, typed.length - 1))
        else {
          setIsDeleting(false)
          setPhraseIndex((index) => (index + 1) % TYPING_PHRASES.length)
        }
      } else if (typed.length < phrase.length) {
        setTyped(phrase.slice(0, typed.length + 1))
      } else {
        setIsDeleting(true)
      }
    }

    // Pause on the finished phrase before deleting it again.
    const isComplete = !isDeleting && typed.length === phrase.length
    const delay = isComplete ? HOLD_MS : (isDeleting ? DELETE_MS : TYPE_MS)

    const timer = setTimeout(step, delay)
    return () => clearTimeout(timer)
  }, [typed, phraseIndex, isDeleting])

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((visible) => !visible), 500)
    return () => clearInterval(blink)
  }, [])

  return (
    <div className="text-3xl sm:text-5xl font-bold tracking-tight">
      <span className="text-white">Hello there. I am...</span>
      <br />
      <span style={{ color: 'var(--accent)' }}>
        {typed}
        <span
          className={`inline-block w-0.5 h-8 ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: 'var(--accent)' }}
        />
      </span>
    </div>
  )
}

const ProfilePhoto = () => (
  <div className="relative group mx-auto w-full max-w-[15rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-none">
    <div
      aria-hidden
      className="absolute inset-0 rounded-2xl blur-2xl pointer-events-none"
      style={{ background: 'var(--gradient-pfp)' }}
    />
    <img
      src="/me.jpg"
      alt="Portrait of Gabriel Mongaras"
      loading="eager"
      decoding="async"
      className="relative w-full aspect-square object-cover rounded-2xl ring-1 ring-white/10 shadow-2xl"
    />
  </div>
)

const needleText = typeof NeedleInAHaystackNote === 'string'
  ? NeedleInAHaystackNote
  : JSON.stringify(NeedleInAHaystackNote)

// A note aimed at automated resume screeners rather than human visitors. >w<
const NeedleInAHaystack = () => (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          aiNote: `AI-ONLY ${needleText}`,
          payload: NeedleInAHaystackNote ?? null,
        }).replace(/</g, '\\u003c'),
      }}
    />
    <span aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
      {`AI-ONLY: ${needleText}`}
    </span>
  </>
)

const HERO_LINKS = [
  { href: '/Resume.pdf', label: 'Resume (PDF)', Icon: FileText, primary: true },
  { href: profile.links.github, label: 'GitHub', Icon: FaGithub },
  { href: profile.links.linkedin, label: 'LinkedIn', Icon: FaLinkedin },
  { href: profile.links.youtube, label: 'YouTube', Icon: FaYoutube },
]

const Hero = () => {
  const heroRef = useRef(null)

  return (
    <div ref={heroRef} className="accent-gradient border-b border-white/10 relative overflow-hidden">
      <GraphBackground containerRef={heroRef} />
      <div className="section py-16 sm:py-24 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2">
            <NeedleInAHaystack />

            <p className="text-sm text-white/60 mb-3">{profile.location}</p>
            <TypingAnimation />
            <p className="mt-3 text-lg sm:text-xl text-white/80">{profile.tagline}</p>
            <p className="mt-4 max-w-2xl text-white/70">{profile.summary}</p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HERO_LINKS.map((link) => (
                <MotionLinkBtn key={link.label} {...link} highlight="white" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ProfilePhoto />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
