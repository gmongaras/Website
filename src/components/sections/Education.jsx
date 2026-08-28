import { GraduationCap } from 'lucide-react'
import { education } from '../../data'
import Card from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'

const Education = () => (
  <section id="education" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={GraduationCap} title="Education" />
    <div className="grid md:grid-cols-2 gap-5">
      {education.map((entry) => (
        <Card key={`${entry.school}-${entry.program}`}>
          <h3 className="font-semibold">{entry.school}</h3>
          <p className="text-sm text-white/60">{entry.program}</p>
          <p className="text-sm text-white/60">{entry.location}</p>
          <p className="text-sm text-white/60">{entry.date}</p>
          <p className="text-sm text-white/60">{entry.awards}</p>
        </Card>
      ))}
    </div>
  </section>
)

export default Education
