'use client';

import { Card, CardContent, Typography, IconButton, Box } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useRouter } from 'next/navigation';

export default function GeneralCard({ title, description, redirect }) {
  const router = useRouter();

  const handleRedirect = () => {
    router.push(redirect);
  };

  return (
    <Card
      sx={{
        borderRadius: '10px',
        cursor: 'pointer',
        border: '2px solid transparent', // Border default
        transition: 'border-color 0.3s, box-shadow 0.3s', // Smooth transition
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '2px solid #B2C6FB',
          backgroundColor: '#F5F7FB',
        },
      }}
      onClick={handleRedirect}
    >
      <CardContent>
        <Box className="flex justify-between items-center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <IconButton size="small" color="primary">
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ marginTop: '8px', color: 'gray' }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
