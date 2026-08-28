import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { buildTocTree, renderHeadingMathHtml } from '../../lib/markdown'

// How far down the viewport a heading has to be before it counts as "current".
const activationLine = () => Math.max(96, window.innerHeight * 0.2)

const HeadingLabel = ({ text }) => (
  <span dangerouslySetInnerHTML={{ __html: renderHeadingMathHtml(text) }} />
)

const isPlainClick = (event) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

const TocLink = ({ heading, postSlug, isActive, onSelect, className = '' }) => (
  <a
    href={`#blog/${postSlug}/${heading.slug}`}
    className={`toc-link ${isActive ? 'active' : ''} ${className}`}
    aria-current={isActive ? 'location' : undefined}
    onClick={(event) => {
      if (!isPlainClick(event)) return
      event.preventDefault()
      onSelect(heading.slug)
    }}
  >
    <HeadingLabel text={heading.text} />
  </a>
)

/**
 * Sidebar contents for an article. Level-2 headings are collapsible sections
 * and the entry matching the reader's position is highlighted as they scroll.
 */
const ArticleToc = ({ headings, postSlug, onNavigateSection, initialSection }) => {
  const sections = useMemo(() => buildTocTree(headings), [headings])
  const [collapsed, setCollapsed] = useState({})
  const [activeSlug, setActiveSlug] = useState(initialSection)

  const allSlugs = useMemo(
    () => sections.flatMap((section) => [section.slug, ...section.children.map((child) => child.slug)]),
    [sections],
  )

  useEffect(() => {
    if (!allSlugs.length) return

    let frameId = null

    const updateActive = () => {
      frameId = null
      const elements = allSlugs.map((slug) => document.getElementById(slug)).filter(Boolean)
      if (!elements.length) return

      const limit = activationLine()
      const current = elements.filter((el) => el.getBoundingClientRect().top <= limit).at(-1)
      setActiveSlug(current?.id ?? elements[0].id)
    }

    const onScroll = () => {
      if (frameId === null) frameId = requestAnimationFrame(updateActive)
    }

    updateActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [allSlugs])

  const selectSection = (slug) => {
    setActiveSlug(slug)
    onNavigateSection?.(slug)
  }

  const toggleAll = () => {
    const anyExpanded = sections.some((section) => !collapsed[section.slug])
    setCollapsed(Object.fromEntries(sections.map((section) => [section.slug, anyExpanded])))
  }

  if (!sections.length) return null

  return (
    <aside className="no-print hidden lg:block lg:sticky lg:top-24 lg:self-start">
      <div className="article-toc p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">On this page</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Contents</h2>
          </div>
          <button type="button" onClick={toggleAll} className="text-xs text-white/60 hover:text-white">
            Toggle
          </button>
        </div>

        <nav className="space-y-3 text-sm text-white/75">
          {sections.map((section) => {
            const isExpanded = !collapsed[section.slug]

            return (
              <div key={section.slug}>
                <div className="flex w-full items-center justify-between gap-3">
                  <TocLink
                    heading={section}
                    postSlug={postSlug}
                    isActive={activeSlug === section.slug}
                    onSelect={selectSection}
                    className="block text-left"
                  />
                  {section.children.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setCollapsed((state) => ({ ...state, [section.slug]: isExpanded }))}
                      className="text-white/60 hover:text-white"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.text}`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : null}
                </div>

                {section.children.length > 0 && isExpanded && (
                  <ul className="mt-2 space-y-2 pl-4 text-white/70">
                    {section.children.map((child) => (
                      <li key={child.slug}>
                        <TocLink
                          heading={child}
                          postSlug={postSlug}
                          isActive={activeSlug === child.slug}
                          onSelect={selectSection}
                          className="block"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default ArticleToc
