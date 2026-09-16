import { BookOpen, Briefcase, Cpu } from 'lucide-react'
import { skills } from '../../data'
import SectionTitle from '../ui/SectionTitle'

const CATEGORIES = [
  {
    title: 'Coding',
    icon: Cpu,
    skills: skills.coding,
    color: 'from-blue-500/20 to-purple-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    title: 'AI / ML',
    icon: BookOpen,
    skills: skills.ai,
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
  },
  {
    title: 'Other',
    icon: Briefcase,
    skills: skills.other,
    color: 'from-green-500/20 to-blue-500/20',
    borderColor: 'border-green-500/30',
  },
]

const Skills = () => (
  <section id="skills" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={Cpu} title="Skills" subtitle="Technologies & expertise" />

    <div className="grid md:grid-cols-3 gap-6">
      {CATEGORIES.map((category) => (
        <div
          key={category.title}
          className="group"
        >
          <div className="card p-6 h-full hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} border ${category.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                <category.icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-xl font-semibold group-hover:text-white transition-colors duration-300">
                {category.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {category.skills.map((skill) => (
                <div
                  key={skill}
                  className="group/skill transition-transform duration-200 hover:scale-105"
                >
                  <span className="chip group-hover/skill:bg-white/15 group-hover/skill:border-white/20 group-hover/skill:text-white transition-all duration-200 cursor-default">
                    {skill}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute bottom-2 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      ))}
    </div>
  </section>
)

export default Skills
