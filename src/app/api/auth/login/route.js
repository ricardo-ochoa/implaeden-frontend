// app/api/auth/login/route.js
import { NextResponse } from 'next/server'

export async function POST(req) {
  const { email, password } = await req.json()

  // 1) Llamas a tu API real de autenticación
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
    return NextResponse.json(
      { error: err.message || 'Login falló' },
      { status: apiRes.status }
    )
  }

  // 2) El backend debe devolver tanto accessToken como refreshToken
  const { accessToken, refreshToken } = await apiRes.json()

  // 3) Creamos la respuesta NextResponse
  const res = NextResponse.json({ token: accessToken })

  // 4) Guardamos ambos tokens en cookies HTTP‑Only
  res.cookies.set({
    name:     'token',
    value:    accessToken,
    httpOnly: true,
    path:     '/',
    maxAge:   60 * 15,        // p.ej. 15 minutos para el access token
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  })

  res.cookies.set({
    name:     'refreshToken',
    value:    refreshToken,
    httpOnly: true,
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // p.ej. 7 días para el refresh token
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  })

  return res
}
