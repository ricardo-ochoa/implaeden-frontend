'use client'

import * as React from 'react'
import { MessageSquareText } from 'lucide-react'
import TreatmentCommentCard from './TreatmentCommentCard'

const cx = (...c) => c.filter(Boolean).join(' ')

const defaultVariantByStatus = (status) => {
  const s = String(status ?? '').toLowerCase()
  if (s.includes('termin')) return 'gray'
  if (s.includes('proceso')) return 'blue'
  if (s.includes('iniciar')) return 'red'
  return 'blue'
}

export default function TreatmentCommentsTimeline({
  title = 'Comentarios y avances',
  items = [],                 // array de comments
  treatmentsById = {},        // { [treatment_id]: { name, status } }
  toothOptions = [],          // [{id,label}]
  getVariant,                 // (item) => 'blue'|'red'|...
  onMediaClick,               // ({item, media, index}) => void
  onCopy,
  onDelete,
  onUpdate,
  updating = false,
  avatarUrl,
  avatarInitials = 'IE',
  className,
}) {
  const list = Array.isArray(items) ? items : []

  // orden: más nuevo arriba (como tu screenshot)
  const sorted = React.useMemo(() => {
    return [...list].sort((a, b) => {
      const da = new Date(a?.created_at || 0).getTime()
      const db = new Date(b?.created_at || 0).getTime()
      return db - da
    })
  }, [list])

  return (
    <div className={cx('p-4 bg-[#F5F7FB]', className)}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareText className="h-5 w-5 text-muted-foreground" />
        <p className="text-lg font-semibold">{title}</p>
      </div>

      <div className="relative pl-7">
        {/* línea vertical */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
        {
            sorted.length != 0 ? (
        <div className="space-y-6">
          {sorted.map((it) => {
            const tid = Number(it?.treatment_id)
            const meta = treatmentsById?.[tid] || {}
            const treatmentName = meta?.name || it?.treatment_name || 'Tratamiento'
            const variant =
              getVariant?.(it) ??
              defaultVariantByStatus(meta?.status)

            const dotClass =
              variant === 'red'
                ? 'bg-red-500'
                : variant === 'gray'
                ? 'bg-muted-foreground'
                : 'bg-blue-600'

            return (
              <div key={it?.id ?? `${it?.created_at}-${tid}`} className="relative">
                {/* dot */}
                <div className={cx('absolute left-[-27px] top-7 h-3.5 w-3.5 rounded-full', dotClass)} />

                <TreatmentCommentCard
                  item={it}
                  treatmentName={treatmentName}
                  variant={variant}
                  toothOptions={toothOptions}
                  onMediaClick={onMediaClick}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                    updating={updating}
                    avatarUrl={avatarUrl}
                    avatarInitials={avatarInitials}
                />
              </div>
            )
          })}
        </div>

            ): (
                <div className='mt-10 text-sm text-center text-slate-500 font-mono'>No hay comentarios agregados</div>
            )
        }


      </div>
    </div>
  )
}
