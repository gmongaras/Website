import { useState } from 'react'
import { Play } from 'lucide-react'

const YouTubeEmbed = ({ videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`

  return (
    <div className="pdf-block my-6 min-w-0 max-w-full">
      <div className="no-print relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black">
        {isPlaying ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label="Play YouTube video"
          >
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-80 transition duration-200 group-hover:scale-[1.02] group-hover:opacity-100"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-transform duration-200 group-hover:scale-110">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </span>
            </span>
          </button>
        )}
      </div>
      {/* Iframes are hidden on paper, so the link stands in for the player. */}
      <p className="print-only text-sm">
        Video: <a href={watchUrl}>{watchUrl}</a>
      </p>
    </div>
  )
}

export default YouTubeEmbed
