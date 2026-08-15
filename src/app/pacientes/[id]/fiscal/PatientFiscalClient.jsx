'use client'

// ---------------------------------------------------------------------------
// Datos fiscales del paciente: Constancia de Situación Fiscal + los campos que
// se transcriben de ella para poder facturar.
//
// Tres bloques:
//   - Link privado: para pedirle al paciente que suba su constancia él mismo.
//   - Datos fiscales: RFC, razón social, régimen y C.P. (todos opcionales).
//   - Constancias: historial de archivos, con una marcada como vigente.
// ---------------------------------------------------------------------------

import { useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import {
  BadgeCheck,
  Copy,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import api, { fetcher } from '../../../../../lib/api'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

const ORIGENES = {
  clinica: { label: 'Capturado en clínica', variant: 'outline' },
  paciente: { label: 'Subido por el paciente', variant: 'secondary' },
  import: { label: 'Migrado', variant: 'outline' },
}

const formatFecha = (valor) => {
  const [y, m, d] = String(valor || '').split('T')[0].split('-')
  return y && m && d ? `${d}/${m}/${y}` : '—'
}

const formatPeso = (bytes) => {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return ''
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
}

const esPdf = (mime) => String(mime || '').includes('pdf')

export default function PatientFiscalClient({ patientId, patient }) {
  const { data, isLoading, error, mutate } = useSWR(
    patientId ? `/pacientes/${patientId}/fiscal` : null,
    fetcher
  )

  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [aEliminar, setAEliminar] = useState(null)
  const inputRef = useRef(null)

  // El formulario arranca en null y se siembra con lo que traiga el servidor la
  // primera vez; así no se pisa lo que el usuario está escribiendo en cada
  // revalidación de SWR.
  const [form, setForm] = useState(null)
  const perfil = data?.perfil
  const valores = form ?? {
    rfc: perfil?.rfc || '',
    razon_social: perfil?.razon_social || '',
    regimen_fiscal: perfil?.regimen_fiscal || '',
    codigo_postal: perfil?.codigo_postal || '',
  }

  const documentos = data?.documentos || []
  const vigente = useMemo(() => documentos.find((d) => d.vigente) || null, [documentos])
  const historial = useMemo(() => documentos.filter((d) => !d.vigente), [documentos])
  const link = data?.link

  const set = (campo) => (e) => setForm({ ...valores, [campo]: e.target.value })

  const guardarPerfil = async () => {
    setGuardando(true)
    try {
      await api.put(`/pacientes/${patientId}/fiscal/perfil`, valores)
      await mutate()
      setForm(null)
      toast.success('Datos fiscales guardados')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'No se pudieron guardar los datos')
    } finally {
      setGuardando(false)
    }
  }

  const subir = async (archivo) => {
    if (!archivo) return

    const fd = new FormData()
    fd.append('file', archivo)

    setSubiendo(true)
    try {
      await api.post(`/pacientes/${patientId}/fiscal/documentos`, fd)
      await mutate()
      toast.success('Constancia guardada')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'No se pudo subir la constancia')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const marcarVigente = async (doc) => {
    try {
      await api.patch(`/pacientes/${patientId}/fiscal/documentos/${doc.id}/vigente`)
      await mutate()
      toast.success('Marcada como vigente')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo marcar como vigente')
    }
  }

  const eliminar = async () => {
    if (!aEliminar) return
    try {
      await api.delete(`/pacientes/${patientId}/fiscal/documentos/${aEliminar.id}`)
      await mutate()
      setAEliminar(null)
      toast.success('Constancia eliminada')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo eliminar')
    }
  }

  const generarLink = async () => {
    setGenerando(true)
    try {
      const { data: nuevo } = await api.post(`/pacientes/${patientId}/fiscal/link`, { dias: 30 })
      await mutate()
      await copiar(nuevo.url)
      toast.success('Link generado y copiado')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'No se pudo generar el link')
    } finally {
      setGenerando(false)
    }
  }

  const revocarLink = async () => {
    try {
      await api.delete(`/pacientes/${patientId}/fiscal/link`)
      await mutate()
      toast.success('Link revocado')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo revocar el link')
    }
  }

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch {
      // clipboard falla sin HTTPS o sin permiso: no vale la pena romper el flujo
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudieron cargar los datos fiscales.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Link privado */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Link para el paciente</h3>
          <p className="text-xs text-muted-foreground">
            Compártelo para que suba su constancia sin necesidad de cuenta.
          </p>
        </div>

        {link ? (
          <div className="rounded-lg border p-3">
            <p className="break-all font-mono text-xs">{link.url}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vence el {formatFecha(link.expires_at)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const ok = await copiar(link.url)
                  toast[ok ? 'success' : 'error'](
                    ok ? 'Link copiado' : 'Copia el link manualmente'
                  )
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button size="sm" variant="outline" onClick={generarLink} disabled={generando}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerar
              </Button>
              <Button size="sm" variant="outline" onClick={revocarLink}>
                <X className="mr-2 h-4 w-4" />
                Revocar
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={generarLink} disabled={generando}>
            {generando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Generar link privado
          </Button>
        )}
      </section>

      <Separator />

      {/* Datos fiscales */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Datos fiscales</h3>
          <p className="text-xs text-muted-foreground">
            Se transcriben de la constancia. Todos son opcionales.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rfc">RFC</Label>
            <Input
              id="rfc"
              value={valores.rfc}
              onChange={set('rfc')}
              placeholder="XAXX010101000"
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codigo_postal">Código postal</Label>
            <Input
              id="codigo_postal"
              value={valores.codigo_postal}
              onChange={set('codigo_postal')}
              placeholder="86000"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="razon_social">Razón social / Nombre</Label>
            <Input
              id="razon_social"
              value={valores.razon_social}
              onChange={set('razon_social')}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="regimen_fiscal">Régimen fiscal</Label>
            <Input
              id="regimen_fiscal"
              value={valores.regimen_fiscal}
              onChange={set('regimen_fiscal')}
              placeholder="605 - Sueldos y Salarios"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={guardarPerfil} disabled={guardando}>
            {guardando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar datos
          </Button>
        </div>
      </section>

      <Separator />

      {/* Constancias */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Constancia de Situación Fiscal</h3>
            <p className="text-xs text-muted-foreground">
              PDF o imagen. La más reciente queda como vigente.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => subir(e.target.files?.[0])}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={subiendo}>
            {subiendo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Subir constancia
          </Button>
        </div>

        {documentos.length === 0 ? (
          <Alert>
            <AlertTitle>Sin constancia</AlertTitle>
            <AlertDescription>
              Este paciente no tiene constancia registrada. Súbela o compártele el link privado.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="divide-y">
            {[vigente, ...historial].filter(Boolean).map((doc) => {
              const origen = ORIGENES[doc.origen] || ORIGENES.clinica

              return (
                <div key={doc.id} className="flex flex-wrap items-start gap-3 p-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {doc.file_name || 'Constancia'}
                      </p>
                      {doc.vigente ? <Badge>Vigente</Badge> : null}
                      <Badge variant={origen.variant}>{origen.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(doc.created_at)}
                      {formatPeso(doc.size_bytes) ? ` · ${formatPeso(doc.size_bytes)}` : ''}
                      {esPdf(doc.mime_type) ? ' · PDF' : ' · Imagen'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={doc.file_url} target="_blank" rel="noreferrer">
                        Ver
                      </a>
                    </Button>
                    {!doc.vigente ? (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => marcarVigente(doc)}
                        title="Marcar como vigente"
                      >
                        <BadgeCheck className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setAEliminar(doc)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </Card>
        )}
      </section>

      <ConfirmDeleteModal
        open={Boolean(aEliminar)}
        onClose={() => setAEliminar(null)}
        title="Eliminar constancia"
        description={`¿Seguro que quieres eliminar "${aEliminar?.file_name || 'esta constancia'}"? Esta acción no se puede deshacer.`}
        onConfirm={eliminar}
      />
    </div>
  )
}
