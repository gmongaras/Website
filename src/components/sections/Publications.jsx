import { BookOpen } from 'lucide-react'
import { publications } from '../../data'
import Card from '../ui/Card'
import HorizontalScrollContainer from '../ui/HorizontalScrollContainer'
import LinkIcon from '../ui/LinkIcon'
import ScrollRowItem from '../ui/ScrollRowItem'
import SectionTitle from '../ui/SectionTitle'

const Publications = () => (
  <section id="publications" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={BookOpen} title="Publications" />
    <HorizontalScrollContainer>
      {publications.map((publication) => (
        <ScrollRowItem key={publication.title}>
          <Card>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold break-words">{publication.title}</h3>
              <p className="text-sm text-white/60">{publication.venue}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {publication.links?.map((link) => <LinkIcon key={link.href} href={link.href} label={link.label} />)}
            </div>
          </Card>
        </ScrollRowItem>
      ))}
    </HorizontalScrollContainer>
  </section>
)

export default Publications
