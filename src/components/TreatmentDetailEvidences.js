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
  Checkbox,
  Chip,
} from '@mui/material';
import { DeleteForever as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import useTreatmentEvidences from '../../lib/hooks/useTreatmentEvidences';
import UploadEvidencesModal from './UploadEvidencesModal';
import ImageIcon from '@mui/icons-material/Image';

export default function TreatmentDetailEvidences({ patientId, treatmentId }) {
  const {
    evidences,
    loading: eviLoading,
    error: eviError,
    uploadEvidences,
    deleteEvidence,
  } = useTreatmentEvidences({ patientId, treatmentId });

  console.log(evidences)

  const [modalOpen, setModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const openViewerAt = idx => {
    setStartIndex(idx);
    setViewerOpen(true);
  };

  const handleSlideChange = () => {
    document.querySelectorAll('.swiper-slide video').forEach(v => v.pause());
  };

  const toggleSelect = id => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const handleBulkDelete = async () => {
    for (let id of selectedIds) {
      await deleteEvidence(id);
    }
    setSelectedIds(new Set());
  };

  return (
    <Box mt={4}>
      <Divider sx={{ my: 4 }} />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Izquierda: título + chip + botón bulk */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
            <ImageIcon className="mr-1" />
          <Typography variant="h6" fontWeight="bold">
            Evidencias
          </Typography>
          <Chip
            label={evidences.length}
            color="primary"
            size="small"
            sx={{ fontWeight: 'bold', mr:4 }}
          />
          {selectedIds.size > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              sx={{
                fontWeight: 'bold',
                // para que no se comprima el texto en xs
                whiteSpace: 'nowrap',
              }}
            >
              Eliminar seleccionados ({selectedIds.size})
            </Button>
          )}
        </Box>

        {/* Derecha: subir fotos/videos */}
        <Button
          variant="contained"
          onClick={() => setModalOpen(true)}
          sx={{
            fontWeight: 'bold',
            mt: { xs: 1, sm: 0 },      // separación arriba en xs
            whiteSpace: 'nowrap',
          }}
        >
          Subir fotos/videos
        </Button>
      </Box>


      {eviLoading && <CircularProgress sx={{ mt: 2 }} />}
      {eviError && <Alert severity="error" sx={{ mt: 2 }}>{eviError}</Alert>}

      {evidences.length === 0 ? (
        <Typography sx={{ mt: 2 }} color="text.secondary">
          No hay evidencias guardadas
        </Typography>
      ) : (
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
                  width: { xs: 'calc(50% - 4px)', sm: 300 },
                  height: { xs: 150, sm: 300 },
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                }}
              >
                {/* selector */}
                <Checkbox
                  checked={selectedIds.has(ev.id)}
                  onClick={e => { e.stopPropagation(); toggleSelect(ev.id); }}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    bgcolor: 'rgba(255,255,255,0.7)',
                    zIndex: 2,
                  }}
                />
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
              </Box>
            );
          })}
        </Box>
      )}

      <UploadEvidencesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={uploadEvidences}
      />

      <Modal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            height: '100%',
            bgcolor: 'background.paper',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <IconButton
            onClick={() => setViewerOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            <CloseIcon />
          </IconButton>
          <Swiper
            initialSlide={startIndex}
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            loop
            onSlideChange={handleSlideChange}
            style={{ width: '100%', height: '100%', backgroundColor: 'black' }}
          >
            {evidences.map(ev => {
              const isVideo = /\.(mp4|webm|ogg)$/i.test(ev.file_url);
              return (
                <SwiperSlide key={ev.id}>
                  {isVideo ? (
                    <video
                      src={ev.file_url}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={ev.file_url}
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </Box>
      </Modal>
    </Box>
  );
}
