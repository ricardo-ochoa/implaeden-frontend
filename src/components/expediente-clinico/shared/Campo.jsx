'use client'

// components/expediente-clinico/shared/Campo.jsx
// Etiqueta + control + ayuda/error. Envuelve los inputs del expediente para
// que todas las secciones se vean igual sin repetir markup.

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function Campo({ id, label, ayuda, error, required, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}

      {children}

      {ayuda ? <p className="text-xs leading-relaxed text-muted-foreground">{ayuda}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
