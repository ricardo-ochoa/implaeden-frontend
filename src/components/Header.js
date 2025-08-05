// src/components/Header.js
'use client';

import { useAuth } from '@/context/AuthContext';
import { AppBar, Toolbar, Button, Box, CircularProgress } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


export default function Header() {
  const router = useRouter();
  const { logout, loading, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout(); // Llama a la función del contexto.
    router.push('/login'); // Redirige al usuario.
  };

  // Muestra un loader mientras el contexto verifica si hay un token válido
  if (loading) {
    return <AppBar position="static" color="transparent" elevation={0} sx={{ mt: 2 }}><Toolbar /></AppBar>;
  }

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
          {isAuthenticated ? (
            <>
              <Button variant="outlined" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </>
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