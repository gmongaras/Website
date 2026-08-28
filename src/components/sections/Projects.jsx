import { useState } from 'react'
import { Cpu } from 'lucide-react'
import { projects } from '../../projects'
import Card from '../ui/Card'
import HorizontalScrollContainer from '../ui/HorizontalScrollContainer'
import LazyImage from '../ui/LazyImage'
import LinkIcon from '../ui/LinkIcon'
import ScrollRowItem from '../ui/ScrollRowItem'
import SectionTitle from '../ui/SectionTitle'

const ImagePlaceholder = ({ label }) => (
  <div className="w-full h-48 bg-gradient-to-br from-white/10 to-white/5 rounded-lg flex items-center justify-center border border-white/10">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-3 bg-accent/20 rounded-xl flex items-center justify-center">
        <Cpu className="w-8 h-8 text-accent" />
      </div>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  </div>
)

const Projects = () => {
  const [failedImages, setFailedImages] = useState(() => new Set())

  const markImageFailed = (name) => {
    setFailedImages((failed) => new Set(failed).add(name))
  }

  return (
    <section id="projects" className="section py-14 sm:py-20 scroll-mt-20">
      <SectionTitle icon={Cpu} title="Projects" subtitle="Selected work" />
      <HorizontalScrollContainer>
        {projects.map((project) => (
          <ScrollRowItem key={project.name}>
            <Card className="group">
              <div className="flex-1 min-w-0">
                <div className="relative mb-4">
                  {project.image && !failedImages.has(project.name) ? (
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/2 flex items-center justify-center">
                      <LazyImage
                        src={project.image}
                        alt={project.name}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                        onError={() => markImageFailed(project.name)}
                      />
                    </div>
                  ) : (
                    <ImagePlaceholder label={project.name} />
                  )}
                </div>
                <h3 className="font-semibold break-words">{project.name}</h3>
                <p className="text-sm text-white/60">{project.date}</p>
                <p className="mt-2 text-white/90 break-words">{project.desc}</p>
                {project.skills && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.skills.map((skill) => <span key={skill} className="chip text-xs">{skill}</span>)}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {project.links?.map((link) => <LinkIcon key={link.href} href={link.href} label={link.label} />)}
              </div>
            </Card>
          </ScrollRowItem>
        ))}
      </HorizontalScrollContainer>
    </section>
  )
}

export default Projects
