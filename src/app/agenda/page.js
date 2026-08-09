import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SectionTitle from '@/components/SectionTitle'
import AgendaClient from '@/components/citas/AgendaClient'

// Vista GLOBAL de la agenda de la clínica (todas las citas del mes actual).
export default async function AgendaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) redirect('/login')

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('❌ NEXT_PUBLIC_API_URL no está definida')

  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  let initial = []
  try {
    const res = await fetch(
      `${baseUrl}/appointments/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }
    )
    initial = res.ok ? await res.json() : []
  } catch {
    initial = []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle title="Agenda de la clínica" breadcrumbs={[{ label: 'Agenda' }]} />
      <AgendaClient initialAppointments={initial} initialFrom={from} initialTo={to} />
    </div>
  )
}
