// components/tratamientos/DiagramaTratamientos.jsx
'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_SVG_PATH = '/tratamientos/diagrama.svg'

// --- FDI: permanentes 11–48 (1..8) y temporales 51–85 (1..5)
const isFDITooth = (n) => {
  const q = Math.floor(n / 10)
  const p = n % 10
  if (q >= 1 && q <= 4) return p >= 1 && p <= 8
  if (q >= 5 && q <= 8) return p >= 1 && p <= 5
  return false
}

const extractToothId = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return null

  // "_28" o "28" o "_51"
  const direct = s.match(/^_?(\d{1,2})$/)
  if (direct) {
    const n = Number(direct[1])
    if (!Number.isFinite(n)) return null
    if (isFDITooth(n)) return `_${n}`
    if (n >= 1 && n <= 32) return `_${n}`
    return null
  }

  // último par de dígitos (ej: tooth_51_label -> 51)
  const all2 = s.match(/\d{2}/g)
  if (all2?.length) {
    const n = Number(all2[all2.length - 1])
    if (Number.isFinite(n) && isFDITooth(n)) return `_${n}`
  }

  // último número 1–2 dígitos
  const all = s.match(/\d{1,2}/g)
  if (all?.length) {
    const n = Number(all[all.length - 1])
    if (!Number.isFinite(n)) return null
    if (isFDITooth(n)) return `_${n}`
    if (n >= 1 && n <= 32) return `_${n}`
  }

  return null
}

const defaultIsInteractiveId = (id) => Boolean(extractToothId(id))

// En tu SVG los dientes son <path class="cls-2"> (relleno blanco)
const FILL_TARGET_SEL = '.cls-2'

function rememberOriginal(el) {
  if (el.getAttribute('data-orig-saved') === '1') return
  el.setAttribute('data-orig-saved', '1')

  // ✅ aquí estaba tu typo: era fill, no stroke
  el.setAttribute('data-orig-style-fill', el.style.getPropertyValue('fill') || '')
  el.setAttribute('data-orig-style-stroke', el.style.getPropertyValue('stroke') || '')
  el.setAttribute('data-orig-style-color', el.style.getPropertyValue('color') || '')

  el.setAttribute('data-orig-attr-fill', el.getAttribute('fill') || '')
  el.setAttribute('data-orig-attr-stroke', el.getAttribute('stroke') || '')
}

function paintShape(el, fill, stroke) {
  if (!el) return
  rememberOriginal(el)

  // ✅ aplica inline con !important
  el.style.setProperty('fill', fill, 'important')

  // stroke es opcional (pero si lo mandas, se verá un borde)
  if (stroke) el.style.setProperty('stroke', stroke, 'important')

  // fallback por atributo (algunos SVGs traen estilos agresivos)
  el.setAttribute('fill', fill)
  if (stroke) el.setAttribute('stroke', stroke)
  else el.removeAttribute('stroke')

  el.setAttribute('data-painted', '1')
}

function restorePaint(el) {
  const origStyleFill = el.getAttribute('data-orig-style-fill') ?? ''
  const origStyleStroke = el.getAttribute('data-orig-style-stroke') ?? ''
  const origStyleColor = el.getAttribute('data-orig-style-color') ?? ''

  const origAttrFill = el.getAttribute('data-orig-attr-fill') ?? ''
  const origAttrStroke = el.getAttribute('data-orig-attr-stroke') ?? ''

  if (origStyleFill) el.style.setProperty('fill', origStyleFill)
  else el.style.removeProperty('fill')

  if (origStyleStroke) el.style.setProperty('stroke', origStyleStroke)
  else el.style.removeProperty('stroke')

  if (origStyleColor) el.style.setProperty('color', origStyleColor)
  else el.style.removeProperty('color')

  if (origAttrFill) el.setAttribute('fill', origAttrFill)
  else el.removeAttribute('fill')

  if (origAttrStroke) el.setAttribute('stroke', origAttrStroke)
  else el.removeAttribute('stroke')

  el.removeAttribute('data-painted')
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
  selectedStroke = '#cbc1f8',
  currentFill = '#9E89FF',
  currentStroke = '#9E89FF',

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

  // OJO: internalActiveIds se queda [] si tú pasas activeIds desde el parent (modo controlado)
  const resolvedActiveIds = useMemo(() => {
    const ids = activeIds ?? internalActiveIds
    return Array.isArray(ids) ? ids : []
  }, [activeIds, internalActiveIds])

  const resolvedCurrentIds = useMemo(() => {
    return Array.isArray(currentIds) ? currentIds : []
  }, [currentIds])

  const getSvg = () => wrapRef.current?.querySelector('svg') || null

  const getRootByToothId = (svg, toothId) => {
    if (!svg || !toothId) return null
    const id = extractToothId(toothId)
    if (!id) return null

    const fromMap = nodeMapRef.current.get(id)
    if (fromMap) return fromMap

    // fallback
    const safe = String(id).replace(/"/g, '\\"')
    return svg.querySelector(`[data-tooth-id="${safe}"]`) || null
  }

  const clearAllPaint = (svg) => {
    if (!svg) return
    svg.querySelectorAll('[data-painted="1"]').forEach((el) => restorePaint(el))
  }

  // ✅ pinta SOLO .cls-2 dentro del grupo del diente
  const paintTooth = (root, mode) => {
    if (!root) return
    const isCurrent = mode === 'current'
    const fill = isCurrent ? currentFill : selectedFill
    const stroke = isCurrent ? currentStroke : selectedStroke

    const targets = []

    // si el root mismo es cls-2
    if (root.matches?.(FILL_TARGET_SEL)) targets.push(root)

    // hijos cls-2
    root.querySelectorAll?.(FILL_TARGET_SEL)?.forEach((n) => targets.push(n))

    // fallback: si por alguna razón no hay cls-2, pinta el root completo
    if (targets.length === 0) targets.push(root)
    targets.forEach((el) => paintShape(el, fill, stroke))
  }

  const repaint = (activeList, currentList) => {
    const svg = getSvg()
    if (!svg) return

    clearAllPaint(svg)

    for (const id0 of activeList || []) {
      const tid = extractToothId(id0)
      if (!tid) continue
      const root = getRootByToothId(svg, tid)
      if (!root) continue
      paintTooth(root, 'active')
    }

    for (const id0 of currentList || []) {
      const tid = extractToothId(id0)
      if (!tid) continue
      const root = getRootByToothId(svg, tid)
      if (!root) continue
      paintTooth(root, 'current')
    }
  }

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
        if (!txt.includes('<svg')) throw new Error('La respuesta no es un SVG')
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

  // 2) inyectar SVG + hotspots (layout)
  useLayoutEffect(() => {
    if (!svgText) return
    const wrap = wrapRef.current
    if (!wrap) return

    wrap.innerHTML = svgText
    const svg = getSvg()
    if (!svg) return

    svg.style.width = '100%'
    svg.style.height = 'auto'

    nodeMapRef.current = new Map()

    const nodes = Array.from(svg.querySelectorAll('[id]'))
    for (const node of nodes) {
      const rawId = node.getAttribute('id')
      if (!rawId) continue
      if (!isInteractiveId?.(rawId)) continue

      const toothId = extractToothId(rawId)
      if (!toothId) continue

      nodeMapRef.current.set(toothId, node)

      // marca TODO el grupo como clickable
      node.setAttribute('data-tooth-id', toothId)
      node.querySelectorAll('*').forEach((child) => {
        child.setAttribute('data-tooth-id', toothId)
      })
    }
  }, [svgText, isInteractiveId])

  // 3) repintar siempre que cambien ids o colores
  useLayoutEffect(() => {
    if (!svgText) return
    repaint(resolvedActiveIds, resolvedCurrentIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    svgText,
    resolvedActiveIds,
    resolvedCurrentIds,
    selectedFill,
    selectedStroke,
    currentFill,
    currentStroke,
  ])

  const emitIds = (nextIds) => {
    onActiveIdsChange?.(nextIds)
    if (activeIds == null) setInternalActiveIds(nextIds)
    onChange?.(nextIds)
  }

  const toggleIdInternal = (toothId) => {
    const id = extractToothId(toothId)
    if (!id) return

    const current = Array.isArray(resolvedActiveIds) ? resolvedActiveIds : []
    const normalized = current.map(extractToothId).filter(Boolean)

    const next = new Set(normalized)
    const wasSelected = next.has(id)

    if (wasSelected) next.delete(id)
    else next.add(id)

    const nextIds = Array.from(next)

    // ✅ repaint “optimista” inmediato (evita sensación de lag en modo controlado)
    repaint(nextIds, resolvedCurrentIds)

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
  else {
    content = (
      <div
        ref={wrapRef}
        className={`diagram-wrap ${className}`}
        onClick={onClick}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <div className="w-[400px] h-[500px] mx-auto bg-indigo-50 rounded-2xl p-4">
      {content}

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

        .diagram-wrap [data-tooth-id] {
          cursor: pointer;
        }

        .diagram-wrap [data-tooth-id]:hover {
          opacity: 0.96;
          filter: drop-shadow(0 2px 6px rgba(73, 27, 154, 0.25));
        }
      `}</style>
    </div>
  )
}
