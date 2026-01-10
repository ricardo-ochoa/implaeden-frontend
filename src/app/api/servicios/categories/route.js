import { cookies } from 'next/headers'

export async function GET() {
  const token = cookies().get('token')?.value
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const res = await fetch(`${baseUrl}/servicios/categories`, {
    cache: 'no-store',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const contentType = res.headers.get('content-type') || 'application/json'
  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': contentType },
  })
}
