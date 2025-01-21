import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { formatDate } from '../../lib/utils/formatDate';

const TreatmentCard = ({ treatment, onMenuOpen }) => {
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
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1" fontWeight="bold">
              {treatment.service_name}
            </Typography>
          </Box>
          <IconButton onClick={(e) => onMenuOpen(e, treatment)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ marginRight: 1 }}>
          <span className='font-semibold'>Categoría: </span> {treatment.service_category}
        </Typography>
        <Box display="flex" mt={2}>
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
