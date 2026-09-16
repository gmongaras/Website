import { useMemo } from 'react'
import { Briefcase } from 'lucide-react'
import { experience } from '../../data'
import { formatTotalExperience } from '../../lib/experience'
import Card from '../ui/Card'
import ExpandableList from '../ui/ExpandableList'
import LinkIcon from '../ui/LinkIcon'
import SectionTitle from '../ui/SectionTitle'

const Experience = () => {
  const total = useMemo(() => formatTotalExperience(experience), [])

  return (
    <section id="experience" className="section py-14 sm:py-20 scroll-mt-20">
      <SectionTitle icon={Briefcase} title={`Experience (${total} Total Professional Experience)`} />
      <ExpandableList className="space-y-4">
        {experience.map((job) => (
          <Card key={`${job.company}-${job.date}`} className="border-l-2 border-l-accent/70">
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-6">
              <div>
                <h3 className="font-semibold">
                  {job.title} — <span style={{ color: 'var(--accent)' }}>{job.company}</span>
                </h3>
                <p className="mt-1 text-sm text-white/60">{job.location}</p>
              </div>
              <p className="shrink-0 text-sm text-white/50 sm:text-right">{job.date}</p>
            </div>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-white/90">
              {job.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
            {job.links?.length ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {job.links.map((link) => <LinkIcon key={link.href} href={link.href} label={link.label} />)}
              </div>
            ) : null}
          </Card>
        ))}
      </ExpandableList>
    </section>
  )
}

export default Experience
