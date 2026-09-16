import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// One card (w-80) plus the flex gap, which is how far the arrows step.
const CARD_STEP_PX = 340

const ARROW_BUTTON_BASE = 'group flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200'
const ARROW_BUTTON_ENABLED = 'text-white/55 hover:bg-white/[0.06] hover:text-white active:scale-90'
const ARROW_BUTTON_DISABLED = 'cursor-not-allowed text-white/20'

const ArrowButton = ({ direction, enabled, onClick }) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight

  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      className={`${ARROW_BUTTON_BASE} ${enabled ? ARROW_BUTTON_ENABLED : ARROW_BUTTON_DISABLED}`}
    >
      <Icon
        className={`h-5 w-5 transition-transform duration-200 ${
          enabled ? 'group-hover:scale-110' : ''
        }`}
      />
    </button>
  )
}

/**
 * A horizontally scrolling row with edge fades and a custom scrollbar.
 * The native scrollbar is hidden, while touch and trackpad scrolling remain.
 */
const HorizontalScrollContainer = forwardRef(({ children, className = '' }, ref) => {
  const scrollRef = useRef(null)
  const scrollBarRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [thumbRatio, setThumbRatio] = useState(0.25)
  const [isDragging, setIsDragging] = useState(false)

  useImperativeHandle(ref, () => ({
    scrollTo: (options) => scrollRef.current?.scrollTo(options),
  }))

  const updateScrollState = useCallback(() => {
    const scroller = scrollRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    const progress = maxScrollLeft > 0 ? scroller.scrollLeft / maxScrollLeft : 0

    setCanScrollLeft(scroller.scrollLeft > 0)
    setCanScrollRight(scroller.scrollLeft < maxScrollLeft - 1)
    setHasOverflow(maxScrollLeft > 0)
    setScrollProgress(progress)
    setThumbRatio(Math.min(1, Math.max(0.12, scroller.clientWidth / scroller.scrollWidth)))
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

  const scrollToFraction = (fraction, behavior = 'auto') => {
    const scroller = scrollRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    scroller.scrollTo({
      left: Math.min(1, Math.max(0, fraction)) * maxScrollLeft,
      behavior,
    })
  }

  const handleTrackClick = (event) => {
    if (event.target !== event.currentTarget) return

    const rect = scrollBarRef.current?.getBoundingClientRect()
    if (rect) scrollToFraction((event.clientX - rect.left) / rect.width, 'smooth')
  }

  const handleThumbPointerDown = (event) => {
    const track = scrollBarRef.current
    if (!track) return

    const thumb = event.currentTarget
    event.preventDefault()
    event.stopPropagation()
    thumb.setPointerCapture(event.pointerId)

    const trackRect = track.getBoundingClientRect()
    const thumbRect = thumb.getBoundingClientRect()
    const grabOffset = event.clientX - thumbRect.left

    setIsDragging(true)

    const handlePointerMove = (moveEvent) => {
      const travel = trackRect.width - thumbRect.width
      if (travel <= 0) return
      scrollToFraction((moveEvent.clientX - trackRect.left - grabOffset) / travel)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      thumb.removeEventListener('pointermove', handlePointerMove)
      thumb.removeEventListener('pointerup', handlePointerUp)
      thumb.removeEventListener('pointercancel', handlePointerUp)
    }

    thumb.addEventListener('pointermove', handlePointerMove)
    thumb.addEventListener('pointerup', handlePointerUp)
    thumb.addEventListener('pointercancel', handlePointerUp)
  }

  const handleScrollBarKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollByCard(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollByCard(1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      scrollToFraction(0, 'smooth')
    } else if (event.key === 'End') {
      event.preventDefault()
      scrollToFraction(1, 'smooth')
    }
  }

  const thumbStyle = {
    left: `${scrollProgress * (1 - thumbRatio) * 100}%`,
    width: `${thumbRatio * 100}%`,
  }

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
        className="flex gap-5 overflow-x-auto scrollbar-hide items-stretch"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          scrollSnapType: 'x proximity',
          touchAction: 'pan-x pan-y',
        }}
      >
        {children}
      </div>

      {hasOverflow && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <ArrowButton direction="left" enabled={canScrollLeft} onClick={() => scrollByCard(-1)} />

          <div className="group flex h-10 w-48 sm:w-64 items-center">
            <div
              ref={scrollBarRef}
              role="scrollbar"
              tabIndex={0}
              aria-label="Horizontal content position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(scrollProgress * 100)}
              aria-orientation="horizontal"
              onClick={handleTrackClick}
              onKeyDown={handleScrollBarKeyDown}
              className={`relative h-1.5 w-full cursor-pointer rounded-full bg-white/10 outline-none transition-all duration-200 group-hover:h-2 focus-visible:h-2 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black ${
                isDragging ? 'h-2 bg-white/15' : ''
              }`}
            >
              <div
                onPointerDown={handleThumbPointerDown}
                className={`absolute inset-y-0 touch-none cursor-grab rounded-full bg-gradient-to-r from-accent to-purple-400 shadow-[0_0_10px_rgba(var(--accent-rgb),0.35)] transition-[height,box-shadow,filter] duration-200 hover:brightness-125 ${
                  isDragging
                    ? 'cursor-grabbing brightness-125 shadow-[0_0_16px_rgba(var(--accent-rgb),0.6)]'
                    : ''
                }`}
                style={thumbStyle}
              />
            </div>
          </div>

          <ArrowButton direction="right" enabled={canScrollRight} onClick={() => scrollByCard(1)} />
        </div>
      )}
    </div>
  )
})

HorizontalScrollContainer.displayName = 'HorizontalScrollContainer'

export default HorizontalScrollContainer
