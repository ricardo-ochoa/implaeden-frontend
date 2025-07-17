'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ShareIcon from '@mui/icons-material/Share';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import SectionTitle from '@/components/SectionTitle';
import UploadFilesModal from '@/components/UploadFilesModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import api from '../../../../../lib/api';
import useClinicalHistories from '../../../../../lib/hooks/useClinicalHistories';
import useDeleteClinicalHistory from '../../../../../lib/hooks/useDeleteClinicalHistory';
import { useRandomAvatar } from '../../../../../lib/hooks/useRandomAvatar';
import { formatDate } from '../../../../../lib/utils/formatDate';

export default function PatientHistoryPage() {
  const { id: patientId } = useParams();
  const defaultAvatar = useRandomAvatar();

  const {
    clinicalRecords,
    loading: historiesLoading,
    error: historiesError,
    fetchClinicalHistories,
    addClinicalHistory,
  } = useClinicalHistories(patientId);

  const {
    deleteClinicalHistory,
    loading: deleting,
    error: deleteError,
  } = useDeleteClinicalHistory(fetchClinicalHistories);

  const [patient, setPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordFiles, setNewRecordFiles] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);

  // preview
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (patientId) fetchClinicalHistories();
  }, [patientId, fetchClinicalHistories]);

  useEffect(() => {
    async function loadPatient() {
      const { data } = await api.get(`/pacientes/${patientId}`);
      setPatient(data);
    }
    if (patientId) loadPatient();
  }, [patientId]);

  const patientName = `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim();
  const avatarUrl = patient?.foto_perfil_url || defaultAvatar;

  // Agrupar por fecha
  const groupedRecords = clinicalRecords.reduce((acc, rec) => {
    const date = rec.record_date.split('T')[0];
    acc[date] = acc[date] || [];
    acc[date].push(rec);
    return acc;
  }, {});

  // Helper para renderizar cada Card
  const renderHistoryCard = (date, records) => {
    return (
      <Card
        key={date}
        sx={{
          borderRadius: 2,
          width: { xs: '100%', md: '45%', lg: '30%' },
          border: '2px solid transparent',
          '&:hover': { border: '2px solid #B2C6FB' },
          cursor: 'pointer',
        }}
      >
        <CardContent>
          {/* Avatares y nombre */}
          <Box display="flex" alignItems="center" mb={2} gap={1}>
            <Avatar src={avatarUrl} />
            <Typography>{patientName}</Typography>
          </Box>
          {/* Título: fecha */}
          <Typography fontWeight="bold" gutterBottom>
            Expediente fecha: {formatDate(date)}
          </Typography>
          {/* Thumbnails */}
          <Box display="flex" flexDirection="column" gap={1}>
            {records.map(rec => {
              const isPdf = rec.file_url.endsWith('.pdf');
              return (
                <Box
                  key={rec.id}
                  position="relative"
                  onClick={() => {
                    setPreviewOpen(true);
                    setPreviewFile({
                      preview: rec.file_url,
                      type: isPdf ? 'application/pdf' : 'image/jpeg',
                      name: `hist-${rec.id}`,
                    });
                  }}
                  sx={{
                    width: '100%',
                    height: isPdf ? 120 : 80,
                    overflow: 'hidden',
                    borderRadius: 1,
                    cursor: "pointer",
                  }}
                >
                  {isPdf ? (
                    <object
                      data={rec.file_url}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      style={{ pointerEvents: 'none' }}
                    />
                  ) : (
                    <CardMedia
                      component="img"
                      src={rec.file_url}
                      alt="Evidencia"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <IconButton
                    onClick={e => {
                      e.stopPropagation();
                      setRecordToDelete(rec);
                      setIsDeleteModalOpen(true);
                    }}
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button
            variant={records.length > 0 ? 'outlined' : 'contained'}
            startIcon={<UploadFileIcon />}
            onClick={() => setIsModalOpen(true)}
          >
            {records.length > 0 ? 'Actualizar' : 'Subir'}
          </Button>
          {/* 
          <IconButton color="primary">
            <ShareIcon />
          </IconButton> */}
        </CardActions>
      </Card>
    );
  };

  return (
    <Box className="container mx-auto px-4 py-8">
      {/* Carga y alertas */}
      <Dialog open={isSaving}>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Cargando documento…</Typography>
        </DialogContent>
      </Dialog>
      <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            Expediente guardado
          </Alert>
        </Snackbar>

      {/* Título */}
      {historiesLoading ? (
        <CircularProgress />
      ) : (
        <SectionTitle
          title={`${patientName} — Historial clínico`}
          breadcrumbs={[
            { label: 'Pacientes', href: '/pacientes' },
            { label: patientName, href: `/pacientes/${patientId}` },
            { label: 'Historial clínico' },
          ]}
        />
      )}
      {(historiesError || deleteError) && (
        <Alert severity="error">{historiesError || deleteError}</Alert>
      )}

      {/* Grid de Cards */}
      <Box display="flex" flexWrap="wrap" gap={2} mt={4}>
        {Object.entries(groupedRecords).map(([date, recs]) =>
          renderHistoryCard(date, recs)
        )}
      </Box>

      {/* Dialog de preview */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="xl">
        <DialogActions>
          <IconButton onClick={() => setPreviewOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogActions>
        <DialogContent sx={{ height: '80vh', p: 0 }}>
          {previewFile?.type === 'application/pdf' ? (
            <iframe
              src={previewFile?.preview}
              title={previewFile?.name}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : (
            <Box
              component="img"
              src={previewFile?.preview}
              alt={previewFile?.name}
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modales de subir y eliminar */}
      <UploadFilesModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Historial Clínico"
        newRecordDate={newRecordDate}
        setNewRecordDate={setNewRecordDate}
        setNewRecordFiles={setNewRecordFiles}
        handleSaveRecord={async () => {
          if (!newRecordDate || !newRecordFiles.length) return alert('Fecha y archivos obligatorios');
          setIsSaving(true);
          await addClinicalHistory(newRecordDate, newRecordFiles);
          setShowSuccess(true);
          setIsSaving(false);
          setIsModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar documento"
        description="¿Seguro que quieres eliminar este archivo?"
        onConfirm={async () => {
          await deleteClinicalHistory(recordToDelete.id);
          setIsDeleteModalOpen(false);
        }}
      />
    </Box>
  );
}
