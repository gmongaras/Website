import { publications } from '../../data'
import { formatDate } from '../../lib/formatDate'
import LinkIcon from '../ui/LinkIcon'

const ROW_CLASS = 'grid grid-cols-1 gap-2 rounded-2xl px-3 py-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-start sm:gap-x-6 sm:px-4 sm:py-7'

const Publications = () => (
  <section className="section py-10 sm:py-16">
    <header className="max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Research</h1>
      <p className="mt-4 text-base text-white/70 sm:text-lg">
        Papers I have written, mostly on attention... it's all you need.
      </p>
    </header>

    <ol className="mt-6 divide-y divide-white/10 border-y border-white/10 sm:mt-10">
      {publications.map((publication) => (
        <li key={publication.title}>
          <article className={ROW_CLASS}>
            <time dateTime={publication.date} className="text-sm text-white/50 sm:pt-1">
              {formatDate(publication.date)}
            </time>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                {publication.title}
              </h2>
              <p className="mt-2 text-sm text-white/50">{publication.venue}</p>
              {publication.links?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {publication.links.map((link) => (
                    <LinkIcon key={link.href} href={link.href} label={link.label} />
                  ))}
                </div>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  </section>
)

export default Publications
