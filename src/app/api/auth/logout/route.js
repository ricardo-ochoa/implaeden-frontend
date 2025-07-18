// app/api/auth/logout/route.js
import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name:     'token',
    value:    '',
    httpOnly: true,
    path:     '/',
    maxAge:   0,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  })
  return res
}
