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
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
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
