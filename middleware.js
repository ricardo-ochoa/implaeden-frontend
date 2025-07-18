// middleware.js
import { NextResponse, NextRequest } from 'next/server'

export function middleware(req) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  // Define aquí los prefijos de ruta que quieres proteger
  const protectedPaths = ['/pacientes', '/citas', '/tratamientos']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  // Si la ruta está protegida y no hay token → redirige al login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Se aplica a todas las rutas que empiecen por /pacientes, /citas o /tratamientos
  matcher: ['/pacientes/:path*', '/citas/:path*', '/tratamientos/:path*'],
}
