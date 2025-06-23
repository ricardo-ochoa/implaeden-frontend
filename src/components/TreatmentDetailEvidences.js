// src/components/TreatmentDetailEvidences.js
'use client';
import { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Modal,
} from '@mui/material';
import { DeleteForever as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import useTreatmentEvidences from '../../lib/hooks/useTreatmentEvidences';
import UploadEvidencesModal from './UploadEvidencesModal';

export default function TreatmentDetailEvidences({ patientId, treatmentId }) {
  const {
    evidences,
    loading: eviLoading,
    error: eviError,
    uploadEvidences,
    deleteEvidence,
  } = useTreatmentEvidences({ patientId, treatmentId });

  const [modalOpen, setModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  // Abre el modal de Swiper en la slide idx
  const openViewerAt = idx => {
    setStartIndex(idx);
    setViewerOpen(true);
  };

  // Pausa todos los vídeos activos en el Swiper
  const handleSlideChange = () => {
    document.querySelectorAll('.swiper-slide video').forEach(v => {
      v.pause();
    });
  };

  return (
    <Box mt={4}>
      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Evidencias</Typography>
        <Button variant="contained" onClick={() => setModalOpen(true)}>
          Subir fotos/videos
        </Button>
      </Box>

      {eviLoading && <CircularProgress sx={{ mt: 2 }} />}
      {eviError && <Alert severity="error" sx={{ mt: 2 }}>{eviError}</Alert>}

      {/* Miniaturas en grid horizontal */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mt: 2,
        }}
      >
        {evidences.map((ev, idx) => {
          const isVideo = /\.(mp4|webm|ogg)$/i.test(ev.file_url);
          return (
            <Box
              key={ev.id}
              onClick={() => openViewerAt(idx)}
              sx={{
                position: 'relative',
                width: 150,
                height: 150,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                bgcolor: 'background.paper',
              }}
            >
              {isVideo ? (
                <video
                  src={`${ev.file_url}#t=1`}
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  component="img"
                  src={ev.file_url}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <IconButton
                size="small"
                color="error"
                onClick={e => { e.stopPropagation(); deleteEvidence(ev.id); }}
                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* Modal de subida */}
      <UploadEvidencesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={uploadEvidences}
      />

      {/* Modal con Swiper */}
      <Modal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '90%',
            height: '90vh',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <IconButton
            onClick={() => setViewerOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon />
          </IconButton>
          <Swiper
            initialSlide={startIndex}
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            onSlideChange={handleSlideChange}
            style={{ width: '100%', height: '100%', backgroundColor: "black" }}
          >
            {evidences.map(ev => {
              const isVideo = /\.(mp4|webm|ogg)$/i.test(ev.file_url);
              if (isVideo) {
                return (
                  <SwiperSlide key={ev.id}>
                    <video
                      src={ev.file_url}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </SwiperSlide>
                );
              } else {
                return (
                  <SwiperSlide key={ev.id}>
                    <Box
                      component="img"
                      src={ev.file_url}
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </SwiperSlide>
                );
              }
            })}
          </Swiper>
        </Box>
      </Modal>
    </Box>
  );
}
