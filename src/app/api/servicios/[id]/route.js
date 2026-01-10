// src/app/api/servicios/[id]/route.js
import { cookies } from 'next/headers'

export async function PUT(req, { params }) {
  const token = cookies().get('token')?.value
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  const bodyText = await req.text()

  const res = await fetch(`${baseUrl}/servicios/${params.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: bodyText,
  })

  const contentType = res.headers.get('content-type') || 'application/json'
  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': contentType },
  })
}

export async function DELETE(req, { params }) {
  const token = cookies().get('token')?.value
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const res = await fetch(`${baseUrl}/servicios/${params.id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  const contentType = res.headers.get('content-type') || 'application/json'
  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': contentType },
  })
}
