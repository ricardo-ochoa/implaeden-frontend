'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'
import CircularProgress from '@mui/material/CircularProgress'
import { Alert, Button } from '@mui/material'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/login/Card'
import { Input } from '@/components/login/Input'
import { Label } from '@/components/login/Label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError(null)
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    )
    const body = await res.json()

    if (!res.ok) throw new Error(body.error || 'Login falló')

    if (body.accessToken) {
      // --- INICIO DEL AJUSTE SIN LIBRERÍA ---
      
      // 1. Calcular la fecha de expiración (7 días desde ahora)
      const date = new Date();
      date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
      const expires = "expires=" + date.toUTCString();

      // 2. Asignar la cookie con el formato requerido
      document.cookie = `token=${body.accessToken}; ${expires}; path=/`;

      // --- FIN DEL AJUSTE ---s
    }
    
    router.replace('/pacientes')
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        {/* HEADER */}
        <CardHeader className="bg-blue-600 p-6 text-center">
          <CardTitle className="text-2xl font-bold text-white">Iniciar Sesión</CardTitle>
          <CardDescription className="text-blue-100 mt-1">
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert severity="error" className="w-full">
                {error}
              </Alert>
            )}

            {/* EMAIL */}
            <div className="space-y-1">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Email className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border rounded"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <VisibilityOff className="h-5 w-5" /> : <Visibility className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </CardContent>

          {/* FOOTER */}
          <CardFooter className="p-6 flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              color="primary"
              className="w-full py-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <CircularProgress size={20} className="mr-2 text-white" />
                  Validando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <a
                href="/register"
                className="text-blue-600 hover:underline"
              >
                Regístrate aquí
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
