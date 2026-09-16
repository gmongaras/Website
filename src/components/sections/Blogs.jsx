import { BookAudio, ExternalLink } from 'lucide-react'
import { loadPost, posts } from '../../blogs'
import Card from '../ui/Card'
import ExpandableList from '../ui/ExpandableList'
import SectionTitle from '../ui/SectionTitle'

const Blogs = () => (
  <section id="blogs" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={BookAudio} title="Blogs" subtitle="Thoughts & insights" />
    <ExpandableList className="space-y-4">
      {posts.map((post) => (
        <Card key={post.slug} className="gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold break-words">{post.title}</h3>
            <p className="mt-1 text-sm text-white/50">{post.date}</p>
            <p className="mt-3 text-white/80 break-words">{post.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => <span key={tag} className="chip text-xs">{tag}</span>)}
            </div>
          </div>
          <a
            href={`#blog/${post.slug}`}
            className="btn flex min-h-11 shrink-0 items-center justify-center gap-2 sm:self-center"
            onPointerEnter={() => { loadPost(post.slug).catch(() => {}) }}
            onFocus={() => { loadPost(post.slug).catch(() => {}) }}
            // The blog view renders at the current scroll offset, so the
            // page is sent back to the top as the hash changes.
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Read More
            <ExternalLink className="w-4 h-4" />
          </a>
        </Card>
      ))}
    </ExpandableList>
  </section>
)

export default Blogs
