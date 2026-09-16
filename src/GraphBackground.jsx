import { useEffect, useRef } from 'react'

// One node per this many square pixels, give or take the jitter below.
const AREA_PER_NODE = 3000
const NODE_COUNT_JITTER = 20
const MIN_NODE_SPACING = 30
const MAX_PLACEMENT_ATTEMPTS = 50

const MAX_LINK_DISTANCE = 80
const MAX_LINKS_PER_NODE = 6
const MAX_PIXEL_RATIO = 1.5
const FRAME_INTERVAL_MS = 1000 / 30

const MOUSE_INFLUENCE_RADIUS = 120
const MOUSE_PULL = 0.2
const RETURN_FORCE = 0.05
const IDLE_JITTER = 0.02
const DAMPING = 0.95
const EDGE_BOUNCE = -0.8
const PULSE_SPEED = 0.02
const PULSE_AMPLITUDE = 0.5
const RADIUS_EASING = 0.1
const MIN_SIGNAL_COUNT = 6
const MAX_SIGNAL_COUNT = 12
const SIGNAL_SPEED_PX_PER_SECOND = 18
const RIPPLE_DURATION_MS = 900
const RIPPLE_MAX_RADIUS = 110
const SCATTER_RADIUS = 190
const SCATTER_FORCE = 8

const HOVER_PADDING = 10
const OFFSCREEN_MOUSE = { x: -1e4, y: -1e4 }

const RESIZE_DEBOUNCE_MS = 150
const DEFAULT_ACCENT_RGB = '106, 27, 154'

const distanceSquared = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2

// The node glow is a radial gradient running from the centre out to twice the
// node's radius, of which only the inner half is ever painted. The whole shape
// scales with the radius, so a single gradient defined in unit space can be
// reused for every node by scaling the canvas transform, instead of allocating
// a fresh gradient per node per frame.
const createNodeGradient = (ctx, accentRgb, centreAlpha) => {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 2)
  gradient.addColorStop(0, `rgba(${accentRgb}, ${centreAlpha})`)
  gradient.addColorStop(0.5, `rgba(${accentRgb}, ${centreAlpha - 0.3})`)
  gradient.addColorStop(1, `rgba(${accentRgb}, 0.1)`)
  return gradient
}

// Rejection sampling for the node positions. The grid keeps each candidate from
// having to be compared against every node placed so far.
const generateNodes = (width, height) => {
  const target = Math.floor((width * height) / AREA_PER_NODE)
    + Math.floor(Math.random() * NODE_COUNT_JITTER) - NODE_COUNT_JITTER / 2

  const columns = Math.max(1, Math.ceil(width / MIN_NODE_SPACING))
  const rows = Math.max(1, Math.ceil(height / MIN_NODE_SPACING))
  const grid = new Map()

  const isTooClose = (x, y) => {
    const column = Math.floor(x / MIN_NODE_SPACING)
    const row = Math.floor(y / MIN_NODE_SPACING)

    // Anything within the minimum spacing has to be in one of these nine cells.
    for (let r = Math.max(row - 1, 0); r <= Math.min(row + 1, rows - 1); r += 1) {
      for (let c = Math.max(column - 1, 0); c <= Math.min(column + 1, columns - 1); c += 1) {
        const cell = grid.get(r * columns + c)
        if (!cell) continue

        for (const node of cell) {
          if (distanceSquared(node.x, node.y, x, y) < MIN_NODE_SPACING ** 2) return true
        }
      }
    }

    return false
  }

  const nodes = []

  for (let i = 0; i < target; i += 1) {
    let x
    let y
    let attempts = 0

    do {
      x = Math.random() * width
      y = Math.random() * height
      attempts += 1
    } while (attempts < MAX_PLACEMENT_ATTEMPTS && isTooClose(x, y))

    const radius = Math.random() * 2 + 1.5
    const node = {
      id: i,
      x,
      y,
      originalX: x,
      originalY: y,
      // No initial velocity, so the graph looks settled on load.
      vx: 0,
      vy: 0,
      radius,
      baseRadius: radius,
      pulsePhase: Math.random() * Math.PI * 2,
      links: [],
    }

    nodes.push(node)
    const key = Math.floor(y / MIN_NODE_SPACING) * columns + Math.floor(x / MIN_NODE_SPACING)
    const cell = grid.get(key)
    if (cell) cell.push(node)
    else grid.set(key, [node])
  }

  return nodes
}

// Links every node to its closest few neighbours within range.
const linkNodes = (nodes) => {
  for (const node of nodes) {
    const nearby = []

    for (const other of nodes) {
      if (other === node) continue
      const gap = distanceSquared(node.x, node.y, other.x, other.y)
      if (gap < MAX_LINK_DISTANCE ** 2) nearby.push({ other, gap })
    }

    nearby.sort((a, b) => a.gap - b.gap)
    node.links = nearby.slice(0, MAX_LINKS_PER_NODE).map((entry) => entry.other)
  }
}

const getUniqueLinks = (nodes) => {
  const seen = new Set()
  const links = []

  for (const node of nodes) {
    for (const other of node.links) {
      const key = node.id < other.id ? `${node.id}-${other.id}` : `${other.id}-${node.id}`
      if (seen.has(key)) continue
      seen.add(key)
      links.push({ from: node, to: other })
    }
  }

  return links
}

/**
 * The animated node graph behind the hero. It is drawn on a canvas sized to the
 * element passed in as `containerRef`, which is also where pointer movement is
 * read from since the canvas itself ignores pointer events.
 */
const GraphBackground = ({ containerRef }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const container = containerRef?.current

    let nodes = []
    let links = []
    let mouse = { ...OFFSCREEN_MOUSE }
    let hoveredNode = null
    let ripples = []
    let signals = []
    let frameId = null
    let lastFrameTime = 0
    let resizeTimer = null

    let width = 0
    let height = 0
    let pixelRatio = 0
    let gradients = null

    // Reallocating the backing store clears the canvas and is not cheap, so it
    // only happens when the measured size or pixel density actually changes.
    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      if (rect.width === width && rect.height === height && ratio === pixelRatio) return false

      width = rect.width
      height = rect.height
      pixelRatio = ratio
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)

      const accentRgb = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-rgb')
        .trim() || DEFAULT_ACCENT_RGB

      gradients = {
        idle: createNodeGradient(ctx, accentRgb, 0.7),
        hovered: createNodeGradient(ctx, accentRgb, 0.9),
        link: (opacity) => `rgba(${accentRgb}, ${opacity})`,
        signal: `rgb(${accentRgb})`,
      }

      return true
    }

    const drawNodes = () => {
      const influenceSquared = MOUSE_INFLUENCE_RADIUS ** 2

      for (const node of nodes) {
        const toMouseX = mouse.x - node.x
        const toMouseY = mouse.y - node.y
        const toOriginX = node.originalX - node.x
        const toOriginY = node.originalY - node.y

        const mouseGap = toMouseX ** 2 + toMouseY ** 2
        const originGap = toOriginX ** 2 + toOriginY ** 2

        // Drift toward the pointer, but only while still near home, so the
        // graph never unravels.
        if (mouseGap < influenceSquared && originGap < influenceSquared) {
          const mouseDistance = Math.sqrt(mouseGap) || 1
          const force = (MOUSE_INFLUENCE_RADIUS - mouseDistance) / MOUSE_INFLUENCE_RADIUS
          const pull = (force * MOUSE_PULL) / mouseDistance
          node.vx += toMouseX * pull
          node.vy += toMouseY * pull
        } else {
          node.vx += toOriginX * RETURN_FORCE + Math.sin(node.pulsePhase * 0.37) * IDLE_JITTER
          node.vy += toOriginY * RETURN_FORCE + Math.cos(node.pulsePhase * 0.41) * IDLE_JITTER
        }

        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > width) node.vx *= EDGE_BOUNCE
        if (node.y < 0 || node.y > height) node.vy *= EDGE_BOUNCE

        node.x = Math.min(Math.max(node.x, 0), width)
        node.y = Math.min(Math.max(node.y, 0), height)

        node.vx *= DAMPING
        node.vy *= DAMPING

        node.pulsePhase += PULSE_SPEED
        const hoverBoost = hoveredNode === node ? 1.8 : 0
        const targetRadius = node.baseRadius + hoverBoost + Math.sin(node.pulsePhase) * PULSE_AMPLITUDE
        node.radius += (targetRadius - node.radius) * RADIUS_EASING

        // Scaling the transform puts the shared unit gradient exactly where a
        // per-node gradient would have been.
        const scale = pixelRatio * node.radius
        ctx.setTransform(scale, 0, 0, scale, pixelRatio * node.x, pixelRatio * node.y)
        ctx.fillStyle = hoveredNode === node ? gradients.hovered : gradients.idle
        ctx.beginPath()
        ctx.arc(0, 0, 1, 0, Math.PI * 2)
        ctx.fill()

        // A crisp centre gives each soft node a little depth.
        ctx.fillStyle = hoveredNode === node ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)'
        ctx.beginPath()
        ctx.arc(0, 0, 0.28, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const createSignal = (time, startPartway = false, fromNode = null, previousNode = null) => {
      const linkedNodes = nodes.filter((node) => node.links.length > 0)
      if (!linkedNodes.length) return null

      const from = fromNode?.links.length
        ? fromNode
        : linkedNodes[Math.floor(Math.random() * linkedNodes.length)]
      const forwardLinks = from.links.filter((node) => node !== previousNode)
      const choices = forwardLinks.length ? forwardLinks : from.links
      const to = choices[Math.floor(Math.random() * choices.length)]
      const distance = Math.sqrt(distanceSquared(from.x, from.y, to.x, to.y))
      const duration = (distance / SIGNAL_SPEED_PX_PER_SECOND) * 1000

      return {
        from,
        to,
        duration,
        startedAt: time - (startPartway ? Math.random() * duration : 0),
      }
    }

    const resetSignals = () => {
      const count = Math.min(
        MAX_SIGNAL_COUNT,
        Math.max(MIN_SIGNAL_COUNT, Math.round(nodes.length / 20)),
      )
      const time = performance.now()
      signals = Array.from({ length: count }, () => createSignal(time, true)).filter(Boolean)
    }

    const drawLinks = () => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.lineWidth = 0.8

      for (const link of links) {
        const { from, to } = link
        const gap = distanceSquared(from.x, from.y, to.x, to.y)
        if (gap >= MAX_LINK_DISTANCE ** 2) continue

        const distance = Math.sqrt(gap)
        const midpointX = (from.x + to.x) / 2
        const midpointY = (from.y + to.y) / 2
        const mouseProximity = Math.max(
          0,
          1 - Math.sqrt(distanceSquared(midpointX, midpointY, mouse.x, mouse.y)) / MOUSE_INFLUENCE_RADIUS,
        )
        const opacity = (1 - distance / MAX_LINK_DISTANCE) * 0.35 + mouseProximity * 0.28

        ctx.strokeStyle = gradients.link(opacity)
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      }
    }

    const drawSignals = (time) => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      signals = signals.map((signal) => {
        const progress = (time - signal.startedAt) / signal.duration
        if (progress >= 1) return createSignal(time, false, signal.to, signal.from)

        const signalX = signal.from.x + (signal.to.x - signal.from.x) * progress
        const signalY = signal.from.y + (signal.to.y - signal.from.y) * progress

        ctx.save()
        ctx.shadowColor = gradients.signal
        ctx.shadowBlur = 10
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(signalX, signalY, 1.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        return signal
      }).filter(Boolean)
    }

    const drawPointerEffects = (time) => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      if (mouse.x > -1000) {
        const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_INFLUENCE_RADIUS)
        halo.addColorStop(0, gradients.link(0.1))
        halo.addColorStop(0.45, gradients.link(0.035))
        halo.addColorStop(1, gradients.link(0))
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, MOUSE_INFLUENCE_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      ripples = ripples.filter((ripple) => {
        const age = time - ripple.startedAt
        if (age >= RIPPLE_DURATION_MS) return false

        const progress = age / RIPPLE_DURATION_MS
        ctx.strokeStyle = gradients.link((1 - progress) * 0.45)
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, 8 + progress * RIPPLE_MAX_RADIUS, 0, Math.PI * 2)
        ctx.stroke()
        return true
      })
    }

    const renderFrame = (time) => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.clearRect(0, 0, width, height)
      drawPointerEffects(time)
      drawLinks()
      drawSignals(time)
      drawNodes()
    }

    const step = (time) => {
      frameId = requestAnimationFrame(step)
      if (time - lastFrameTime < FRAME_INTERVAL_MS) return
      lastFrameTime = time
      renderFrame(time)
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let isIntersecting = true

    const start = () => {
      if (document.hidden || !isIntersecting || reducedMotion.matches) return
      if (frameId === null) {
        lastFrameTime = 0
        frameId = requestAnimationFrame(step)
      }
    }

    const stop = () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      frameId = null
    }

    const updatePlayback = () => {
      if (!document.hidden && isIntersecting && !reducedMotion.matches) {
        start()
      } else {
        stop()
        if (isIntersecting) renderFrame(performance.now())
      }
    }

    const rebuildNodes = () => {
      nodes = generateNodes(width, height)
      linkNodes(nodes)
      links = getUniqueLinks(nodes)
      resetSignals()
    }

    const trackMouse = (event) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const onMouseMove = (event) => {
      trackMouse(event)
      hoveredNode = nodes.find((node) => (
        distanceSquared(mouse.x, mouse.y, node.x, node.y) < (node.radius + HOVER_PADDING) ** 2
      )) ?? null
    }

    const onMouseLeave = () => {
      hoveredNode = null
      mouse = { ...OFFSCREEN_MOUSE }
    }

    const onPointerDown = (event) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      ripples.push({
        x,
        y,
        startedAt: performance.now(),
      })

      for (const node of nodes) {
        const offsetX = node.x - x
        const offsetY = node.y - y
        const distance = Math.sqrt(offsetX ** 2 + offsetY ** 2)
        if (distance >= SCATTER_RADIUS) continue

        const angle = distance > 0 ? Math.atan2(offsetY, offsetX) : Math.random() * Math.PI * 2
        const strength = (1 - distance / SCATTER_RADIUS) * SCATTER_FORCE
        node.vx += Math.cos(angle) * strength
        node.vy += Math.sin(angle) * strength
      }
    }

    // The canvas is resized straight away so the next frame is not stretched,
    // while the more expensive node layout is left until the resize settles.
    const onViewportChange = () => {
      if (!syncCanvasSize()) return
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(rebuildNodes, RESIZE_DEBOUNCE_MS)
    }

    syncCanvasSize()
    rebuildNodes()
    start()

    // Nothing off screen needs animating, which keeps the loop off the CPU
    // while the visitor reads the rest of the page.
    const visibility = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting
      updatePlayback()
    })
    visibility.observe(canvas)

    const resizeObserver = new ResizeObserver(onViewportChange)
    resizeObserver.observe(canvas)

    container?.addEventListener('mousemove', onMouseMove)
    container?.addEventListener('mouseenter', trackMouse)
    container?.addEventListener('mouseleave', onMouseLeave)
    container?.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', onViewportChange)
    document.addEventListener('visibilitychange', updatePlayback)
    reducedMotion.addEventListener('change', updatePlayback)

    return () => {
      stop()
      clearTimeout(resizeTimer)
      visibility.disconnect()
      resizeObserver.disconnect()
      container?.removeEventListener('mousemove', onMouseMove)
      container?.removeEventListener('mouseenter', trackMouse)
      container?.removeEventListener('mouseleave', onMouseLeave)
      container?.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onViewportChange)
      document.removeEventListener('visibilitychange', updatePlayback)
      reducedMotion.removeEventListener('change', updatePlayback)
    }
  }, [containerRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}

export default GraphBackground
