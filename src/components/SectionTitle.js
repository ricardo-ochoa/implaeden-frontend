'use client';

import { Box, Button, Typography, Breadcrumbs, Link } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

export default function SectionTitle({ breadcrumbs = [], title }) {
  const router = useRouter();

  const handleBack = () => {
    router.back(); // Regresa a la página anterior
  };

  return (
    <Box sx={{ marginBottom: 4 }}>
      {/* Botón de regresar */}
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ marginBottom: 1 }}
      >
        Regresar
      </Button>

      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" separator=" / " sx={{ fontSize: '0.875rem' }}>
        {breadcrumbs.map((breadcrumb, index) => (
          <Link
            key={index}
            href={breadcrumb.href || '#'}
            underline="hover"
            color={breadcrumb.href ? 'primary' : 'text.primary'}
            onClick={(e) => {
              if (!breadcrumb.href) e.preventDefault();
            }}
            sx={{ cursor: breadcrumb.href ? 'pointer' : 'default' }}
          >
            {breadcrumb.label}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Título de la sección */}
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, marginTop: 1 }}>
        {title}
      </Typography>
    </Box>
  );
}
