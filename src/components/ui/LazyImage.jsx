import { useContext, useEffect, useRef, useState } from 'react'
import { PrintModeContext } from '../PrintModeContext'

/**
 * An image that is only mounted once it is close to the viewport, while the
 * wrapper reserves its space up front so nothing shifts as it loads.
 *
 * `fallbackSrc` is tried once if the main source fails, which covers hosts that
 * only have some of the sizes they advertise. If that fails too, nothing is
 * rendered and `onError` lets the caller show its own placeholder.
 */
const LazyImage = ({ src, alt, width, height, className, fallbackSrc, onError, ...props }) => {
  const isPrintMode = useContext(PrintModeContext)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
    setIsLoaded(false)
  }, [src])

  // Exporting or printing needs every image in the DOM, not just the visible ones.
  useEffect(() => {
    if (isPrintMode) setIsInView(true)
  }, [isPrintMode])

  useEffect(() => {
    if (isInView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true)
      },
      { rootMargin: '300px 0px', threshold: 0.01 },
    )

    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [isInView])

  const handleError = (event) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      return
    }

    setHasError(true)
    onError?.(event)
  }

  return (
    <div
      ref={wrapperRef}
      className="pdf-image-frame relative mx-auto w-full"
      style={{
        maxWidth: width ? `${width}px` : '100%',
        aspectRatio: width && height ? `${width} / ${height}` : '16 / 9',
      }}
    >
      {isInView && !hasError && (
        <>
          <img
            src={currentSrc}
            alt={alt}
            loading={isPrintMode ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            className={`w-full h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
            {...props}
          />
          {!isLoaded && (
            <div className="no-print absolute inset-0 rounded-lg bg-white/5" />
          )}
        </>
      )}
    </div>
  )
}

export default LazyImage
