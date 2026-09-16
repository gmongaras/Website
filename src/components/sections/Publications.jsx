import { BookOpen } from 'lucide-react'
import { publications } from '../../data'
import Card from '../ui/Card'
import ExpandableList from '../ui/ExpandableList'
import LinkIcon from '../ui/LinkIcon'
import SectionTitle from '../ui/SectionTitle'

const Publications = () => (
  <section id="publications" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={BookOpen} title="Publications" />
    <ExpandableList className="space-y-3">
      {publications.map((publication) => (
        <Card
          key={publication.title}
          className="gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-snug break-words">{publication.title}</h3>
            <p className="mt-1 text-sm text-white/60">{publication.venue}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            {publication.links?.map((link) => <LinkIcon key={link.href} href={link.href} label={link.label} />)}
          </div>
        </Card>
      ))}
    </ExpandableList>
  </section>
)

export default Publications
