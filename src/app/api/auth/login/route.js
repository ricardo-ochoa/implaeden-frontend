// app/api/auth/login/route.js
import { NextResponse } from 'next/server'

export async function POST(req) {
  const { email, password } = await req.json()
  // Llamas a tu API real de auth
  const apiRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }
  )

  if (!apiRes.ok) {
    const err = await apiRes.json()
    return NextResponse.json({ error: err.message || 'Login falló' }, { status: apiRes.status })
  }

  const { token } = await apiRes.json()
  const res = NextResponse.json({ token })
  res.cookies.set({
    name:     'token',
    value:    token,
    httpOnly: true,
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  })
  return res
}
