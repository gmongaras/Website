import { useEffect, useRef, useState } from 'react'

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const ClipboardIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const CodeBlock = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef(null)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      return
    }

    setCopied(true)
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  // Legacy {{code}} blocks stored backslashes doubled up, so they are collapsed
  // again for display.
  const displayCode = code.replace(/\\\\/g, '\\')

  return (
    <div className="pdf-block my-6">
      <div className="pdf-block-surface bg-gray-900 rounded-lg overflow-hidden border border-gray-700 relative group">
        <div className="pdf-block-header flex items-center justify-between bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
          <span className="font-mono">{language}</span>
          <button
            onClick={copy}
            className="no-print opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
            title="Copy code"
          >
            {copied ? <><CheckIcon /> Copied!</> : <><ClipboardIcon /> Copy</>}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className={`language-${language} text-sm text-gray-100 whitespace-pre`}>
            {displayCode}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock
