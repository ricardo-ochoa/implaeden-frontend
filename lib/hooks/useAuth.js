// lib/hooks/useAuth.js
import { useState, useEffect } from 'react'

function parseJwt(token) {
  try {
    const [, payload] = token.split('.')
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = parseJwt(token)
      if (decoded) {
        const { sub: id, role, permission } = decoded
        setUser({ id, role, permission })
      } else {
        localStorage.removeItem('token')
      }
    }
  }, [])

  return user
}
