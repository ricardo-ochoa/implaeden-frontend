// src/app/api/auth/refresh/route.js
import { NextResponse } from 'next/server';
import { cookies }     from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:4000/api

export async function GET(request) {
  // 1) Leer el refreshToken de la cookie
  const cookieStore  = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2) Llamar al backend para renovar
  const apiRes = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!apiRes.ok) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3) Extraer nuevos tokens
  const { accessToken, refreshToken: newRefreshToken, expiresIn } = await apiRes.json();

  // 4) Responder con JSON y set-Cookie
  const res = NextResponse.json({ accessToken });
  res.cookies.set('token', accessToken, {
    httpOnly: true,
    path:     '/',
    maxAge:   expiresIn,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  });
  if (newRefreshToken) {
    res.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      path:     '/',
      maxAge:   7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure:   process.env.NODE_ENV === 'production',
    });
  }

  return res;
}
