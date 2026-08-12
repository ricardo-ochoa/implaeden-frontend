import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SectionTitle from '@/components/SectionTitle'
import CobranzaClient from '@/components/cobranza/CobranzaClient'

// Tablero de cobranza de TODA la clínica (por cobrar / en proceso / cobrado).
export default async function CobranzaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) redirect('/login')

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle title="Cobranza" breadcrumbs={[{ label: 'Cobranza' }]} />
      <CobranzaClient />
    </div>
  )
}
