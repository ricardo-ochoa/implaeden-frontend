// components/Odontograma.jsx
'use client'

import { useEffect, useRef, useState } from 'react'

export default function Odontograma({ value, onChange }) {
  const wrapRef = useRef(null)
  const [svgText, setSvgText] = useState('')

  // 1) Cargar el SVG como texto
  useEffect(() => {
    fetch('/diagrama.svg')
      .then((r) => r.text())
      .then(setSvgText)
      .catch(() => setSvgText(''))
  }, [])

  // 2) Activar clicks + resaltar seleccionado
  useEffect(() => {
    if (!svgText) return
    const svgEl = wrapRef.current?.querySelector('svg')
    if (!svgEl) return

    // Asegura que sea responsive
    svgEl.style.width = '100%'
    svgEl.style.height = 'auto'

    const teeth = Array.from(svgEl.querySelectorAll('g[id^="_"]')) // _11 ... _48

    const clickHandler = (e) => {
      const gid = e.currentTarget.id // "_11"
      const tooth = gid.slice(1)     // "11"
      onChange?.(tooth)
    }

    teeth.forEach((g) => {
      g.style.cursor = 'pointer'
      g.addEventListener('click', clickHandler)
    })

    return () => {
      teeth.forEach((g) => g.removeEventListener('click', clickHandler))
    }
  }, [svgText, onChange])

  // 3) Marcar el seleccionado (para CSS)
  useEffect(() => {
    const svgEl = wrapRef.current?.querySelector('svg')
    if (!svgEl) return
    const teeth = Array.from(svgEl.querySelectorAll('g[id^="_"]'))
    teeth.forEach((g) => {
      g.dataset.selected = value && g.id === `_${value}` ? 'true' : 'false'
    })
  }, [value, svgText])

  return (
    <div ref={wrapRef} className="odontograma" dangerouslySetInnerHTML={{ __html: svgText }} />
  )
}
