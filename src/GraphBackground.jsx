import { useEffect, useRef } from 'react'

// Density is capped because the hero now fills the viewport. The old hero was
// only as tall as its content, so the same pixels-per-node budget now means
// several times as many nodes, and a phone cannot draw that at 60fps.
const FINE_AREA_PER_NODE = 5500
const COARSE_AREA_PER_NODE = 4500
const FINE_MAX_NODES = 280
const COARSE_MAX_NODES = 100
const NODE_COUNT_JITTER = 12
const MIN_NODE_SPACING = 30
const MAX_PLACEMENT_ATTEMPTS = 40

const MAX_LINK_DISTANCE = 80
const MAX_LINKS_PER_NODE = 6
const FINE_MAX_PIXEL_RATIO = 1.25
const COARSE_MAX_PIXEL_RATIO = 1
const FINE_MAX_BACKING_PIXELS = 2_000_000
const COARSE_MAX_BACKING_PIXELS = 700_000
const FINE_FRAME_INTERVAL_MS = 1000 / 60
const COARSE_FRAME_INTERVAL_MS = 1000 / 30

const MOUSE_INFLUENCE_RADIUS = 120
const MOUSE_PULL = 0.2
const RETURN_FORCE = 0.05
const IDLE_JITTER = 0.02
const DAMPING = 0.95
const EDGE_BOUNCE = -0.8
const PULSE_SPEED = 0.02
const PULSE_AMPLITUDE = 0.5
const RADIUS_EASING = 0.1
const MIN_SIGNAL_COUNT = 4
const MAX_SIGNAL_COUNT = 8
const SIGNAL_SPEED_PX_PER_SECOND = 18
const SIGNAL_SPRITE_SIZE = 22
const RIPPLE_DURATION_MS = 900
const RIPPLE_MAX_RADIUS = 110
const SCATTER_RADIUS = 190
const SCATTER_FORCE = 8

const HOVER_PADDING = 10
const OFFSCREEN_MOUSE = { x: -1e4, y: -1e4 }

const RESIZE_DEBOUNCE_MS = 150
const COARSE_HEIGHT_SLOP = 80
const DEFAULT_ACCENT_RGB = '106, 27, 154'

const distanceSquared = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2

const makeSprite = (size) => {
  const sprite = document.createElement('canvas')
  sprite.width = size
  sprite.height = size
  return { sprite, ctx: sprite.getContext('2d'), size }
}

// Painted once and scaled onto each node. A live radial gradient per node was
// most of the frame cost, and canvas shadowBlur (the old signal glow) is
// especially slow on phone GPUs.
const createNodeSprite = (accentRgb, centreAlpha, coreAlpha) => {
  const { sprite, ctx, size } = makeSprite(64)
  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, `rgba(${accentRgb}, ${centreAlpha})`)
  gradient.addColorStop(1, `rgba(${accentRgb}, ${Math.max(centreAlpha - 0.3, 0)})`)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, center, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = `rgba(255,255,255,${coreAlpha})`
  ctx.beginPath()
  ctx.arc(center, center, center * 0.28, 0, Math.PI * 2)
  ctx.fill()
  return sprite
}

const createSignalSprite = (accentRgb) => {
  const { sprite, ctx, size } = makeSprite(64)
  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(0.22, `rgba(${accentRgb}, 0.85)`)
  gradient.addColorStop(1, `rgba(${accentRgb}, 0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return sprite
}

const createHaloSprite = (accentRgb) => {
  const { sprite, ctx, size } = makeSprite(128)
  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, `rgba(${accentRgb}, 0.1)`)
  gradient.addColorStop(0.45, `rgba(${accentRgb}, 0.035)`)
  gradient.addColorStop(1, `rgba(${accentRgb}, 0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return sprite
}

// Rejection sampling for the node positions. The grid keeps each candidate from
// having to be compared against every node placed so far.
const generateNodes = (width, height, areaPerNode, maxNodes) => {
  const target = Math.max(
    12,
    Math.min(
      maxNodes,
      Math.floor((width * height) / areaPerNode)
        + Math.floor(Math.random() * NODE_COUNT_JITTER) - NODE_COUNT_JITTER / 2,
    ),
  )

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
  const spacing = MAX_LINK_DISTANCE
  let maxX = 1
  for (const node of nodes) if (node.x > maxX) maxX = node.x
  const columns = Math.floor(maxX / spacing) + 1
  const grid = new Map()

  for (const node of nodes) {
    const key = Math.floor(node.y / spacing) * columns + Math.floor(node.x / spacing)
    const cell = grid.get(key)
    if (cell) cell.push(node)
    else grid.set(key, [node])
  }

  for (const node of nodes) {
    const column = Math.floor(node.x / spacing)
    const row = Math.floor(node.y / spacing)
    const nearby = []

    for (let r = row - 1; r <= row + 1; r += 1) {
      for (let c = column - 1; c <= column + 1; c += 1) {
        const cell = grid.get(r * columns + c)
        if (!cell) continue
        for (const other of cell) {
          if (other === node) continue
          const gap = distanceSquared(node.x, node.y, other.x, other.y)
          if (gap < MAX_LINK_DISTANCE ** 2) nearby.push({ other, gap })
        }
      }
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

    const ctx = canvas.getContext('2d', { alpha: true })
    const container = containerRef?.current
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const areaPerNode = coarse ? COARSE_AREA_PER_NODE : FINE_AREA_PER_NODE
    const maxNodes = coarse ? COARSE_MAX_NODES : FINE_MAX_NODES
    const frameInterval = coarse ? COARSE_FRAME_INTERVAL_MS : FINE_FRAME_INTERVAL_MS
    const maxPixelRatio = coarse ? COARSE_MAX_PIXEL_RATIO : FINE_MAX_PIXEL_RATIO
    const maxBackingPixels = coarse ? COARSE_MAX_BACKING_PIXELS : FINE_MAX_BACKING_PIXELS
    const heightSlop = coarse ? COARSE_HEIGHT_SLOP : 0.5

    let nodes = []
    let links = []
    let linkedNodes = []
    let mouse = { ...OFFSCREEN_MOUSE }
    let hoveredNode = null
    let ripples = []
    let signals = []
    let frameId = null
    let lastFrameTime = 0
    let resizeTimer = null
    let scrollTimer = null

    let width = 0
    let height = 0
    let pixelRatio = 1
    let sprites = null
    let linkColors = []
    const linkBuckets = Array.from({ length: 11 }, () => [])

    // Reallocating the backing store clears the canvas and is not cheap, so it
    // only happens when the measured size or pixel density actually changes.
    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return false

      let ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
      const area = rect.width * rect.height
      if (area * ratio * ratio > maxBackingPixels) {
        ratio = Math.sqrt(maxBackingPixels / area)
      }

      const widthChanged = Math.abs(rect.width - width) >= 1
      const heightChanged = Math.abs(rect.height - height) >= heightSlop
      if (width > 0 && !widthChanged && !heightChanged && ratio === pixelRatio) return false

      width = rect.width
      height = rect.height
      pixelRatio = ratio
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))

      const accentRgb = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-rgb')
        .trim() || DEFAULT_ACCENT_RGB

      sprites = {
        idle: createNodeSprite(accentRgb, 0.7, 0.65),
        hovered: createNodeSprite(accentRgb, 0.9, 0.95),
        signal: createSignalSprite(accentRgb),
        halo: createHaloSprite(accentRgb),
      }
      linkColors = Array.from({ length: 11 }, (_, step) => `rgba(${accentRgb}, ${(step / 10).toFixed(2)})`)
      return true
    }

    const drawNodes = () => {
      const influenceSquared = MOUSE_INFLUENCE_RADIUS ** 2
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      // Drawing may be 30fps on a phone. Step the motion twice so it still
      // matches the old 60fps pace, without drawing the extra step.
      const physicsSteps = coarse ? 2 : 1

      for (const node of nodes) {
        for (let physicsStep = 0; physicsStep < physicsSteps; physicsStep += 1) {
          const toMouseX = mouse.x - node.x
          const toMouseY = mouse.y - node.y
          const toOriginX = node.originalX - node.x
          const toOriginY = node.originalY - node.y

          const mouseGap = toMouseX * toMouseX + toMouseY * toMouseY
          const originGap = toOriginX * toOriginX + toOriginY * toOriginY

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
        }

        const diameter = node.radius * 2
        ctx.drawImage(
          hoveredNode === node ? sprites.hovered : sprites.idle,
          node.x - node.radius,
          node.y - node.radius,
          diameter,
          diameter,
        )
      }
    }

    const createSignal = (time, startPartway = false, fromNode = null, previousNode = null) => {
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
      linkedNodes = nodes.filter((node) => node.links.length > 0)
      const count = Math.min(
        MAX_SIGNAL_COUNT,
        Math.max(MIN_SIGNAL_COUNT, Math.round(nodes.length / 24)),
      )
      const time = performance.now()
      signals = []
      for (let i = 0; i < count; i += 1) {
        const signal = createSignal(time, true)
        if (signal) signals.push(signal)
      }
    }

    const drawLinks = () => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.lineWidth = 0.8

      for (const bucket of linkBuckets) bucket.length = 0

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
        linkBuckets[Math.min(10, Math.max(0, Math.round(opacity * 10)))].push(link)
      }

      for (let bucket = 1; bucket < linkBuckets.length; bucket += 1) {
        const group = linkBuckets[bucket]
        if (!group.length) continue
        ctx.strokeStyle = linkColors[bucket]
        ctx.beginPath()
        for (const link of group) {
          ctx.moveTo(link.from.x, link.from.y)
          ctx.lineTo(link.to.x, link.to.y)
        }
        ctx.stroke()
      }
    }

    const drawSignals = (time) => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const half = SIGNAL_SPRITE_SIZE / 2

      for (let i = 0; i < signals.length; i += 1) {
        let signal = signals[i]
        let progress = signal.duration > 0 ? (time - signal.startedAt) / signal.duration : 1
        if (progress >= 1) {
          const next = createSignal(time, false, signal.to, signal.from)
          if (!next) {
            signals.splice(i, 1)
            i -= 1
            continue
          }
          signal = next
          signals[i] = next
          // The old progress belongs to the finished hop. Reusing it draws the
          // new hop at its end for one frame, then back at the start.
          progress = signal.duration > 0 ? (time - signal.startedAt) / signal.duration : 0
        }

        progress = Math.min(Math.max(progress, 0), 1)
        const signalX = signal.from.x + (signal.to.x - signal.from.x) * progress
        const signalY = signal.from.y + (signal.to.y - signal.from.y) * progress
        ctx.drawImage(sprites.signal, signalX - half, signalY - half, SIGNAL_SPRITE_SIZE, SIGNAL_SPRITE_SIZE)
      }
    }

    const drawPointerEffects = (time) => {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      if (mouse.x > -1000) {
        const diameter = MOUSE_INFLUENCE_RADIUS * 2
        ctx.drawImage(
          sprites.halo,
          mouse.x - MOUSE_INFLUENCE_RADIUS,
          mouse.y - MOUSE_INFLUENCE_RADIUS,
          diameter,
          diameter,
        )
      }

      ripples = ripples.filter((ripple) => {
        const age = time - ripple.startedAt
        if (age >= RIPPLE_DURATION_MS) return false

        const progress = age / RIPPLE_DURATION_MS
        ctx.strokeStyle = linkColors[Math.max(1, Math.round((1 - progress) * 4.5))]
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
      if (!sprites) return
      drawPointerEffects(time)
      drawLinks()
      drawSignals(time)
      drawNodes()
    }

    const step = (time) => {
      frameId = requestAnimationFrame(step)
      if (time - lastFrameTime < frameInterval) return
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
        if (isIntersecting && sprites) renderFrame(performance.now())
      }
    }

    const rebuildNodes = () => {
      if (width < 1 || height < 1) return
      nodes = generateNodes(width, height, areaPerNode, maxNodes)
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
      hoveredNode = null
      const reach = HOVER_PADDING + 4
      for (const node of nodes) {
        if (distanceSquared(mouse.x, mouse.y, node.x, node.y) < (node.radius + reach) ** 2) {
          hoveredNode = node
          break
        }
      }
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
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
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
      resizeTimer = setTimeout(() => {
        rebuildNodes()
        if (frameId === null) renderFrame(performance.now())
      }, RESIZE_DEBOUNCE_MS)
    }

    // Drawing the graph while the page is scrolling is what makes a phone hitch.
    const onScroll = () => {
      if (!coarse) return
      stop()
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(updatePlayback, 150)
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
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', updatePlayback)
    reducedMotion.addEventListener('change', updatePlayback)

    return () => {
      stop()
      clearTimeout(resizeTimer)
      clearTimeout(scrollTimer)
      visibility.disconnect()
      resizeObserver.disconnect()
      container?.removeEventListener('mousemove', onMouseMove)
      container?.removeEventListener('mouseenter', trackMouse)
      container?.removeEventListener('mouseleave', onMouseLeave)
      container?.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', updatePlayback)
      reducedMotion.removeEventListener('change', updatePlayback)
    }
  }, [containerRef])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full transform-gpu"
      style={{ zIndex: 1, contain: 'layout paint' }}
    />
  )
}

export default GraphBackground
