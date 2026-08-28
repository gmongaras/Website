import { ExternalLink, Mail, Phone } from 'lucide-react'
import { FaGithub, FaLinkedin, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { SiHuggingface } from 'react-icons/si'
import { profile } from '../../data'
import Card from '../ui/Card'
import CopyButton from '../ui/CopyButton'

const ContactCard = ({ icon: Icon, title, detail, children }) => (
  <Card>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-white/60">{detail}</p>
        </div>
      </div>
    </div>
    {children}
  </Card>
)

// A contact detail that can be opened in an app or copied to the clipboard.
const DirectContactCard = ({ icon, title, value, href, openLabel }) => (
  <ContactCard icon={icon} title={title} detail={value}>
    <div className="mt-3 flex flex-wrap gap-2">
      <a className="btn" href={href}>{openLabel}</a>
      <CopyButton text={value}>Copy</CopyButton>
    </div>
  </ContactCard>
)

const ProfileLinkCard = ({ icon, title, detail, href, openLabel }) => (
  <ContactCard icon={icon} title={title} detail={detail}>
    <div className="mt-3">
      <a className="btn w-full" href={href} target="_blank" rel="noreferrer">
        {openLabel} <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  </ContactCard>
)

// Sits under the three-column grid, so each card is capped at one column width.
const CenteredCardSlot = ({ children }) => (
  <div className="w-full max-w-full sm:[max-width:calc(50%_-_0.5rem)] lg:[max-width:calc((100%_-_2rem)/3)]">
    {children}
  </div>
)

const Contact = () => (
  <section id="contact" className="relative scroll-mt-20">
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-24 opacity-40 blur-3xl"
      style={{ overflowX: 'clip', overflowY: 'visible', isolation: 'isolate' }}
    />
    <div className="section relative z-10 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
          Let’s build something together<span style={{ color: 'var(--accent)' }}>.</span>
        </h2>
        <p className="mt-3 text-white/70">
          Email, call, or connect on socials, use whatever's easiest.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DirectContactCard
          icon={Mail}
          title="Email"
          value={profile.email}
          href={`mailto:${profile.email}`}
          openLabel="Open mail"
        />

        {profile.emailAlt ? (
          <DirectContactCard
            icon={Mail}
            title="Alternate Email"
            value={profile.emailAlt}
            href={`mailto:${profile.emailAlt}`}
            openLabel="Open mail"
          />
        ) : null}

        {profile.phone ? (
          <DirectContactCard
            icon={Phone}
            title="Phone"
            value={profile.phone}
            href={`tel:${profile.phone}`}
            openLabel="Call"
          />
        ) : null}

        <ProfileLinkCard
          icon={FaGithub}
          title="GitHub"
          detail="Projects & code"
          href={profile.links.github}
          openLabel="Open GitHub"
        />
        <ProfileLinkCard
          icon={FaLinkedin}
          title="LinkedIn"
          detail="Professional profile"
          href={profile.links.linkedin}
          openLabel="Open LinkedIn"
        />
        <ProfileLinkCard
          icon={FaYoutube}
          title="YouTube"
          detail="Talks & demos"
          href={profile.links.youtube}
          openLabel="Open YouTube"
        />
      </div>

      <div className="mt-4 flex justify-center gap-4">
        <CenteredCardSlot>
          <ProfileLinkCard
            icon={FaXTwitter}
            title="X (Twitter)"
            detail="@gmongaras"
            href={profile.links?.x ?? '#'}
            openLabel="Open X"
          />
        </CenteredCardSlot>
        <CenteredCardSlot>
          <ProfileLinkCard
            icon={SiHuggingface}
            title="Hugging Face"
            detail="@gmongaras"
            href={profile.links?.huggingface ?? '#'}
            openLabel="Open HF"
          />
        </CenteredCardSlot>
      </div>
    </div>
  </section>
)

export default Contact
