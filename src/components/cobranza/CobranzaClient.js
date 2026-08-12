'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { fetcher } from '../../../lib/api'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, User, Calendar } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')
const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0))
const sum = (arr, k) => arr.reduce((a, x) => a + Number(x[k] || 0), 0)

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// Presets de tiempo (filtran por fecha del tratamiento).
const PRESETS = [
  { key: 'todo', label: 'Todo' },
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
]

function rangeFor(preset) {
  if (preset === 'todo') return { from: '', to: '' }
  const today = new Date()
  const to = ymd(today)
  const days = { hoy: 0, '7d': 6, '30d': 29, '90d': 89 }[preset] ?? 0
  const f = new Date(today)
  f.setDate(f.getDate() - days)
  return { from: ymd(f), to }
}

// Definición de columnas.
const COLUMNS = [
  {
    key: 'por_cobrar',
    title: 'Por cobrar',
    hint: 'Aún no pagan nada',
    accent: 'border-t-blue-500',
    badge: 'bg-blue-100 text-blue-800',
    // total del encabezado: estimado por cobrar (costo total)
    header: (its) => [{ label: 'Estimado por cobrar', value: sum(its, 'total_cost') }],
  },
  {
    key: 'en_proceso',
    title: 'En proceso',
    hint: 'Abonado, con saldo',
    accent: 'border-t-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    header: (its) => [
      { label: 'Deben (saldo)', value: sum(its, 'saldo') },
      { label: 'Abonado', value: sum(its, 'pagado'), muted: true },
    ],
  },
  {
    key: 'cobrado',
    title: 'Cobrado / finalizado',
    hint: 'Saldo en cero',
    accent: 'border-t-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
    header: (its) => [{ label: 'Ya cobrado', value: sum(its, 'total_cost') }],
  },
]

export default function CobranzaClient() {
  const [preset, setPreset] = useState('todo')
  const { from, to } = useMemo(() => rangeFor(preset), [preset])

  const key = `/cobranza${from || to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ''}`
  const { data, error, isLoading } = useSWR(key, fetcher)
  const items = Array.isArray(data) ? data : []

  const byCol = useMemo(() => {
    const m = { por_cobrar: [], en_proceso: [], cobrado: [] }
    for (const it of items) (m[it.estado] || (m[it.estado] = [])).push(it)
    return m
  }, [items])

  // Resumen global (independiente de columnas)
  const totalPorCobrar = sum(items.filter((i) => i.estado !== 'cobrado'), 'saldo')
  const totalCobrado = sum(items, 'pagado')

  return (
    <div>
      {/* Filtros + resumen */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">Periodo:</span>
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={preset === p.key ? 'default' : 'outline'}
              onClick={() => setPreset(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Saldo total por cobrar:{' '}
            <span className="font-semibold text-foreground">{money(totalPorCobrar)}</span>
          </span>
          <span className="text-muted-foreground">
            Cobrado:{' '}
            <span className="font-semibold text-emerald-700">{money(totalCobrado)}</span>
          </span>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>No se pudo cargar la cobranza</AlertTitle>
          <AlertDescription>Revisa tu sesión o inténtalo de nuevo.</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const its = byCol[col.key] || []
            const headerVals = col.header(its)
            return (
              <div key={col.key} className={cx('rounded-lg border border-t-4 bg-muted/30', col.accent)}>
                {/* Encabezado de columna */}
                <div className="p-3 border-b bg-card rounded-t-md">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{col.title}</div>
                    <span className={cx('text-xs px-2 py-0.5 rounded-full font-medium', col.badge)}>
                      {its.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{col.hint}</div>
                  <div className="mt-2 space-y-0.5">
                    {headerVals.map((h) => (
                      <div key={h.label} className="flex items-baseline justify-between">
                        <span className={cx('text-xs', h.muted ? 'text-muted-foreground' : 'text-foreground')}>
                          {h.label}
                        </span>
                        <span
                          className={cx(
                            'font-mono font-semibold tabular-nums',
                            h.muted ? 'text-sm text-muted-foreground' : 'text-base'
                          )}
                        >
                          {money(h.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tarjetas */}
                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                  {its.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-6">Sin tratamientos</p>
                  ) : (
                    its.map((it) => (
                      <Link
                        key={it.treatment_id}
                        href={`/pacientes/${it.patient_id}/pagos`}
                        className="block rounded-md border bg-card p-2.5 hover:shadow-sm hover:border-foreground/30 transition"
                      >
                        <div className="flex items-center gap-1.5 text-sm font-semibold truncate">
                          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{it.paciente}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {it.service_name}
                          {it.group_title ? ` · ${it.group_title}` : ''}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(it.service_date)}
                        </div>
                        <div className="mt-1.5 grid grid-cols-3 gap-1 text-[11px]">
                          <div>
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-mono">{money(it.total_cost)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Pagado</div>
                            <div className="font-mono text-emerald-700">{money(it.pagado)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Saldo</div>
                            <div className={cx('font-mono', it.saldo > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                              {money(it.saldo)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
