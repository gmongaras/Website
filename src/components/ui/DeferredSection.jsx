import { useEffect, useRef, useState } from 'react'

/**
 * Delays mounting expensive below-the-fold sections until the visitor is close.
 * Once mounted, a section stays mounted so scrolling back does not recreate it.
 */
const DeferredSection = ({ id, minHeight = 640, children }) => {
  const placeholderRef = useRef(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (isMounted) return

    if (!('IntersectionObserver' in window)) {
      setIsMounted(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsMounted(true)
      },
      { rootMargin: '800px 0px' },
    )

    if (placeholderRef.current) observer.observe(placeholderRef.current)
    return () => observer.disconnect()
  }, [isMounted])

  return (
    <div
      ref={placeholderRef}
      id={id}
      className="scroll-mt-20"
      style={isMounted ? undefined : { minHeight }}
    >
      {isMounted ? children : null}
    </div>
  )
}

export default DeferredSection
