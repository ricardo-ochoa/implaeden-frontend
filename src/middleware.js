// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Permitir login (y cualquier pública que quieras)
  if (pathname.startsWith("/login")) return NextResponse.next();

  const token = req.cookies.get("token")?.value;

  // Si intentan /register sin token
  if (pathname.startsWith("/register") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/register")) {
  return NextResponse.redirect(new URL("/", req.url));
}


  // Para rutas protegidas por matcher, si no hay token -> login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // 🔒 Bloquear /register para NO admins (ajusta el campo según tu JWT)
    const isAdmin =
      payload?.role === "admin" ||
      payload?.isAdmin === true ||
      payload?.tipo === "admin";

    if (pathname.startsWith("/register") && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
      // o si prefieres que "no exista":
      // return NextResponse.rewrite(new URL("/404", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token", { path: "/" });
    return res;
  }
}

export const config = {
  matcher: ["/chat/:path*", "/pacientes/:path*", "/citas/:path*", "/tratamientos/:path*", "/register/:path*"],
};

