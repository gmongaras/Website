import { blogImageDimensions } from '../../blogImageDimensions'
import { renderCaptionHtml } from '../../lib/markdown'
import LazyImage from '../ui/LazyImage'

/**
 * An article image with its optional caption. Intrinsic dimensions come from
 * the generated manifest so the space is reserved before the file arrives.
 */
const Figure = ({ id, n, alt, src, caption }) => {
  const dimensions = blogImageDimensions[src]

  return (
    <figure id={id || undefined} className="pdf-figure mb-4 my-4 text-center min-w-0 max-w-full">
      <div className="relative overflow-visible rounded-lg">
        <LazyImage
          src={src}
          alt={alt}
          width={dimensions?.width}
          height={dimensions?.height}
          className="max-w-full h-auto rounded-lg mx-auto shadow-lg transition-transform duration-300 ease-out hover:scale-105"
        />
      </div>
      {caption || n ? (
        <figcaption className="text-sm text-white/60 text-center mt-2 italic">
          {n ? <span>Figure {n}. </span> : null}
          {caption ? <span dangerouslySetInnerHTML={{ __html: renderCaptionHtml(caption) }} /> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

export default Figure
