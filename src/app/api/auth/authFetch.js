// src/api/auth/authFetch.js
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL  = process.env.NEXT_PUBLIC_API_URL;   // http://localhost:4000/api
const NEXT_URL = process.env.NEXT_PUBLIC_BASE_URL;  // http://localhost:3000

export default async function authFetch(path, opts = {}) {
  const headerList   = await headers();
  const cookieHeader = headerList.get('cookie') || '';

  // 1) Petición al backend
  let res = await fetch(`${API_URL}${path}`, {
    ...opts,
    cache: 'no-store',
    headers: {
      ...(opts.headers || {}),
      cookie: cookieHeader,
    },
  });

  // 2) Si expira el token, refresh vía Next.js
  if (res.status === 401) {
    if (!NEXT_URL) redirect(new URL('/login', NEXT_URL));

    const refreshRes = await fetch(
      `${NEXT_URL}/api/auth/refresh`,
      { method: 'GET', cache: 'no-store', headers: { cookie: cookieHeader } }
    );
    if (!refreshRes.ok) {
      redirect(new URL('/login', NEXT_URL));
    }

    // 3) Reintentar con cookies actualizadas
    const updated = await headers();
    const newCookies = updated.get('cookie') || '';
    res = await fetch(`${API_URL}${path}`, {
      ...opts,
      cache: 'no-store',
      headers: {
        ...(opts.headers || {}),
        cookie: newCookies,
      },
    });
  }

  if (!res.ok) {
    throw new Error(`Fetch ${path} falló con status ${res.status}`);
  }

  return res.json();
}
