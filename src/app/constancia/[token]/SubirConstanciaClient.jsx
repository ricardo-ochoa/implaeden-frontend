'use client'

// Subida pública de la Constancia de Situación Fiscal.
//
// Usa fetch directo y no la instancia `api`: esa agrega el Authorization de la
// cookie de sesión, y aquí el visitante es el paciente, sin cuenta.

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, FileText, Loader2, ShieldCheck, Upload } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const API = process.env.NEXT_PUBLIC_API_URL

export default function SubirConstanciaClient({ token }) {
  const [estado, setEstado] = useState('cargando') // cargando | listo | invalido
  const [info, setInfo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let vivo = true

    ;(async () => {
      try {
        const res = await fetch(`${API}/constancia-fiscal/${token}`, { cache: 'no-store' })
        if (!vivo) return
        if (!res.ok) return setEstado('invalido')
        setInfo(await res.json())
        setEstado('listo')
      } catch {
        if (vivo) setEstado('invalido')
      }
    })()

    return () => {
      vivo = false
    }
  }, [token])

  const enviar = useCallback(async () => {
    if (!archivo) return

    setSubiendo(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', archivo)

      const res = await fetch(`${API}/constancia-fiscal/${token}`, { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'No se pudo enviar el archivo. Inténtalo de nuevo.')
        return
      }

      setEnviado(true)
    } catch {
      setError('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setSubiendo(false)
    }
  }, [archivo, token])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10">
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          IMPLAEDÉN
        </div>

        {estado === 'cargando' ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : estado === 'invalido' ? (
          <Alert variant="destructive">
            <AlertTitle>Link no válido</AlertTitle>
            <AlertDescription>
              Este link ya venció o no es correcto. Pídele a la clínica que te envíe uno nuevo.
            </AlertDescription>
          </Alert>
        ) : enviado ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-lg font-semibold">¡Listo, {info?.paciente}!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Recibimos tu constancia. Ya podemos emitir tus facturas.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => {
                setEnviado(false)
                setArchivo(null)
              }}
            >
              Enviar otro archivo
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Hola, {info?.paciente}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sube tu <strong>Constancia de Situación Fiscal</strong> para que podamos emitir tus
              facturas. Puede ser el PDF del SAT o una foto del documento.
            </p>

            {info?.ya_tiene_documento ? (
              <p className="mt-3 rounded-md bg-muted p-2.5 text-xs text-muted-foreground">
                Ya tenemos una constancia tuya. Si subes otra, usaremos la más reciente.
              </p>
            ) : null}

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                setArchivo(e.target.files?.[0] || null)
                setError(null)
              }}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-5 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition hover:bg-muted"
            >
              {archivo ? (
                <>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <span className="break-all text-sm font-medium">{archivo.name}</span>
                  <span className="text-xs text-muted-foreground">Toca para cambiarlo</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Selecciona tu archivo</span>
                  <span className="text-xs text-muted-foreground">PDF o imagen, máximo 15 MB</span>
                </>
              )}
            </button>

            {error ? (
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : null}

            <Button className="mt-5 w-full" onClick={enviar} disabled={!archivo || subiendo}>
              {subiendo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar constancia
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Tu documento se usa únicamente para facturación y se resguarda de forma confidencial.
            </p>
          </>
        )}
      </Card>
    </main>
  )
}
