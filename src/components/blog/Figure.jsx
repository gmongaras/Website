import { blogImageDimensions } from '../../blogImageDimensions'
import { renderCaptionHtml } from '../../lib/markdown'
import LazyImage from '../ui/LazyImage'

/**
 * An article image with its optional caption. Intrinsic dimensions come from
 * the generated manifest so the space is reserved before the file arrives.
 */
const Figure = ({ alt, src, caption }) => {
  const dimensions = blogImageDimensions[src]

  return (
    <div className="pdf-figure mb-4 my-4 text-center">
      <div className="group relative block w-full overflow-visible rounded-lg p-2">
        <LazyImage
          src={src}
          alt={alt}
          width={dimensions?.width}
          height={dimensions?.height}
          className="max-w-full h-auto rounded-lg mx-auto shadow-lg transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>
      {caption ? (
        <p
          className="text-sm text-white/60 text-center mt-2 italic"
          dangerouslySetInnerHTML={{ __html: renderCaptionHtml(caption) }}
        />
      ) : null}
    </div>
  )
}

export default Figure
