// src/app/admin/servicios/page.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ServicesClient from './ServicesClient'

export default async function AdminServiciosPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/login')

  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const res = await fetch(`${baseUrl}/servicios`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401) redirect('/login')
  if (!res.ok) throw new Error(`Error cargando servicios (${res.status})`)

  const services = await res.json()

  return <ServicesClient initialServices={services} />
}
