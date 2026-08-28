import { useMemo } from 'react'
import { Briefcase } from 'lucide-react'
import { experience } from '../../data'
import { formatTotalExperience } from '../../lib/experience'
import Card from '../ui/Card'
import HorizontalScrollContainer from '../ui/HorizontalScrollContainer'
import LinkIcon from '../ui/LinkIcon'
import ScrollRowItem from '../ui/ScrollRowItem'
import SectionTitle from '../ui/SectionTitle'

const Experience = () => {
  const total = useMemo(() => formatTotalExperience(experience), [])

  return (
    <section id="experience" className="section py-14 sm:py-20 scroll-mt-20">
      <SectionTitle icon={Briefcase} title={`Experience (${total} Total Professional Experience)`} />
      <HorizontalScrollContainer>
        {experience.map((job) => (
          <ScrollRowItem key={`${job.company}-${job.date}`}>
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {job.title} — <span style={{ color: 'var(--accent)' }}>{job.company}</span>
                  </h3>
                  <p className="text-sm text-white/60">{job.location} • {job.date}</p>
                </div>
              </div>
              <ul className="mt-3 list-disc list-inside space-y-1 text-white/90">
                {job.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
              {job.links?.length ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {job.links.map((link) => <LinkIcon key={link.href} href={link.href} label={link.label} />)}
                </div>
              ) : null}
            </Card>
          </ScrollRowItem>
        ))}
      </HorizontalScrollContainer>
    </section>
  )
}

export default Experience
