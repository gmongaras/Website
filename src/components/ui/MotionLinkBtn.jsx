import { motion } from 'framer-motion'

const GLOW_BG = {
  white: 'radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0.10) 45%, transparent 70%)',
  accent: 'radial-gradient(120% 140% at 50% 0%, rgba(59,0,102,0.22), rgba(59,0,102,0.12) 45%, transparent 70%)',
}

const GLOW_SHADOW = {
  white: '0 0 0 1px rgba(255,255,255,0.16), 0 8px 32px rgba(255,255,255,0.28)',
  accent: '0 0 0 1px rgba(255,255,255,0.12), 0 8px 32px rgba(59,0,102,0.35)',
}

const LABEL_HOVER_COLOR = { white: '#fff', accent: 'var(--accent)' }

const ICON_VARIANTS = { rest: { x: 0, rotate: 0 }, hover: { x: 2, rotate: 3 }, tap: { scale: 0.96 } }

/**
 * The call-to-action button used in the hero and header. `highlight` picks
 * between the white and accent glow; `newTab` overrides the default, which is
 * to open everything except in-page anchors in a new tab.
 */
const MotionLinkBtn = ({ href, label, Icon, primary = false, highlight = 'accent', newTab }) => {
  const isAnchor = typeof href === 'string' && href.startsWith('#')
  const target = (newTab ?? !isAnchor) ? '_blank' : undefined

  return (
    <motion.a
      href={href}
      target={target}
      rel={target ? 'noreferrer' : undefined}
      className={`${primary ? 'btn btn-primary' : 'btn'}
                  relative overflow-hidden group min-h-[44px]
                  text-[15px] sm:text-sm whitespace-nowrap`}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap="tap"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-xl"
        style={{ background: GLOW_BG[highlight] }}
        variants={{
          rest: { opacity: 0, scale: 0.98 },
          hover: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
        }}
      />

      <span className="relative z-10 flex items-center gap-2">
        <motion.span
          className="shrink-0"
          variants={ICON_VARIANTS}
          transition={{ type: 'spring', stiffness: 450, damping: 24 }}
        >
          <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
        </motion.span>
        <motion.span
          className="leading-none"
          variants={{
            rest: { y: 0, color: 'var(--text, #fff)' },
            hover: { y: -1, color: LABEL_HOVER_COLOR[highlight] },
          }}
          transition={{ type: 'tween', duration: 0.18 }}
        >
          {label}
        </motion.span>
      </span>

      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        variants={{
          rest: { boxShadow: '0 0 0 rgba(0,0,0,0)' },
          hover: { boxShadow: GLOW_SHADOW[highlight] },
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.a>
  )
}

export default MotionLinkBtn
