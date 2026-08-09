import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SectionTitle from '@/components/SectionTitle'
import ReconcileClient from '@/components/citas/ReconcileClient'

// Bandeja de "Citas sin asignar": eventos (Confirmafy/manual) aún no vinculados
// a un paciente. Ventana: mes actual → fin del mes siguiente.
export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) redirect('/login')

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('❌ NEXT_PUBLIC_API_URL no está definida')

  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString()

  let initial = []
  try {
    const res = await fetch(
      `${baseUrl}/appointments/unassigned?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }
    )
    initial = res.ok ? await res.json() : []
  } catch {
    initial = []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title="Citas sin asignar"
        breadcrumbs={[{ label: 'Agenda', href: '/agenda' }, { label: 'Sin asignar' }]}
      />
      <ReconcileClient initial={initial} from={from} to={to} />
    </div>
  )
}
