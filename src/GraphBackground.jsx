import { useEffect, useRef } from 'react'

// One node per this many square pixels, give or take the jitter below.
const AREA_PER_NODE = 3000
const NODE_COUNT_JITTER = 20
const MIN_NODE_SPACING = 30
const MAX_PLACEMENT_ATTEMPTS = 50

const MAX_LINK_DISTANCE = 80
const MAX_LINKS_PER_NODE = 6

const MOUSE_INFLUENCE_RADIUS = 120
const MOUSE_PULL = 0.2
const RETURN_FORCE = 0.05
const IDLE_JITTER = 0.02
const DAMPING = 0.95
const EDGE_BOUNCE = -0.8
const PULSE_SPEED = 0.02
const PULSE_AMPLITUDE = 0.5
const RADIUS_EASING = 0.1

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
    let mouse = { ...OFFSCREEN_MOUSE }
    let hoveredNode = null
    let frameId = null
    let resizeTimer = null

    let width = 0
    let height = 0
    let pixelRatio = 0
    let gradients = null

    // Reallocating the backing store clears the canvas and is not cheap, so it
    // only happens when the measured size or pixel density actually changes.
    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
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
          node.vx += toOriginX * RETURN_FORCE + (Math.random() - 0.5) * IDLE_JITTER
          node.vy += toOriginY * RETURN_FORCE + (Math.random() - 0.5) * IDLE_JITTER
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
        const targetRadius = node.baseRadius + Math.sin(node.pulsePhase) * PULSE_AMPLITUDE
        node.radius += (targetRadius - node.radius) * RADIUS_EASING

        // Scaling the transform puts the shared unit gradient exactly where a
        // per-node gradient would have been.
        const scale = pixelRatio * node.radius
        ctx.setTransform(scale, 0, 0, scale, pixelRatio * node.x, pixelRatio * node.y)
        ctx.fillStyle = hoveredNode === node ? gradients.hovered : gradients.idle
        ctx.beginPath()
        ctx.arc(0, 0, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawLinks = () => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.lineWidth = 0.8

      for (const node of nodes) {
        for (const other of node.links) {
          const gap = distanceSquared(node.x, node.y, other.x, other.y)
          if (gap >= MAX_LINK_DISTANCE ** 2) continue

          const distance = Math.sqrt(gap)
          ctx.strokeStyle = gradients.link((1 - distance / MAX_LINK_DISTANCE) * 0.4)
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(other.x, other.y)
          ctx.stroke()
        }
      }
    }

    const step = () => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.clearRect(0, 0, width, height)
      drawNodes()
      drawLinks()
      frameId = requestAnimationFrame(step)
    }

    const start = () => {
      if (frameId === null) frameId = requestAnimationFrame(step)
    }

    const stop = () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      frameId = null
    }

    const rebuildNodes = () => {
      nodes = generateNodes(width, height)
      linkNodes(nodes)
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
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    visibility.observe(canvas)

    const resizeObserver = new ResizeObserver(onViewportChange)
    resizeObserver.observe(canvas)

    container?.addEventListener('mousemove', onMouseMove)
    container?.addEventListener('mouseenter', trackMouse)
    container?.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', onViewportChange)

    return () => {
      stop()
      clearTimeout(resizeTimer)
      visibility.disconnect()
      resizeObserver.disconnect()
      container?.removeEventListener('mousemove', onMouseMove)
      container?.removeEventListener('mouseenter', trackMouse)
      container?.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onViewportChange)
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
