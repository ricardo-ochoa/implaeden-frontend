// src/components/Header.js
'use client';

import { AppBar, Toolbar, Button, Box } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // <-- Importar
import { useAuth } from '../../lib/hooks/useAuth';

export default function Header() {
  const router = useRouter();
  const user = useAuth(); // Este hook necesita el ajuste del paso 2

  const handleLogout = () => {
    // 1. Borra la cookie del navegador
    Cookies.remove('token', { path: '/' });

    // 2. Redirige y refresca para limpiar el estado del servidor
    router.push('/login');
    router.refresh(); 
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ mt: 2 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Image
          src="/logo.svg"
          alt="Implaedén Logo"
          width={150}
          height={40}
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