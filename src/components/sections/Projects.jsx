import { ArrowUpRight } from 'lucide-react'
import { formatDate } from '../../lib/formatDate'
import { projects } from '../../projects'

const ProjectLink = ({ project }) => {
  const href = project.links?.[0]?.href
  const name = project.name.trim()
  const desc = project.desc.trim()
  const showDesc = desc && desc !== name && desc !== `Project: ${name}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group grid grid-cols-1 gap-2 rounded-2xl px-3 py-5 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-start sm:gap-x-6 sm:px-4 sm:py-7"
    >
      <time className="text-sm text-white/50 sm:pt-1">{formatDate(project.date)}</time>

      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-[var(--accent)] sm:text-xl">
          {name}
        </h2>
        {showDesc ? <p className="mt-2 text-sm text-white/70 sm:text-base">{desc}</p> : null}
        {project.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span key={skill} className="chip px-2.5 py-0.5 text-xs">{skill}</span>
            ))}
          </div>
        )}
      </div>

      <ArrowUpRight
        aria-hidden
        className="hidden h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)] sm:block"
      />
    </a>
  )
}

const Projects = () => (
  <section className="section py-10 sm:py-16">
    <header className="max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Projects</h1>
      <p className="mt-4 text-base text-white/70 sm:text-lg">
        Code from papers, kernels, experiments, and random side quests.
      </p>
    </header>

    <ol className="mt-6 divide-y divide-white/10 border-y border-white/10 sm:mt-10">
      {projects.map((project) => (
        <li key={project.name}>
          <ProjectLink project={project} />
        </li>
      ))}
    </ol>
  </section>
)

export default Projects
