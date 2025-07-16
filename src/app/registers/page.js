// src/app/register/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import { Alert, Button } from '@mui/material'
import api from '../../../lib/api'

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

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.post('/auth/register', {
        email,
        password,
        role: 'admin', // primer usuario → admin
      })
      router.push('/login')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        {/* HEADER */}
        <CardHeader className="bg-violet-600 p-6 text-center">
          <CardTitle className="text-2xl font-bold text-white">Registrar Administrador</CardTitle>
          <CardDescription className="text-green-100 mt-1">
            Crea tu cuenta para gestionar la clínica
          </CardDescription>
        </CardHeader>

        {/* FORM */}
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
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
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
                  Creando...
                </span>
              ) : (
                'Crear Cuenta'
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <a
                href="/login"
                className="text-violet-600 hover:underline"
              >
                Inicia sesión aquí
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
