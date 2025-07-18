'use client';

import { AppBar, Toolbar, Button, Box } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import api from '../../lib/api';

export default function Header() {
  const router = useRouter();
  const user = useAuth();

  const handleLogout = async () => {
    // 1) Borra el token del localStorage
    localStorage.removeItem('token');

    // 2) Llama a nuestro endpoint interno que caduca la cookie httpOnly
    await fetch('/api/auth/logout', { method: 'POST' });

    // 3) (Opcional) Si tu backend tiene un endpoint de logout que también invalide el JWT en servidor:
    try {
      await api.post('/auth/logout');
    } catch {}

    // 4) Redirige al login
    router.push('/login');
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ mt: 2 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Image
          src="/logo.svg"
          alt="Implaedén Logo"
          width={150}
          height={40}
          className="object-contain"
        />
        <Box>
          {user ? (
            <Button variant="outlined" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          ) : (
            <Button variant="contained" onClick={() => router.push('/login')}>
              Iniciar sesión
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
