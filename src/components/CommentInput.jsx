'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function CommentInput({
  value,
  onChange,
  placeholder = 'Agregar comentario',
  avatarUrl,
  initials = 'RG',
  disabled = false,
}) {
  const wrapperRef = React.useRef(null)
  const editorRef = React.useRef(null)
  const quillRef = React.useRef(null)

  // Para evitar loops cuando sincronizamos value -> editor
  const isPatchingRef = React.useRef(false)
  const lastHtmlRef = React.useRef(value ?? '')

  // 1) Inicializa Quill solo en el cliente (dynamic import)
  React.useEffect(() => {
    let alive = true

    ;(async () => {
      if (!editorRef.current || quillRef.current) return

      const Quill = (await import('quill')).default
      if (!alive) return

      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        readOnly: disabled,
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      })

      quillRef.current = quill

      // Valor inicial
      const initial = value ?? ''
      if (initial) {
        isPatchingRef.current = true
        quill.clipboard.dangerouslyPasteHTML(initial)
        isPatchingRef.current = false
      }

      // Escucha cambios -> onChange(html)
      quill.on('text-change', () => {
        if (isPatchingRef.current) return
        const html = quill.root.innerHTML
        lastHtmlRef.current = html
        onChange?.(html)
      })
    })()

    return () => {
      alive = false
    }
  }, []) // solo 1 vez

  // 2) Si cambia disabled/placeholder después, sincroniza
  React.useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    quill.enable(!disabled)
    // placeholder puede actualizarse así:
    quill.root.dataset.placeholder = placeholder

    // Oculta toolbar cuando está disabled (opcional pero se siente mejor)
    const toolbar = wrapperRef.current?.querySelector?.('.ql-toolbar')
    if (toolbar) toolbar.style.display = disabled ? 'none' : ''
  }, [disabled, placeholder])

  // 3) Si el parent cambia `value`, actualiza el editor sin loop
  React.useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const next = value ?? ''
    if (next === lastHtmlRef.current) return

    isPatchingRef.current = true

    if (!next) {
      quill.setText('') // limpia
    } else {
      quill.clipboard.dangerouslyPasteHTML(next)
    }

    lastHtmlRef.current = next
    isPatchingRef.current = false
  }, [value])

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt="Usuario" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div ref={wrapperRef} className="w-full">
        <div
          className="comment-quill rounded-md border"
          style={{ overflow: 'hidden' }}
        >
          <div ref={editorRef} />
        </div>
      </div>
    </div>
  )
}
