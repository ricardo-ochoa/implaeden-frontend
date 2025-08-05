// middleware.js
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// La función middleware ahora es 'async' para poder usar 'await'
export async function middleware(req) {
  const token = req.cookies.get('token')?.value

  // 1. Si no hay token, redirige a login inmediatamente.
  // Esto aplica a todas las rutas del matcher.
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Si hay token, verificar su validez.
  try {
    // Obtén tu clave secreta de las variables de entorno.
    // DEBE ser la misma que usas en tu backend para firmar el token.
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    // 'jwtVerify' valida el token (firma y expiración).
    // Si es inválido, lanzará un error que será capturado por el 'catch'.
    await jwtVerify(token, secret)

    // Si el token es válido, la petición puede continuar.
    return NextResponse.next()

  } catch (error) {
    // El token no es válido (expirado, malformado, etc.).
    console.error("Error de validación de token:", error.code) // ej: 'ERR_JWT_EXPIRED'

    // Redirigir al usuario a la página de login.
    const loginUrl = new URL('/login', req.url)

    // Creamos una respuesta de redirección.
    const response = NextResponse.redirect(loginUrl)

    // Borramos la cookie del token inválido del navegador del usuario.
    // Esto es importante para evitar bucles de redirección.
    response.cookies.delete('token')

    return response
  }
}

// El config.matcher sigue igual, y es la forma correcta de definir las rutas.
export const config = {
  matcher: ['/pacientes/:path*', '/citas/:path*', '/tratamientos/:path*'],
}