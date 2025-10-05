import { useEffect, useRef, useCallback } from 'react'

const GraphBackground = ({ containerRef }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const nodesRef = useRef([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const hoveredNodeRef = useRef(null)

  // Generate random nodes
  const generateNodes = useCallback((width, height) => {
    const nodes = []
    // Add some randomness to node count for variety
    const baseNodeCount = Math.floor((width * height) / 3000)
    const nodeCount = baseNodeCount + Math.floor(Math.random() * 20) - 10 // ±10 nodes variation
    const minDistance = 30 // Smaller minimum distance for denser packing

    for (let i = 0; i < nodeCount; i++) {
      let attempts = 0
      let x, y
      
      do {
        x = Math.random() * width
        y = Math.random() * height
        attempts++
      } while (
        attempts < 50 && 
        nodes.some(node => 
          Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2) < minDistance
        )
      )

      nodes.push({
        x,
        y,
        originalX: x, // Store original position
        originalY: y,
        vx: 0, // No initial velocity - keep static on reload
        vy: 0,
        radius: Math.random() * 2 + 1.5, // Slightly smaller nodes for density
        originalRadius: Math.random() * 2 + 1.5,
        targetRadius: Math.random() * 2 + 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: []
      })
    }

    return nodes
  }, [])

  // Generate connections between nearby nodes
  const generateConnections = useCallback((nodes) => {
    const maxDistance = 80 // Reduced for denser connections
    const maxConnections = 6 // More connections for denser graph

    nodes.forEach(node => {
      node.connections = []
      const nearbyNodes = nodes.filter(other => 
        other !== node && 
        Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2) < maxDistance
      )
      
      // Sort by distance and take the closest ones
      nearbyNodes
        .sort((a, b) => 
          Math.sqrt((node.x - a.x) ** 2 + (node.y - a.y) ** 2) - 
          Math.sqrt((node.x - b.x) ** 2 + (node.y - b.y) ** 2)
        )
        .slice(0, Math.min(maxConnections, nearbyNodes.length))
        .forEach(other => {
          if (!node.connections.includes(other)) {
            node.connections.push(other)
          }
        })
    })
  }, [])

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Set canvas size
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    const nodes = nodesRef.current
    const mouse = mouseRef.current

    // Update and draw nodes
    nodes.forEach((node, index) => {
      // Mouse interaction
      const dx = mouse.x - node.x
      const dy = mouse.y - node.y
      const dxToOriginal = node.originalX - node.x
      const dyToOriginal = node.originalY - node.y
      const distanceToMouse = Math.sqrt(dx * dx + dy * dy)
      const distanceToOriginal = Math.sqrt(dxToOriginal * dxToOriginal + dyToOriginal * dyToOriginal)
      const maxInfluence = 120

      // Move nodes closer to the mouse if the mouse is
      // close to the node and if the node is not too far from
      // its starting location
      if (distanceToMouse < maxInfluence && distanceToOriginal < maxInfluence) {
        // Push closer to mouse
        const force = (maxInfluence - distanceToMouse) / maxInfluence
        const angle = Math.atan2(dy, dx)
        node.vx += Math.cos(angle) * force * 0.2
        node.vy += Math.sin(angle) * force * 0.2
      } else {
        // Return to original position when mouse is far
        const returnForce = 0.05
        node.vx += dxToOriginal * returnForce
        node.vy += dyToOriginal * returnForce
        
        // Add gentle random movement when idle
        node.vx += (Math.random() - 0.5) * 0.02
        node.vy += (Math.random() - 0.5) * 0.02
      }

      // Update position
      node.x += node.vx
      node.y += node.vy

      // Bounce off edges
      if (node.x < 0 || node.x > width) node.vx *= -0.8
      if (node.y < 0 || node.y > height) node.vy *= -0.8

      // Keep within bounds
      node.x = Math.max(0, Math.min(width, node.x))
      node.y = Math.max(0, Math.min(height, node.y))

      // Damping
      node.vx *= 0.95
      node.vy *= 0.95

      // Pulse animation
      node.pulsePhase += 0.02
      node.targetRadius = node.originalRadius + Math.sin(node.pulsePhase) * 0.5
      node.radius += (node.targetRadius - node.radius) * 0.1

      // Draw node
      const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, node.radius * 2
      )
      
      if (hoveredNodeRef.current === node) {
        gradient.addColorStop(0, 'rgba(106, 27, 154, 0.9)')
        gradient.addColorStop(0.5, 'rgba(106, 27, 154, 0.6)')
        gradient.addColorStop(1, 'rgba(106, 27, 154, 0.1)')
      } else {
        gradient.addColorStop(0, 'rgba(106, 27, 154, 0.7)')
        gradient.addColorStop(0.5, 'rgba(106, 27, 154, 0.4)')
        gradient.addColorStop(1, 'rgba(106, 27, 154, 0.1)')
      }

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw connections
    nodes.forEach(node => {
      node.connections.forEach(connectedNode => {
        const dx = connectedNode.x - node.x
        const dy = connectedNode.y - node.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 80) {
          const opacity = Math.max(0, 1 - distance / 80) * 0.4
          ctx.strokeStyle = `rgba(106, 27, 154, ${opacity})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(connectedNode.x, connectedNode.y)
          ctx.stroke()
        }
      })
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    const container = containerRef?.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    // Check for hovered nodes
    const nodes = nodesRef.current
    hoveredNodeRef.current = null
    
    for (const node of nodes) {
      const dx = mouseRef.current.x - node.x
      const dy = mouseRef.current.y - node.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < node.radius + 10) {
        hoveredNodeRef.current = node
        break
      }
    }
  }, [containerRef])

  // Handle mouse enter
  const handleMouseEnter = useCallback((e) => {
    const container = containerRef?.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [containerRef])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    hoveredNodeRef.current = null
    // Reset mouse position to a far away point when mouse leaves
    mouseRef.current = { x: -1000, y: -1000 }
  }, [])

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Generate initial nodes
    nodesRef.current = generateNodes(width, height)
    generateConnections(nodesRef.current)

    // Start animation
    animate()

    // Add event listeners to container instead of canvas
    const container = containerRef?.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseenter', handleMouseEnter)
      container.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseenter', handleMouseEnter)
        container.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [generateNodes, generateConnections, animate, handleMouseMove, handleMouseEnter, handleMouseLeave])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Regenerate nodes for new size
      nodesRef.current = generateNodes(width, height)
      generateConnections(nodesRef.current)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [generateNodes, generateConnections])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}

export default GraphBackground
