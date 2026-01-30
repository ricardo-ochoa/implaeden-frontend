// components/tratamientos/DiagramaTratamientos.jsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_SVG_PATH = '/tratamientos/diagrama.svg'

const extractToothId = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return null

  const direct = s.match(/^_?(\d{1,2})$/)
  if (direct) {
    const n = Number(direct[1])
    if (Number.isFinite(n)) {
      const q = Math.floor(n / 10)
      const p = n % 10
      const isFDI = [1, 2, 3, 4].includes(q) && p >= 1 && p <= 8
      if (isFDI) return `_${n}`
      if (n >= 1 && n <= 32) return `_${n}`
    }
  }

  const all2 = s.match(/\d{2}/g)
  if (all2?.length) {
    const n = Number(all2[all2.length - 1])
    if (Number.isFinite(n)) {
      const q = Math.floor(n / 10)
      const p = n % 10
      const isFDI = [1, 2, 3, 4].includes(q) && p >= 1 && p <= 8
      if (isFDI) return `_${n}`
    }
  }

  const all = s.match(/\d{1,2}/g)
  if (all?.length) {
    const n = Number(all[all.length - 1])
    if (Number.isFinite(n) && n >= 1 && n <= 32) return `_${n}`
  }

  return null
}

const defaultIsInteractiveId = (id) => Boolean(extractToothId(id))

const SHAPE_SEL = 'path, polygon, circle, rect, ellipse, use'
const TEXT_SEL = 'text, tspan'

function rememberOriginalInlineStyle(el) {
  if (el.getAttribute('data-orig-style-saved') === '1') return
  el.setAttribute('data-orig-style-saved', '1')
  el.setAttribute('data-orig-style-fill', el.style.getPropertyValue('fill') || '')
  el.setAttribute('data-orig-style-stroke', el.style.getPropertyValue('stroke') || '')
  el.setAttribute('data-orig-style-textfill', el.style.getPropertyValue('color') || '')
}

function paintShape(el, fill, stroke) {
  rememberOriginalInlineStyle(el)
  el.style.setProperty('fill', fill, 'important')
  el.style.setProperty('stroke', stroke, 'important')
  el.setAttribute('data-painted', '1')
}

function paintText(el, color) {
  rememberOriginalInlineStyle(el)
  // texto en SVG normalmente usa "fill"
  el.style.setProperty('fill', color, 'important')
  el.setAttribute('data-painted', '1')
}

function restorePaint(el) {
  const origFill = el.getAttribute('data-orig-style-fill') ?? ''
  const origStroke = el.getAttribute('data-orig-style-stroke') ?? ''
  const origTextFill = el.getAttribute('data-orig-style-textfill') ?? ''

  if (origFill) el.style.setProperty('fill', origFill)
  else el.style.removeProperty('fill')

  if (origStroke) el.style.setProperty('stroke', origStroke)
  else el.style.removeProperty('stroke')

  // por si alguien usó color, lo dejamos limpio
  if (origTextFill) el.style.setProperty('color', origTextFill)
  else el.style.removeProperty('color')

  el.removeAttribute('data-painted')
  // NO borramos los data-orig-* para no re-salvar cada render
}

export default function DiagramaTratamientos({
  src = DEFAULT_SVG_PATH,

  onChange,
  onToggle,

  activeIds,
  onActiveIdsChange,

  currentIds = [],

  manual = false,
  onToothClick,

  defaultActiveIds = [],
  isInteractiveId = defaultIsInteractiveId,

  selectedFill = '#cbc1f8',
  selectedStroke = '#491b9a',
  currentFill = '#7c3aed',
  currentStroke = '#1e1b4b',

  className = '',
}) {
  const wrapRef = useRef(null)
  const [svgText, setSvgText] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const [internalActiveIds, setInternalActiveIds] = useState(
    Array.isArray(defaultActiveIds) ? defaultActiveIds : []
  )

  const nodeMapRef = useRef(new Map())

  const resolvedActiveIds = useMemo(() => {
    const ids = activeIds ?? internalActiveIds
    return Array.isArray(ids) ? ids : []
  }, [activeIds, internalActiveIds])

  const resolvedCurrentIds = useMemo(() => {
    return Array.isArray(currentIds) ? currentIds : []
  }, [currentIds])

  const idsRef = useRef([])
  useEffect(() => {
    idsRef.current = resolvedActiveIds
  }, [resolvedActiveIds])

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
        if (!txt.includes('<svg'))
          throw new Error('La respuesta no es un SVG (posible 404/basePath)')
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

    nodeMapRef.current = new Map()

    svg.querySelectorAll('[data-tooth-id], .diagram-hotspot').forEach((n) => {
      n.classList.remove('diagram-hotspot', 'is-active', 'is-current')
      n.removeAttribute('tabindex')
      n.removeAttribute('role')
      n.removeAttribute('aria-label')
      n.removeAttribute('data-tooth-id')
    })

    const nodes = Array.from(svg.querySelectorAll('[id]'))
    for (const node of nodes) {
      const rawId = node.getAttribute('id')
      if (!rawId) continue
      if (!isInteractiveId?.(rawId)) continue

      const toothId = extractToothId(rawId)
      if (!toothId) continue

      let root = node
      const tag = String(node.tagName || '').toLowerCase()

      // si es texto, sube a su grupo
      if (tag === 'text' || tag === 'tspan') {
        root = node.closest('g') || node
      }

      if (!nodeMapRef.current.has(toothId)) {
        nodeMapRef.current.set(toothId, root)
      } else {
        // preferimos un <g> si aparece
        const existing = nodeMapRef.current.get(toothId)
        const existingTag = String(existing?.tagName || '').toLowerCase()
        const rootTag = String(root?.tagName || '').toLowerCase()
        if (existing && existingTag !== 'g' && rootTag === 'g') {
          nodeMapRef.current.set(toothId, root)
        }
      }
    }

    for (const [toothId, root] of nodeMapRef.current.entries()) {
      if (!root) continue
      root.classList.add('diagram-hotspot')
      root.setAttribute('data-tooth-id', toothId)
      root.setAttribute('tabindex', '0')
      root.setAttribute('role', 'button')
      root.setAttribute('aria-label', `Diente ${toothId.replace(/^_/, '')}`)

      // para que el click en hijos funcione
      root.querySelectorAll('*').forEach((child) => {
        child.setAttribute('data-tooth-id', toothId)
      })
    }
  }, [svgText, isInteractiveId])

  const getRootByToothId = (svg, toothId) => {
    if (!svg || !toothId) return null
    const id = extractToothId(toothId)
    if (!id) return null

    const fromMap = nodeMapRef.current.get(id)
    if (fromMap) return fromMap

    const safe = String(id).replace(/"/g, '\\"')
    const byHotspot = svg.querySelector(`.diagram-hotspot[data-tooth-id="${safe}"]`)
    if (byHotspot) return byHotspot

    const byData = svg.querySelector(`[data-tooth-id="${safe}"]`)
    return byData?.closest?.('.diagram-hotspot') || byData || null
  }

  // ✅ pinta por JS (important) para que SIEMPRE se vea
  const paintTooth = (root, mode) => {
    if (!root) return
    const fill = mode === 'current' ? currentFill : selectedFill
    const stroke = mode === 'current' ? currentStroke : selectedStroke

    const allShapes = []
    // si el root es figura
    if (root.matches?.(SHAPE_SEL)) allShapes.push(root)
    // figuras hijas
    root.querySelectorAll?.(SHAPE_SEL).forEach((n) => allShapes.push(n))

    const allText = []
    if (root.matches?.(TEXT_SEL)) allText.push(root)
    root.querySelectorAll?.(TEXT_SEL).forEach((n) => allText.push(n))

    allShapes.forEach((el) => paintShape(el, fill, stroke))
    allText.forEach((el) => paintText(el, stroke))
  }

  const clearAllPaint = (svg) => {
    if (!svg) return
    svg.querySelectorAll('[data-painted="1"]').forEach((el) => restorePaint(el))
  }

  // 3) clases + pintado
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const svg = wrap.querySelector('svg')
    if (!svg) return

    // limpia clases
    svg
      .querySelectorAll('.diagram-hotspot.is-active, .diagram-hotspot.is-current')
      .forEach((n) => {
        n.classList.remove('is-active')
        n.classList.remove('is-current')
      })

    // limpia pintado anterior
    clearAllPaint(svg)

    // primero activos (unión)
    for (const id0 of resolvedActiveIds) {
      const tid = extractToothId(id0)
      if (!tid) continue
      const root = getRootByToothId(svg, tid)
      if (!root) continue
      root.classList.add('is-active')
      paintTooth(root, 'active')
    }

    // luego current (prioridad)
    for (const id0 of resolvedCurrentIds) {
      const tid = extractToothId(id0)
      if (!tid) continue
      const root = getRootByToothId(svg, tid)
      if (!root) continue
      root.classList.add('is-current')
      paintTooth(root, 'current')
    }
  }, [
    resolvedActiveIds,
    resolvedCurrentIds,
    selectedFill,
    selectedStroke,
    currentFill,
    currentStroke,
  ])

  const emitIds = (nextIds) => {
    idsRef.current = nextIds
    onActiveIdsChange?.(nextIds)
    if (activeIds == null) setInternalActiveIds(nextIds)
    onChange?.(nextIds)
  }

  const toggleIdInternal = (toothId) => {
    const id = extractToothId(toothId)
    if (!id) return

    const current = Array.isArray(idsRef.current) ? idsRef.current : []
    const normalized = current.map(extractToothId).filter(Boolean)
    const next = new Set(normalized)
    const wasSelected = next.has(id)

    if (wasSelected) next.delete(id)
    else next.add(id)

    const nextIds = Array.from(next)
    emitIds(nextIds)
    onToggle?.({ id, selected: !wasSelected, ids: nextIds })
  }

  const handlePress = (toothId) => {
    const id = extractToothId(toothId)
    if (!id) return

    if (manual) {
      onToothClick?.(id)
      return
    }
    toggleIdInternal(id)
  }

  const onClick = (e) => {
    const el = e.target?.closest?.('[data-tooth-id], [id]')
    if (!el) return
    const raw = el.getAttribute('data-tooth-id') || el.getAttribute('id')
    const id = extractToothId(raw)
    if (!id) return
    handlePress(id)
  }

  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const el = e.target?.closest?.('[data-tooth-id], [id]')
    if (!el) return
    const raw = el.getAttribute('data-tooth-id') || el.getAttribute('id')
    const id = extractToothId(raw)
    if (!id) return
    e.preventDefault()
    handlePress(id)
  }

  let content = null
  if (loading) content = <div className="text-sm text-muted-foreground">Cargando diagrama…</div>
  else if (err) content = <div className="text-sm text-destructive">{err}</div>
  else if (svgText) {
    content = (
      <div
        ref={wrapRef}
        className={`diagram-wrap ${className}`}
        onClick={onClick}
        onKeyDown={onKeyDown}
        dangerouslySetInnerHTML={{ __html: svgText }}
      />
    )
  }

  return (
    <div className="w-[400px] h-[500px] mx-auto bg-indigo-50 rounded-2xl p-4">
      {content}

      {/* Nota: el style va DESPUÉS del SVG inyectado, por si el SVG trae <style> interno */}
      <style jsx global>{`
        .diagram-wrap {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .diagram-wrap svg {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }

        /* evita que el SVG “mate” eventos */
        .diagram-wrap .diagram-hotspot,
        .diagram-wrap .diagram-hotspot * {
          pointer-events: auto !important;
        }

        .diagram-wrap .diagram-hotspot {
          cursor: pointer;
          transition: filter 120ms ease, opacity 120ms ease;
        }

        .diagram-wrap .diagram-hotspot:hover {
          opacity: 0.92;
          filter: drop-shadow(0 2px 6px rgba(73, 27, 154, 0.25));
        }

        .diagram-wrap .diagram-hotspot:focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}
