import { BookAudio, ExternalLink } from 'lucide-react'
import { posts } from '../../blogs'
import Card from '../ui/Card'
import HorizontalScrollContainer from '../ui/HorizontalScrollContainer'
import ScrollRowItem from '../ui/ScrollRowItem'
import SectionTitle from '../ui/SectionTitle'

const Blogs = () => (
  <section id="blogs" className="section py-14 sm:py-20 scroll-mt-20">
    <SectionTitle icon={BookAudio} title="Blogs" subtitle="Thoughts & insights" />
    <HorizontalScrollContainer>
      {posts.map((post) => (
        <ScrollRowItem key={post.slug}>
          <Card>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold break-words">{post.title}</h3>
              <p className="text-sm text-white/60 mt-1">{post.date}</p>
              <p className="mt-3 text-white/90 break-words">{post.excerpt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => <span key={tag} className="chip text-xs">{tag}</span>)}
              </div>
            </div>
            <div className="mt-4">
              <a
                href={`#blog/${post.slug}`}
                className="btn w-full flex items-center justify-center gap-2"
                // The blog view renders at the current scroll offset, so the
                // page is sent back to the top as the hash changes.
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Read More
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </Card>
        </ScrollRowItem>
      ))}
    </HorizontalScrollContainer>
  </section>
)

export default Blogs
