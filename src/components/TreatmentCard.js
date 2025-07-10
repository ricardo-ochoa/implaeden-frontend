import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import { formatDate } from '../../lib/utils/formatDate';

const getStatusColor = (status) => {
  switch (status) {
    case 'Terminado':
      return 'success';
    case 'En proceso':
      return 'warning';
    case 'Por Iniciar':
    default:
      return 'default';
  }
};

const TreatmentCard = ({ treatment, onMenuOpen, onClick, onStatusClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      sx={{
        borderRadius: '10px',
        width: { xs: '100%', md: '40%', lg: 300 },
        cursor: 'pointer',
        border: '2px solid transparent',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '2px solid #B2C6FB',
          backgroundColor: '#F5F7FB',
        },
      }}
    >
      <CardContent onClick={onClick} sx={{ position: 'relative' }}>
        <Box display="flex" justifyContent="space-between">
          <Box
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Chip
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <span>{treatment.status || 'Sin estado'}</span>
                  {hovered && <EditIcon sx={{ fontSize: 16 }} />}
                </Box>
              }
              color={getStatusColor(treatment.status)}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onStatusClick?.(treatment);
              }}
              sx={(theme) => ({
                cursor: 'pointer',
                fontWeight: 'bold',
                borderWidth: 2,
                borderStyle: 'solid',
                borderColor: theme.palette[getStatusColor(treatment.status)]?.main || '#ccc',
                '&:hover': {
                  boxShadow: `0 0 6px ${theme.palette[getStatusColor(treatment.status)]?.main || '#888'}`,
                },
              })}
            />
          </Box>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onMenuOpen(e, treatment);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Typography variant="body1" fontWeight="bold">
            {treatment.service_name}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ marginRight: 1 }}>
          <span className="font-semibold">Categoría: </span> {treatment.category}
        </Typography>

        <Box display="flex" mt={1}>
          <Typography variant="body2" sx={{ fontWeight: 600, marginRight: 1 }}>
            Fecha:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(treatment.service_date)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TreatmentCard;
