import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { FaYoutube } from 'react-icons/fa6'
import { youtubeVideos } from '../../data'
import Card from '../ui/Card'
import HorizontalScrollContainer from '../ui/HorizontalScrollContainer'
import LazyImage from '../ui/LazyImage'
import SectionTitle from '../ui/SectionTitle'

const SORT_OPTIONS = [
  { value: 'time', label: 'Sort by Date' },
  { value: 'likes', label: 'Sort by Likes' },
  { value: 'views', label: 'Sort by Views' },
]

// How long the cross-fade between two orderings lasts.
const RESORT_MS = 600

const SUFFIX_MULTIPLIERS = { K: 1e3, M: 1e6, B: 1e9 }

// View and like counts arrive pre-formatted ("10.6K"), so they have to be
// expanded again before they can be compared.
const parseCompactNumber = (value) => {
  const match = /^([\d.]+)\s*([KMB])?$/.exec(String(value).replace(/,/g, '').trim())
  if (!match) return 0

  const amount = parseFloat(match[1])
  if (Number.isNaN(amount)) return 0
  return amount * (SUFFIX_MULTIPLIERS[match[2]] ?? 1)
}

const SORT_COMPARATORS = {
  likes: (a, b) => parseCompactNumber(b.likes) - parseCompactNumber(a.likes),
  views: (a, b) => parseCompactNumber(b.views) - parseCompactNumber(a.views),
  time: (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
}

const SubsectionHeading = ({ icon: Icon, title, children }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
        <Icon className="w-4 h-4 text-white/70" />
      </div>
      <h3 className="text-lg font-medium text-white/80">{title}</h3>
    </div>
    {children}
  </div>
)

const SortDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isOpen])

  const activeLabel = SORT_OPTIONS.find((option) => option.value === value)?.label

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer flex items-center gap-2 min-w-[140px]"
      >
        <span>{activeLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-white/10 rounded-lg shadow-xl z-50 backdrop-blur-sm" role="listbox">
          <div className="py-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                onClick={() => { onChange(option.value); setIsOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 hover:bg-accent/20 hover:text-white ${
                  value === option.value
                    ? 'bg-accent/30 text-white border-l-4 border-accent shadow-lg shadow-accent/20'
                    : 'text-white/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const EyeIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
)

const ThumbsUpIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
  </svg>
)

const VideoStat = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-1">
    <Icon />
    <span>{value}</span>
  </div>
)

const VideoCard = ({ video }) => {
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`

  return (
    <Card>
      <div className="flex-1 min-w-0">
        <div className="relative group">
          <LazyImage
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-48 object-cover rounded-lg mb-3"
            // Not every upload has a maxres thumbnail; hqdefault always exists.
            fallbackSrc={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
          />
          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Watch ${video.title} on YouTube`}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
          >
            <FaYoutube className="w-12 h-12 text-red-500" />
          </a>
        </div>
        <h3 className="font-semibold mb-2">{video.title}</h3>
        <div className="flex items-center justify-between text-xs text-white/50 mb-2">
          <p>{video.publishedAt}</p>
          <div className="flex items-center gap-3">
            <VideoStat icon={EyeIcon} value={video.views} />
            <VideoStat icon={ThumbsUpIcon} value={video.likes} />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <a href={watchUrl} target="_blank" rel="noreferrer" className="btn w-full flex items-center justify-center gap-2">
          <FaYoutube className="w-4 h-4" />
          Watch on YouTube
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </Card>
  )
}

const Media = () => {
  const [sortBy, setSortBy] = useState('time')
  const [isSorting, setIsSorting] = useState(false)
  const scrollContainerRef = useRef(null)
  const resortTimer = useRef(null)

  const sortedVideos = useMemo(
    () => [...youtubeVideos].sort(SORT_COMPARATORS[sortBy]),
    [sortBy],
  )

  useEffect(() => () => clearTimeout(resortTimer.current), [])

  const handleSortChange = (value) => {
    if (value === sortBy) return

    setIsSorting(true)
    setSortBy(value)
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })

    clearTimeout(resortTimer.current)
    resortTimer.current = setTimeout(() => setIsSorting(false), RESORT_MS)
  }

  // The row is mid-animation, so wheel scrolling over it is swallowed until the
  // new order has settled.
  useEffect(() => {
    if (!isSorting) return

    const blockWheel = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }

    document.addEventListener('wheel', blockWheel, { passive: false })
    return () => document.removeEventListener('wheel', blockWheel)
  }, [isSorting])

  return (
    <section id="media" className="section py-14 sm:py-20 scroll-mt-20">
      <SectionTitle icon={FaYoutube} title="Media" subtitle="Videos" />

      <SubsectionHeading icon={FaYoutube} title="YouTube">
        <SortDropdown value={sortBy} onChange={handleSortChange} />
      </SubsectionHeading>

      {/* The extra height and padding leave room for the cards' hover scale. */}
      <div className="relative" style={{ overflow: 'hidden', minHeight: '420px', padding: '10px 0' }}>
        <HorizontalScrollContainer ref={scrollContainerRef}>
          <motion.div
            className="flex gap-6"
            initial={false}
            animate={{ opacity: isSorting ? 0.3 : 1, scale: isSorting ? 0.95 : 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={sortBy}
                className="flex gap-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {sortedVideos.map((video, index) => (
                  <motion.div
                    key={video.videoId}
                    className="flex-shrink-0 w-80 flex min-w-0 max-w-80"
                    style={{ margin: '5px 0' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  >
                    <VideoCard video={video} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </HorizontalScrollContainer>
      </div>
    </section>
  )
}

export default Media
