import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// One card (w-80) plus the flex gap, which is how far the arrows step.
const CARD_STEP_PX = 340

const ARROW_BUTTON_BASE = 'group relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 overflow-hidden'
const ARROW_BUTTON_ENABLED = 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/25 hover:scale-105 active:scale-95'
const ARROW_BUTTON_DISABLED = 'border-white/5 bg-white/2 cursor-not-allowed opacity-30'

const ARROW_GLOW = 'radial-gradient(120% 140% at 50% 0%, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05) 45%, transparent 70%)'

const ArrowButton = ({ direction, enabled, onClick }) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight

  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      className={`${ARROW_BUTTON_BASE} ${enabled ? ARROW_BUTTON_ENABLED : ARROW_BUTTON_DISABLED}`}
    >
      <div
        className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 ${enabled ? 'group-hover:opacity-100' : ''}`}
        style={{ background: ARROW_GLOW }}
      />
      <Icon
        className={`relative z-10 w-6 h-6 transition-all duration-300 ${
          enabled ? 'text-white/80 group-hover:text-accent group-hover:scale-110' : 'text-white/40'
        }`}
      />
      <div
        className={`absolute inset-0 rounded-2xl transition-all duration-300 opacity-0 ${enabled ? 'group-hover:opacity-100' : ''}`}
        style={{ boxShadow: '0 0 0 1px rgba(var(--accent-rgb), 0.3)', filter: 'blur(1px)' }}
      />
    </button>
  )
}

/**
 * A horizontally scrolling row with edge fades, arrow buttons and a custom
 * scrollbar that can be clicked or dragged. The native scrollbar is hidden so
 * the row looks the same on every platform.
 */
const HorizontalScrollContainer = forwardRef(({ children, className = '' }, ref) => {
  const scrollRef = useRef(null)
  const scrollBarRef = useRef(null)
  const didDragRef = useRef(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)

  useImperativeHandle(ref, () => ({
    scrollTo: (options) => scrollRef.current?.scrollTo(options),
  }))

  const updateScrollState = useCallback(() => {
    const scroller = scrollRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    setCanScrollLeft(scroller.scrollLeft > 0)
    setCanScrollRight(scroller.scrollLeft < maxScrollLeft)
    setScrollProgress(maxScrollLeft > 0 ? scroller.scrollLeft / maxScrollLeft : 0)
    setHasOverflow(maxScrollLeft > 0)
  }, [])

  useEffect(() => {
    updateScrollState()

    const observer = new ResizeObserver(updateScrollState)
    if (scrollRef.current) observer.observe(scrollRef.current)
    window.addEventListener('resize', updateScrollState)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  // Steps one card at a time, but snaps to the very end when the remaining
  // distance is less than a full step so the last card is never half-hidden.
  const scrollByCard = (direction) => {
    const scroller = scrollRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth

    if (direction < 0 && scroller.scrollLeft <= CARD_STEP_PX) {
      scroller.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction > 0 && scroller.scrollLeft >= maxScrollLeft - CARD_STEP_PX) {
      scroller.scrollTo({ left: maxScrollLeft, behavior: 'smooth' })
    } else {
      scroller.scrollBy({ left: direction * CARD_STEP_PX, behavior: 'smooth' })
    }
  }

  const scrollToBarFraction = (fraction, behavior) => {
    const scroller = scrollRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    scroller.scrollTo({ left: Math.min(Math.max(fraction, 0), 1) * maxScrollLeft, behavior })
  }

  const handleScrollBarClick = (event) => {
    // A click always follows a drag; the drag has already moved the row.
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }

    const rect = scrollBarRef.current?.getBoundingClientRect()
    if (rect) scrollToBarFraction((event.clientX - rect.left) / rect.width, 'smooth')
  }

  const handleMouseDown = (event) => {
    const rect = scrollBarRef.current?.getBoundingClientRect()
    if (!rect) return

    event.preventDefault()
    setIsDragging(true)
    didDragRef.current = false

    const onMouseMove = (moveEvent) => {
      didDragRef.current = true
      scrollToBarFraction((moveEvent.clientX - rect.left) / rect.width, 'auto')
    }

    const onMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // The thumb is a fixed quarter of the track, so it travels the other 75%.
  const thumbStyle = { width: '25%', left: `${scrollProgress * 75}%` }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-5 overflow-x-hidden scrollbar-hide items-stretch"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {hasOverflow && (
        <>
          <div className="mt-6 flex justify-center">
            <div
              ref={scrollBarRef}
              onClick={handleScrollBarClick}
              onMouseDown={handleMouseDown}
              className={`relative w-40 h-2 bg-white/5 rounded-full overflow-hidden cursor-pointer border transition-all duration-200 group select-none ${
                isDragging ? 'border-accent/60 bg-white/10 scale-105' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full" />

              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                  isDragging ? 'scale-y-125' : 'group-hover:scale-y-110'
                }`}
                style={{
                  ...thumbStyle,
                  background: 'linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.8))',
                  boxShadow: isDragging
                    ? '0 0 12px rgba(var(--accent-rgb), 0.5)'
                    : '0 0 8px rgba(var(--accent-rgb), 0.3)',
                }}
              />

              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-opacity duration-200 ${
                  isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{
                  ...thumbStyle,
                  background: 'radial-gradient(ellipse at center, rgba(var(--accent-rgb), 0.4), transparent)',
                  filter: 'blur(4px)',
                }}
              />
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <ArrowButton direction="left" enabled={canScrollLeft} onClick={() => scrollByCard(-1)} />
            <ArrowButton direction="right" enabled={canScrollRight} onClick={() => scrollByCard(1)} />
          </div>
        </>
      )}
    </div>
  )
})

HorizontalScrollContainer.displayName = 'HorizontalScrollContainer'

export default HorizontalScrollContainer
