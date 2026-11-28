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

const LANGUAGE_LABELS = {
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  cpp: 'C++',
  c: 'C',
  cuda: 'CUDA',
  rust: 'Rust',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  text: 'Text',
}

const normalizeLanguage = (language) => {
  const normalized = String(language || 'text').trim().toLowerCase().replace(/[^a-z0-9+#-]/g, '')
  return normalized || 'text'
}

const CodeBlock = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef(null)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const succeeded = document.execCommand('copy')
        textarea.remove()
        if (!succeeded) throw new Error('Copy failed')
      }
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
  const normalizedLanguage = normalizeLanguage(language)
  const languageLabel = LANGUAGE_LABELS[normalizedLanguage]
    || normalizedLanguage.replace(/[-+]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

  return (
    <div className="pdf-block my-6 min-w-0 max-w-full">
      <div className={`pdf-block-surface code-block code-block-${normalizedLanguage} bg-gray-900 rounded-lg overflow-hidden border border-gray-700 relative group min-w-0`}>
        <div className="pdf-block-header code-block-header flex items-center justify-between px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
          <span className="code-block-language"><span className="code-block-dot" />{languageLabel}</span>
          <button
            type="button"
            onClick={copy}
            className="no-print flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
            title="Copy code"
            aria-label={copied ? 'Code copied' : 'Copy code'}
            aria-live="polite"
          >
            {copied ? <><CheckIcon /> Copied!</> : <><ClipboardIcon /> Copy</>}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className={`language-${normalizedLanguage} text-sm text-gray-100 whitespace-pre`}>
            {displayCode}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock
