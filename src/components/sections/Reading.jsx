import { useState } from 'react'
import { blogs, books, courses, papers } from '../../reading'
import LinkIcon from '../ui/LinkIcon'

const ReadingSection = ({ title, items, emptyMessage }) => {
  const headingId = `reading-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section className="mt-10 first:mt-8" aria-labelledby={headingId}>
    <h2 id={headingId} className="text-2xl font-semibold tracking-tight sm:text-3xl">
      {title}
    </h2>

    {items.length ? (
      <ol className="mt-4 divide-y divide-white/10 border-y border-white/10">
        {items.map((item) => (
          <li key={item.title}>
            <article className="flex items-start justify-between gap-4 px-3 py-5 sm:px-4 sm:py-6">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-snug sm:text-xl">
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">
                      {item.title}
                    </a>
                  ) : item.title}
                </h3>
                {item.author ? <p className="mt-1 text-sm text-white/60">{item.author}</p> : null}
                {item.note ? <p className="mt-2 text-sm text-white/70 sm:text-base">{item.note}</p> : null}
                {item.links?.length ? (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {item.links.map((link) => <LinkIcon key={link.href} {...link} />)}
                  </div>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ol>
    ) : (
      <p className="mt-4 border-y border-white/10 px-3 py-5 text-sm text-white/55 sm:px-4">
        {emptyMessage}
      </p>
    )}
    </section>
  )
}

const Reading = () => (
  <ReadingPage />
)

const ReadingPage = () => {
  const [activeSection, setActiveSection] = useState('books')
  const sections = [
    { id: 'books', title: 'Books', items: books, emptyMessage: 'No books added yet.' },
    { id: 'papers', title: 'Papers', items: papers, emptyMessage: 'No papers added yet.' },
    { id: 'blogs', title: 'Blogs', items: blogs, emptyMessage: 'No blogs added yet.' },
    { id: 'courses', title: 'Courses', items: courses, emptyMessage: 'No courses added yet.' },
  ]
  const active = sections.find((section) => section.id === activeSection) ?? sections[0]

  return (
    <div className="section py-10 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Reading</h1>
        <p className="mt-4 text-base text-white/70 sm:text-lg">
          Stuff I have read or found online that I think is worth sharing. Started this a bit late but better to start a collection now than never.
        </p>
      </header>

      <nav aria-label="Reading categories" className="mt-8 flex flex-wrap gap-x-5 border-b border-white/10">
        {sections.map((section) => {
          const isActive = section.id === active.id
          return (
            <button
              key={section.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveSection(section.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-[var(--accent)] text-white'
                  : 'border-transparent text-white/55 hover:text-white'
              }`}
            >
              {section.title}
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/60">
                {section.items.length}
              </span>
            </button>
          )
        })}
      </nav>

      <ReadingSection
        title={active.title}
        items={active.items}
        emptyMessage={active.emptyMessage}
      />
    </div>
  )
}

export default Reading