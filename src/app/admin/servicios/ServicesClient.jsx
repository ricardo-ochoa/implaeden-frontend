// src/app/admin/servicios/ServicesClient.js
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// shadcn/ui
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// icons
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// modal create/edit
import ServiceFormDialog from '@/components/services/ServiceFormDialog'

const cx = (...classes) => classes.filter(Boolean).join(' ')
const BADGE_PALETTE = [
  'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/50',
  'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50',
  'bg-amber-100 text-amber-950 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50',
  'bg-violet-100 text-violet-950 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-900/50',
  'bg-rose-100 text-rose-950 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/50',
  'bg-cyan-100 text-cyan-950 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-900/50',
  'bg-fuchsia-100 text-fuchsia-950 border border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-200 dark:border-fuchsia-900/50',
  'bg-lime-100 text-lime-950 border border-lime-200 dark:bg-lime-950/40 dark:text-lime-200 dark:border-lime-900/50',
]

const hashString = (str = '') => {
  // djb2 (rápido y estable)
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i)
  return h >>> 0 // unsigned
}

const getBadgeColorClass = (label) => {
  const key = (label || 'Sin categoría').toString().trim().toLowerCase()
  const idx = hashString(key) % BADGE_PALETTE.length
  return BADGE_PALETTE[idx]
}


export default function ServicesClient({ initialServices = [] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all') // 'all' | 'uncategorized' | number(id) | name:xxx
  const [services, setServices] = useState(Array.isArray(initialServices) ? initialServices : [])
  const [categories, setCategories] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)

  // dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [editing, setEditing] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  // toast
  const [toast, setToast] = useState({
    open: false,
    variant: 'success',
    title: '',
    message: '',
  })

  // tabs overflow/scroll state
  const tabsRef = useRef(null)
  const [tabsOverflow, setTabsOverflow] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    if (!toast.open) return
    const t = setTimeout(() => setToast((s) => ({ ...s, open: false })), 3000)
    return () => clearTimeout(t)
  }, [toast.open])

  const refreshServices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/servicios', { cache: 'no-store' })
      if (!res.ok) throw new Error(`GET /api/servicios -> ${res.status}`)
      const data = await res.json()
      setServices(Array.isArray(data) ? data : data?.data || [])
    } finally {
      setLoading(false)
    }
  }

  const refreshCategories = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch('/api/servicios/categories', { cache: 'no-store' })
      if (!res.ok) throw new Error(`GET /api/servicios/categories -> ${res.status}`)
      const data = await res.json()

      const list =
        Array.isArray(data) ? data :
        Array.isArray(data?.data) ? data.data :
        Array.isArray(data?.categories) ? data.categories :
        []

      setCategories(list)
    } finally {
      setLoadingCategories(false)
    }
  }

  const refreshAll = async () => {
    await Promise.all([refreshServices(), refreshCategories()])
  }

  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categoriesReady = !loadingCategories && Array.isArray(categories)

  // ========== Normaliza categorías (acepta strings u objetos) ==========
  const normalizedCategories = useMemo(() => {
    const raw = Array.isArray(categories) ? categories : []

    const out = raw
      .map((c) => {
        // si tu API devuelve strings: ["General", "Rayos X"]
        if (typeof c === 'string') {
          const label = c.trim()
          if (!label) return null
          return { key: `name:${label.toLowerCase()}`, label }
        }

        // objetos con distintos nombres de campos
        const id =
          c?.id ??
          c?.category_id ??
          c?.categoryId ??
          c?.value ??
          c?._id ??
          c?.pk

        const label =
          (c?.name ??
            c?.category ??
            c?.label ??
            c?.category_name ??
            c?.nombre ??
            c?.title ??
            '').toString().trim()

        if (!label) return null

        // si hay id, úsalo; si no, usa label como key
        if (id != null && id !== '') return { key: String(id), label }
        return { key: `name:${label.toLowerCase()}`, label }
      })
      .filter(Boolean)

    // dedupe por key
    const m = new Map()
    for (const item of out) m.set(item.key, item)
    return Array.from(m.values())
  }, [categories])

  const tabKeyToLabelLower = useMemo(() => {
    const m = new Map()
    for (const c of normalizedCategories) m.set(c.key, c.label.toLowerCase())
    return m
  }, [normalizedCategories])

  // ===== Índices de categorías (por id) =====
  const categoryNameById = useMemo(() => {
    const m = new Map()
    for (const c of categories || []) {
      const id = c?.id ?? c?.category_id
      const name = (c?.name ?? c?.category ?? c?.label ?? '').toString().trim()
      if (id != null && name) m.set(Number(id), name)
    }
    return m
  }, [categories])

  const categoryIdByName = useMemo(() => {
    const m = new Map()
    for (const [id, name] of categoryNameById.entries()) {
      m.set(String(name).toLowerCase(), Number(id))
    }
    return m
  }, [categoryNameById])

  const getCategoryId = (s) => {
    const cid = s?.category_id ?? s?.categoryId ?? s?.categoryID
    if (cid != null && cid !== '') return Number(cid)

    // si solo viene texto (SELECT c.name AS category)
    const name = (s?.category || s?.category_name || '').toString().trim().toLowerCase()
    if (name) return categoryIdByName.get(name)

    return null
  }

  const getCategoryLabel = (s) => {
    const cid = getCategoryId(s)
    if (cid != null) return categoryNameById.get(cid) || (s?.category || s?.category_name || '')
    return (s?.category || s?.category_name || '').toString().trim()
  }

  // ===== 1) filter por query =====
  const queryFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return services

    return services.filter((s) => {
      const name = (s?.name || '').toLowerCase()
      const cat = (getCategoryLabel(s) || '').toLowerCase()
      const desc = (s?.description || '').toLowerCase()
      return name.includes(q) || cat.includes(q) || desc.includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, services, categoryNameById, categoryIdByName])

  // ===== 2) filter por tab (categoría) =====
  const visibleServices = useMemo(() => {
    if (activeCategory === 'all') return queryFiltered

    if (activeCategory === 'uncategorized') {
      return queryFiltered.filter((s) => getCategoryId(s) == null)
    }

    // si el tab es por nombre: name:general
    const labelLower = tabKeyToLabelLower.get(activeCategory)
    if (labelLower) {
      return queryFiltered.filter(
        (s) => (getCategoryLabel(s) || '').toLowerCase() === labelLower
      )
    }

    // fallback por id numérico
    const cid = Number(activeCategory)
    if (!Number.isNaN(cid)) {
      return queryFiltered.filter((s) => getCategoryId(s) === cid)
    }

    return queryFiltered
  }, [activeCategory, queryFiltered, tabKeyToLabelLower])

  const hasUncategorized = useMemo(() => {
    return services.some((s) => getCategoryId(s) == null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, categoryNameById, categoryIdByName])

  // ===== Tabs =====
  const tabs = useMemo(() => {
    const list = [{ key: 'all', label: 'Todos' }]
    for (const c of normalizedCategories) list.push({ key: c.key, label: c.label })
    if (hasUncategorized) list.push({ key: 'uncategorized', label: 'Sin categoría' })
    return list
  }, [normalizedCategories, hasUncategorized])

  // ===== Tabs scroll/overflow logic =====
  const updateTabsState = () => {
    const el = tabsRef.current
    if (!el) return

    const overflow = el.scrollWidth > el.clientWidth + 1
    setTabsOverflow(overflow)

    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  const tabsKey = useMemo(() => tabs.map((t) => t.key).join('|'), [tabs])

  useEffect(() => {
    updateTabsState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabsKey])

  useEffect(() => {
    const el = tabsRef.current
    if (!el) return

    const onScroll = () => updateTabsState()
    el.addEventListener('scroll', onScroll, { passive: true })

    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateTabsState())
      ro.observe(el)
    } else {
      const onResize = () => updateTabsState()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro?.disconnect?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Dialog handlers =====
  const openCreate = () => {
    setFormMode('create')
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (service) => {
    setFormMode('edit')
    setEditing(service)
    setFormOpen(true)
  }

  const handleSubmit = async (payload) => {
    try {
      if (formMode === 'edit') {
        const id = editing?.id
        if (!id) throw new Error('Servicio inválido')

        const res = await fetch(`/api/servicios/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`PUT /api/servicios/${id} -> ${res.status}`)

        await refreshServices()
        setToast({ open: true, variant: 'success', title: 'Listo', message: 'Servicio actualizado.' })
      } else {
        const res = await fetch('/api/servicios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`POST /api/servicios -> ${res.status}`)

        await refreshServices()
        setToast({ open: true, variant: 'success', title: 'Listo', message: 'Servicio creado.' })
      }
    } catch (e) {
      console.error(e)
      setToast({ open: true, variant: 'error', title: 'Error', message: 'No se pudo guardar.' })
      throw e
    }
  }

  const askDelete = (service) => {
    setToDelete(service)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    try {
      const id = toDelete?.id
      if (!id) return

      const res = await fetch(`/api/servicios/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`DELETE /api/servicios/${id} -> ${res.status}`)

      setDeleteOpen(false)
      setToDelete(null)
      await refreshServices()

      setToast({ open: true, variant: 'success', title: 'Eliminado', message: 'Servicio eliminado.' })
    } catch (e) {
      console.error(e)
      setToast({ open: true, variant: 'error', title: 'Error', message: 'No se pudo eliminar.' })
    }
  }

  const scrollTabs = (dir) => {
    const el = tabsRef.current
    if (!el) return
    const delta = dir === 'left' ? -320 : 320
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const ServiceCard = ({ s }) => (
    <Card className="w-full">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold leading-5 break-words line-clamp-2">{s.name}</p>

            <div className="mt-2">
              {(() => {
                const label = getCategoryLabel(s) || 'Sin categoría'
                return (
                  <Badge
                    variant="secondary"
                    className={cx(
                      'max-w-full',
                      getBadgeColorClass(label)
                    )}
                  >
                    <span className="truncate">{label}</span>
                  </Badge>
                )
              })()}
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(s)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => askDelete(s)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground break-words line-clamp-3">
          {s.description || '—'}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-6 space-y-6">
      {/* Header estilo screenshot: título izq, search centrado, botón der */}
      <div className="grid gap-4 md:grid-cols-[1fr_minmax(320px,640px)_1fr] md:items-center">
        {/* Left */}
        <div>
          <p className="text-2xl font-semibold tracking-tight">Tratamientos</p>
          <div className="mt-1 space-y-1">
            {loading ? <p className="text-sm text-muted-foreground">Cargando servicios…</p> : null}
            {loadingCategories ? <p className="text-sm text-muted-foreground">Cargando categorías…</p> : null}
          </div>
        </div>

        {/* Center search (pill) */}
        <div className="flex justify-center">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className={cx('h-12 w-full rounded-full pl-11 pr-11 bg-background', 'shadow-sm')}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Right */}
        <div className="flex md:justify-end">
          <Button
            type="button"
            className="h-12 rounded-full px-6 w-full md:w-auto"
            onClick={openCreate}
            disabled={!categoriesReady}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {!categoriesReady ? (
        <Alert>
          <AlertTitle>Faltan categorías</AlertTitle>
          <AlertDescription>
            No se pudieron cargar categorías. Revisa que exista <code>/api/servicios/categories</code>.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Tabs */}
      <div className="relative">
        {/* Flechas: SOLO si hay overflow (mobile y desktop) */}
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          disabled={!canScrollLeft}
          className={cx(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm border hover:bg-muted transition',
            tabsOverflow ? 'flex' : 'hidden',
            !canScrollLeft ? 'opacity-40 pointer-events-none' : ''
          )}
          aria-label="Desplazar categorías a la izquierda"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => scrollTabs('right')}
          disabled={!canScrollRight}
          className={cx(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm border hover:bg-muted transition',
            tabsOverflow ? 'flex' : 'hidden',
            !canScrollRight ? 'opacity-40 pointer-events-none' : ''
          )}
          aria-label="Desplazar categorías a la derecha"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Fade gradients: solo si hay overflow */}
        {tabsOverflow ? (
          <>
            <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-background to-transparent z-[5]" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-background to-transparent z-[5]" />
          </>
        ) : null}

        {/* ✅ Wrapper para centrar */}
        <div className="flex justify-center">
          <div
            ref={tabsRef}
            className={cx(
              'flex items-center gap-6 overflow-x-auto whitespace-nowrap ml-10 md:ml-0  md:px-14',
              'justify-left md:justify-center',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            )}
          >
            {tabs.map((t) => {
              const active = String(activeCategory) === String(t.key)

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveCategory(t.key)}
                  className={cx(
                    'relative py-2 text-sm transition-colors',
                    active
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground font-medium hover:text-foreground'
                  )}
                >
                  {t.label}

                  {/* underline */}
                  <span
                    className={cx(
                      'absolute left-0 -bottom-0 h-[2px] w-full rounded-full transition-opacity',
                      active ? 'opacity-100 bg-primary' : 'opacity-0 bg-transparent'
                    )}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Cards */}
      {!loading && visibleServices.length === 0 ? (
        <div>
          <p className="text-sm text-muted-foreground">No se encontraron resultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleServices.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialValue={editing}
        services={services}
        categories={categories}
        onSubmit={handleSubmit}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar servicio</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar <span className="font-semibold">{toDelete?.name}</span>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={cx('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast flotante */}
      {toast.open ? (
        <div className="fixed bottom-6 left-1/2 z-50 w-[92vw] max-w-[520px] -translate-x-1/2">
          <Alert variant={toast.variant === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>{toast.title}</AlertTitle>
            <AlertDescription>{toast.message}</AlertDescription>
          </Alert>
        </div>
      ) : null}
    </div>
  )
}
