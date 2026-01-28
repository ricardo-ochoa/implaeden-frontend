'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_SVG_PATH = '../../tratamientos/diagrama.svg'
const defaultIsInteractiveId = (id) => /^_\d+$/.test(String(id || ''))

export default function DiagramaTratamientos({
  src = DEFAULT_SVG_PATH,
  onChange, // (ids: string[]) => void
  onToggle, // ({ id, selected, ids }) => void
  // Controlled
  activeIds,
  onActiveIdsChange,
  // Uncontrolled
  defaultActiveIds = [],
  isInteractiveId = defaultIsInteractiveId,
  selectedFill = '#cbc1f8',
  selectedStroke = '#491b9a',
  className = '',
}) {
  const wrapRef = useRef(null)
  const [svgText, setSvgText] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  // uncontrolled
  const [internalActiveIds, setInternalActiveIds] = useState(
    Array.isArray(defaultActiveIds) ? defaultActiveIds : []
  )

  const resolvedActiveIds = useMemo(() => {
    const ids = activeIds ?? internalActiveIds
    return Array.isArray(ids) ? ids : []
  }, [activeIds, internalActiveIds])

  // ✅ ref con la selección “más reciente” (evita stale state entre clicks)
  const idsRef = useRef([])
  useEffect(() => {
    idsRef.current = resolvedActiveIds
  }, [resolvedActiveIds])
  
  // 1) cargar SVG
  // 1) cargar SVG
useEffect(() => {
  let mounted = true
  setLoading(true)
  setErr(null)

  const resolvedSrc =
    typeof window !== 'undefined' && src?.startsWith('/')
      ? new URL(src, window.location.origin).toString()
      : src

  fetch(resolvedSrc)
    .then(async (r) => {
      const txt = await r.text()
      if (!r.ok) throw new Error(`No se pudo cargar SVG (${r.status})`)
      if (!txt.includes('<svg')) throw new Error('La respuesta no es un SVG (posible 404/basePath)')
      return txt.replace(/^\s*<\?xml[^>]*\?>/i, '').trim()
    })
    .then((txt) => {
      if (!mounted) return
      setSvgText(txt)
    })
    .catch((e) => {
      if (!mounted) return
      setErr(e?.message || 'Error cargando SVG')
    })
    .finally(() => {
      if (!mounted) return
      setLoading(false)
    })

  return () => {
    mounted = false
  }
}, [src])


  // 2) preparar hotspots
  useEffect(() => {
    if (!svgText) return
    const wrap = wrapRef.current
    if (!wrap) return

    const svg = wrap.querySelector('svg')
    if (!svg) return

    svg.style.width = '100%'
    svg.style.height = 'auto'

    const groups = Array.from(svg.querySelectorAll('g[id]'))
    groups.forEach((g) => {
      const id = g.getAttribute('id')
      const interactive = isInteractiveId?.(id)

      g.classList.remove('diagram-hotspot', 'is-active')
      g.removeAttribute('tabindex')
      g.removeAttribute('role')
      g.removeAttribute('aria-label')

      if (interactive) {
        g.classList.add('diagram-hotspot')
        g.setAttribute('tabindex', '0')
        g.setAttribute('role', 'button')
        g.setAttribute('aria-label', `Diente ${String(id).replace(/^_/, '')}`)
      }
    })
  }, [svgText, isInteractiveId])

  // 3) pintar activos (multi)
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const svg = wrap.querySelector('svg')
    if (!svg) return

    svg
      .querySelectorAll('g.diagram-hotspot.is-active')
      .forEach((n) => n.classList.remove('is-active'))

    for (const id of resolvedActiveIds) {
      const node = svg.querySelector(`g[id="${CSS.escape(String(id))}"]`)
      if (node) node.classList.add('is-active')
    }
  }, [resolvedActiveIds])

  const emitIds = (nextIds) => {
    idsRef.current = nextIds
    onActiveIdsChange?.(nextIds)
    if (activeIds == null) setInternalActiveIds(nextIds)
    onChange?.(nextIds)
  }

  const toggleId = (id) => {
    if (!id) return
    if (!isInteractiveId?.(id)) return
    const current = Array.isArray(idsRef.current) ? idsRef.current : []
    const next = new Set(current)
    const wasSelected = next.has(id)
    if (wasSelected) next.delete(id)
    else next.add(id)
    const nextIds = Array.from(next)
    emitIds(nextIds)
    onToggle?.({ id, selected: !wasSelected, ids: nextIds })
  }

  // click delegado
  const onClick = (e) => {
    const g = e.target?.closest?.('g.diagram-hotspot')
    const id = g?.getAttribute?.('id')
    toggleId(id)
  }

  // teclado: Enter/Espacio
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const g = e.target?.closest?.('g.diagram-hotspot')
    const id = g?.getAttribute?.('id')
    if (!id) return
    e.preventDefault()
    toggleId(id)
  }

  const content = useMemo(() => {
    if (loading) return <div className="text-sm text-muted-foreground">Cargando diagrama…</div>
    if (err) return <div className="text-sm text-destructive">{err}</div>
    if (!svgText) return null

    return (
      <div
        ref={wrapRef}
        className={`diagram-wrap ${className}`}
        onClick={onClick}
        onKeyDown={onKeyDown}
        dangerouslySetInnerHTML={{ __html: svgText }}
      />
    )
  }, [loading, err, svgText, className])

return (
  <div className="w-[400px] h-[500px] mx-auto bg-indigo-50 rounded-2xl p-4">
    <style jsx global>{`
      .diagram-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        --tooth-fill: ${selectedStroke};
        --tooth-stroke: ${selectedFill};
      }

      .diagram-wrap svg {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
      }

      .diagram-wrap g.diagram-hotspot { cursor: pointer; transition: filter 120ms ease, opacity 120ms ease; }
      .diagram-wrap g.diagram-hotspot:hover { opacity: 0.90; filter: drop-shadow(0 2px 6px rgba(73,27,154,.35)); }

      .diagram-wrap g.is-active .cls-1 { fill: var(--tooth-fill) !important; }
      .diagram-wrap g.is-active .cls-2 { fill: var(--tooth-stroke) !important; }
      .diagram-wrap g.is-active .cls-3 { fill: var(--tooth-fill) !important; }
      .diagram-wrap g.is-active text { fill: var(--tooth-stroke) !important; }

      .diagram-wrap g.diagram-hotspot:focus {
        outline: none;
        /* filter: drop-shadow(0 1px 2px rgba(10,10,4,.45)); */
      }
    `}</style>

    {content}
  </div>
)

}
