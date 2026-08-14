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

// Colores por estado del tratamiento. Son los mismos que usan los puntos de la
// línea de tiempo en TratamientosClient (emerald / sky / amber), para que el
// diagrama y la lista se lean igual.
export const COLORES_ESTADO_TRATAMIENTO = {
  Terminado: { fill: '#059669', stroke: '#047857', label: 'Terminado' },
  'En proceso': { fill: '#0284c7', stroke: '#0369a1', label: 'En proceso' },
  'Por Iniciar': { fill: '#f59e0b', stroke: '#d97706', label: 'Por iniciar' },
}

const ESTADO_POR_DEFECTO = 'Por Iniciar'

const normalizeStatus = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase()
  if (v === 'terminado') return 'Terminado'
  if (v === 'en proceso') return 'En proceso'
  return ESTADO_POR_DEFECTO
}

// Cuando un diente aparece en varios tratamientos, se muestra el estado que más
// atención pide: algo en proceso pesa más que algo ya terminado.
const PRIORIDAD_ESTADO = { 'En proceso': 3, 'Por Iniciar': 2, Terminado: 1 }

/**
 * Convierte la respuesta de tratamientos en la lista que espera `treatmentTeeth`.
 * Acepta las dos formas que circulan en la app: la cruda del API (`teeth_ids`,
 * `service_name`) y la mapeada por usePatientTreatments (`teethIds`).
 *
 * Se usa `teeth_ids` y no `group_teeth_ids`: el estado pertenece al tratamiento
 * concreto, no a todo el paquete.
 *
 * @returns {Array<{id:number, status:string, label:string}>}
 */
export function derivarTeethDeTratamientos(treatments = []) {
  const porDiente = new Map()

  for (const t of Array.isArray(treatments) ? treatments : []) {
    const estado = normalizeStatus(t?.status)
    const nombre = t?.service_name || t?.group_title || 'Tratamiento'
    const dientes = t?.teethIds ?? t?.teeth_ids ?? []

    for (const raw of Array.isArray(dientes) ? dientes : []) {
      // Number(null) es 0 y Number('') también: hay que exigir entero positivo
      // o se cuela una "pieza 0" que no existe en el diagrama pero sí suma en
      // el conteo de la leyenda.
      const id = Number(raw)
      if (!Number.isInteger(id) || id <= 0) continue

      const entrada = porDiente.get(id) || { id, status: estado, tratamientos: [] }
      if ((PRIORIDAD_ESTADO[estado] || 0) > (PRIORIDAD_ESTADO[entrada.status] || 0)) {
        entrada.status = estado
      }
      entrada.tratamientos.push(`${nombre} (${estado})`)
      porDiente.set(id, entrada)
    }
  }

  return Array.from(porDiente.values()).map((e) => ({
    id: e.id,
    status: e.status,
    label: `Pieza ${e.id} — ${e.tratamientos.join(' · ')}`,
  }))
}

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

  // Dientes que aparecen en los tratamientos del paciente. Se pintan por
  // estado y quedan por DEBAJO de la selección del usuario, para que al hacer
  // clic siga viéndose qué eligió. Formato: [{ id, status, label }].
  treatmentTeeth = [],
  showLegend = false,

  // Con esto, solo las piezas que aparecen en `treatmentTeeth` responden al
  // clic (y son las únicas con cursor/hover). Evita abrir un modal vacío en
  // los 52 dientes que no tienen nada asociado.
  soloClickConTratamiento = false,

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

  // Map(_28 -> { status, label }). Se normaliza aquí para que quien lo use
  // pueda mandar números (28), strings ('28') o ids del SVG ('_28').
  const treatmentMap = useMemo(() => {
    const map = new Map()
    for (const item of Array.isArray(treatmentTeeth) ? treatmentTeeth : []) {
      const tid = extractToothId(item?.id ?? item)
      if (!tid) continue
      map.set(tid, {
        status: normalizeStatus(item?.status),
        label: item?.label || '',
      })
    }
    return map
  }, [treatmentTeeth])

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

    let fill
    let stroke

    if (mode === 'current') {
      fill = currentFill
      stroke = currentStroke
    } else if (typeof mode === 'object' && mode?.fill) {
      // capa de tratamientos: el color viene del estado
      fill = mode.fill
      stroke = mode.stroke
    } else {
      fill = selectedFill
      stroke = selectedStroke
    }

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

    // Orden de prioridad (lo último pintado gana): tratamientos < selección
    // del usuario < "current". Así, al hacer clic sobre un diente tratado se
    // ve la selección y no el color de estado.
    for (const [tid, info] of treatmentMap.entries()) {
      const root = getRootByToothId(svg, tid)
      if (!root) continue
      const color = COLORES_ESTADO_TRATAMIENTO[info.status] || COLORES_ESTADO_TRATAMIENTO[ESTADO_POR_DEFECTO]
      paintTooth(root, { fill: color.fill, stroke: color.stroke })
    }

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
    treatmentMap,
    selectedFill,
    selectedStroke,
    currentFill,
    currentStroke,
  ])

  // Tooltip nativo del SVG + marca de "tiene tratamiento". Va aparte del
  // repintado porque no dependen de la selección: <title> se queda puesto y la
  // marca es la que decide el cursor/hover en CSS.
  useLayoutEffect(() => {
    if (!svgText) return
    const svg = getSvg()
    if (!svg) return

    nodeMapRef.current.forEach((root, tid) => {
      const previo = root.querySelector(':scope > title')
      if (previo) previo.remove()

      const info = treatmentMap.get(tid)

      // La marca va también en los hijos: el cursor lo decide el elemento que
      // está debajo del puntero, que casi siempre es un <path>, no el grupo.
      const marcar = (el) => {
        if (info) el.setAttribute('data-con-tratamiento', '1')
        else el.removeAttribute('data-con-tratamiento')
      }
      marcar(root)
      root.querySelectorAll('*').forEach(marcar)

      if (!info?.label) return

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      title.textContent = info.label
      root.insertBefore(title, root.firstChild)
    })
  }, [svgText, treatmentMap])

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

    if (soloClickConTratamiento && !treatmentMap.has(id)) return

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
        data-solo-tratados={soloClickConTratamiento ? '1' : undefined}
        onClick={onClick}
        onKeyDown={onKeyDown}
      />
    )
  }

  // Solo se listan los estados presentes: una leyenda con colores que no están
  // en el diagrama confunde más de lo que ayuda.
  const estadosPresentes = useMemo(() => {
    const vistos = new Set()
    treatmentMap.forEach((info) => vistos.add(info.status))
    return Object.keys(COLORES_ESTADO_TRATAMIENTO).filter((estado) => vistos.has(estado))
  }, [treatmentMap])

  return (
    <div className="mx-auto w-[400px]">
      <div className="h-[500px] bg-indigo-50 rounded-2xl p-4">{content}</div>

      {showLegend && estadosPresentes.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
          {estadosPresentes.map((estado) => {
            const color = COLORES_ESTADO_TRATAMIENTO[estado]
            return (
              <span key={estado} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-sm border"
                  style={{ backgroundColor: color.fill, borderColor: color.stroke }}
                />
                {color.label}
              </span>
            )
          })}
          <span className="text-xs text-muted-foreground">· {treatmentMap.size} pieza{treatmentMap.size === 1 ? '' : 's'} con tratamiento</span>
        </div>
      ) : null}

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
          cursor: pointer;
        }

        /* Modo "solo piezas con tratamiento": el resto queda inerte. Las reglas
           van después para ganar por orden, ya que empatan en especificidad. */
        .diagram-wrap[data-solo-tratados='1'] [data-tooth-id],
        .diagram-wrap[data-solo-tratados='1'] [data-tooth-id]:hover {
          cursor: default;
          opacity: 1;
          filter: none;
        }

        .diagram-wrap[data-solo-tratados='1'] [data-con-tratamiento='1'] {
          cursor: pointer;
        }

        .diagram-wrap[data-solo-tratados='1'] [data-con-tratamiento='1']:hover {
          opacity: 0.96;
          filter: drop-shadow(0 2px 6px rgba(73, 27, 154, 0.25));
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
