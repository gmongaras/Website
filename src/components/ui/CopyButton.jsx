import { useEffect, useRef, useState } from 'react'

const CopyButton = ({
  text,
  children = 'Copy',
  reserve = 'Copied!', // widest label, so the button never changes width
  className = '',
}) => {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef(null)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }

    setCopied(true)
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button className={`btn relative ${className}`} onClick={copy} aria-live="polite">
      <span className="invisible select-none">{reserve}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        {copied ? reserve : children}
      </span>
    </button>
  )
}

export default CopyButton
