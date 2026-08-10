import { useState, useRef, useEffect } from "react"
import type { ReactNode, MouseEvent as ReactMouseEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"

// ---------- Neural network canvas background ----------
export const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let width = 0, height = 0
    let nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = []
    let frame: number

    const resize = () => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
      const count = Math.min(60, Math.floor((width * height) / 26000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.5,
      }))
    }

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const mouse = mouseRef.current

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1

        const dx = n.x - mouse.x
        const dy = n.y - mouse.y
        const distToMouse = Math.sqrt(dx * dx + dy * dy)
        if (distToMouse < 120) {
          const force = (120 - distToMouse) / 120
          n.x += (dx / distToMouse) * force * 0.6
          n.y += (dy / distToMouse) * force * 0.6
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.strokeStyle = `rgba(99, 82, 246, ${0.18 * (1 - dist / 130)})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(165, 180, 252, 0.65)"
        ctx.fill()
      }

      if (!prefersReduced) frame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", onMouseMove)
    draw()
    if (prefersReduced) ctx.clearRect(0, 0, width, height)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full opacity-80" />
}

// ---------- single ambient corner glow ----------
export const AmbientGlow = () => {
  const reduceMotion = useReducedMotion()
  return (
    <div className="pointer-events-none fixed inset-0 -z-20">
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full bg-[#4f39f6]/10 blur-[170px]"
        style={{ top: "-8%", left: "-12%" }}
        animate={reduceMotion ? {} : { x: [0, 25, 0], y: [0, 15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

// ---------- studio kicker (the small "AI compositing studio" eyebrow) ----------
export const StudioKicker = ({ label }: { label: string }) => {
  const reduceMotion = useReducedMotion()
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="relative flex size-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full bg-[#4f39f6] ${reduceMotion ? '' : 'animate-ping'} opacity-60`} />
        <span className="relative inline-flex rounded-full size-1.5 bg-[#a5b4fc]" />
      </span>
      <span className="text-[11px] uppercase tracking-[0.2em] text-[#a5b4fc]/80">{label}</span>
    </div>
  )
}

// ---------- 3D tilt wrapper for panels ----------
export const TiltPanel = ({ children, className = "", disabled = false }: { children: ReactNode; className?: string; disabled?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -2.5, y: px * 3 })
  }

  const onLeave = () => setTilt({ x: 0, y: 0 })

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: disabled ? undefined : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.2s ease-out",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  )
}

// ---------- glowing gradient-border field wrapper ----------
export const GlowField = ({ children, focused }: { children: ReactNode; focused: boolean }) => (
  <div className="relative rounded-xl">
    <div
      className="absolute -inset-[1.5px] rounded-xl overflow-hidden pointer-events-none transition-opacity duration-300"
      style={{ opacity: focused ? 1 : 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: "conic-gradient(from 0deg, #4f39f6, #22d3ee, transparent, #4f39f6)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <div
      className="absolute -inset-[1.5px] rounded-xl border pointer-events-none transition-colors duration-300"
      style={{ borderColor: focused ? "transparent" : "rgba(255,255,255,0.1)" }}
    />
    <div className="relative m-[1.5px] rounded-[10px] bg-[#0d0d12]">{children}</div>
  </div>
)