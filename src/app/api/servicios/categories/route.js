// src/app/api/servicios/categories/route.js
import { cookies } from 'next/headers'

export async function GET() {
  const token = cookies().get('token')?.value
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  try {
    // 1) Intentar primero el endpoint real del backend (si existe)
    const r1 = await fetch(`${baseUrl}/servicios/categories`, {
      cache: 'no-store',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (r1.ok) {
      const contentType = r1.headers.get('content-type') || 'application/json'
      const body = await r1.text()
      return new Response(body, { status: r1.status, headers: { 'Content-Type': contentType } })
    }

    // 2) Fallback: construir categorías desde /servicios (usando campo "category")
    const r2 = await fetch(`${baseUrl}/servicios`, {
      cache: 'no-store',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const raw = await r2.json()
    const list = Array.isArray(raw) ? raw : raw?.data || []

    const categories = Array.from(
      new Set(
        list
          .map((s) => (s?.category || s?.category_name || '').toString().trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))

    return Response.json({ categories }, { status: 200 })
  } catch (e) {
    console.error(e)
    return Response.json({ categories: [] }, { status: 200 }) // no rompas la UI
  }
}
