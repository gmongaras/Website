const GLOW_BG = {
  white: 'radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0.10) 45%, transparent 70%)',
  accent: 'radial-gradient(120% 140% at 50% 0%, rgba(59,0,102,0.22), rgba(59,0,102,0.12) 45%, transparent 70%)',
}

const GLOW_SHADOW = {
  white: '0 0 0 1px rgba(255,255,255,0.16), 0 8px 32px rgba(255,255,255,0.28)',
  accent: '0 0 0 1px rgba(255,255,255,0.12), 0 8px 32px rgba(59,0,102,0.35)',
}

/**
 * The call-to-action button used in the hero and header. `highlight` picks
 * between the white and accent glow; `newTab` overrides the default, which is
 * to open everything except in-page anchors in a new tab.
 */
const MotionLinkBtn = ({ href, label, Icon, primary = false, highlight = 'accent', newTab }) => {
  const isAnchor = typeof href === 'string' && href.startsWith('#')
  const target = (newTab ?? !isAnchor) ? '_blank' : undefined

  return (
    <a
      href={href}
      target={target}
      rel={target ? 'noreferrer' : undefined}
      className={`${primary ? 'btn btn-primary' : 'btn'}
                  relative overflow-hidden group min-h-[44px]
                  text-[15px] sm:text-sm whitespace-nowrap active:scale-[0.98]`}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-xl opacity-0 scale-[0.98] transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100"
        style={{ background: GLOW_BG[highlight] }}
      />

      <span className="relative z-10 flex items-center gap-2">
        <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:rotate-3">
          <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
        </span>
        <span className="leading-none transition-transform duration-200 group-hover:-translate-y-px">
          {label}
        </span>
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ boxShadow: GLOW_SHADOW[highlight] }}
      />
    </a>
  )
}

export default MotionLinkBtn
