import { ArrowUpRight } from 'lucide-react'
import { loadPost, posts } from '../../blogs'
import { formatDate } from '../../lib/formatDate'

const prefetch = (slug) => {
  loadPost(slug).catch(() => {})
}

const PostLink = ({ post }) => (
  <a
    href={`#blog/${post.slug}`}
    onPointerEnter={() => prefetch(post.slug)}
    onFocus={() => prefetch(post.slug)}
    className="group grid grid-cols-1 gap-2 rounded-2xl px-3 py-5 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-x-6 sm:px-4 sm:py-7"
  >
    <time dateTime={post.date} className="text-sm text-white/50 sm:pt-1">
      {formatDate(post.date)}
    </time>

    <div className="min-w-0">
      <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-[var(--accent)] sm:text-xl">
        {post.title}
      </h2>
      <p className="mt-2 text-sm text-white/70 sm:text-base">{post.excerpt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span key={tag} className="chip px-2.5 py-0.5 text-xs">{tag}</span>
        ))}
      </div>
    </div>

    <ArrowUpRight
      aria-hidden
      className="hidden h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)] sm:block"
    />
  </a>
)

const Blogs = () => (
  <section className="section py-10 sm:py-16">
    <header className="max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Blogs</h1>
      <p className="mt-4 text-base text-white/70 sm:text-lg">
        Blogs on stuff I am learning about or just want to yap about.
      </p>
    </header>

    <ol className="mt-6 divide-y divide-white/10 border-y border-white/10 sm:mt-10">
      {posts.map((post) => (
        <li key={post.slug}>
          <PostLink post={post} />
        </li>
      ))}
    </ol>
  </section>
)

export default Blogs
