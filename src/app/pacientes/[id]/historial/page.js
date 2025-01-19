/* eslint-disable @next/next/no-img-element */
'use client';
import { use, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import SectionTitle from '@/components/SectionTitle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useClinicalHistories from '../../../../../lib/hooks/useClinicalHistories';
import UploadFilesModal from '@/components/UploadFilesModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useRandomAvatar } from '../../../../../lib/hooks/useRandomAvatar';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import useDeleteClinicalHistory from '../../../../../lib/hooks/useDeleteClinicalHistory';

export default function PatientDetail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const { clinicalRecords, loading, fetchClinicalHistories } = useClinicalHistories(id);
  const { deleteClinicalHistory, loading: deleting, error } = useDeleteClinicalHistory(fetchClinicalHistories);

  const [patient, setPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordFiles, setNewRecordFiles] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);
  const defaultAvatar = useRandomAvatar();

  useEffect(() => {
    fetchClinicalHistories();
  }, [id]);

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    await deleteClinicalHistory(recordToDelete.id);
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`);
        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setPatient(data);
      } catch (err) {
        console.error('Error fetching patient:', err);
      }
    };

    if (id) fetchPatient();
  }, [id]);

  const groupedRecords = clinicalRecords.reduce((acc, record) => {
    const date = record.record_date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const handleMenuOpen = (event, record) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRecord(record);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRecord(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewRecordDate('');
    setNewRecordFiles([]);
  };

  const handleSaveRecord = async () => {
    if (!newRecordDate || newRecordFiles.length === 0) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const formData = new FormData();
    formData.append('record_date', newRecordDate);
    newRecordFiles.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clinical-histories/${id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al guardar el historial clínico.');

      await response.json();
      fetchClinicalHistories();
      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar el historial clínico:', err);
      alert('Error al guardar el historial clínico.');
    }
  };

  const patientName = `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim();

  const avatarUrl = patient?.foto_perfil_url
    ? `${patient.foto_perfil_url}`
    : defaultAvatar;

  const existRecords = clinicalRecords.length > 0;

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8">
      {loading ? (
        <Typography variant="h5" gutterBottom>
          Cargando...
        </Typography>
      ) : (
        <SectionTitle
          title={`${patientName} - Historial clínico`}
          breadcrumbs={[
            { label: 'Pacientes', href: '/pacientes' },
            { label: patientName, href: `/pacientes/${id}` },
            { label: 'Historial clínico', href: `/pacientes/${id}/historial` },
          ]}
        />
      )}

      <Box className="grid gap-4">
        {existRecords ? (
          <Typography variant="h6">Historiales clínicos registrados:</Typography>
        ) : (
          <Typography variant="h6">No hay historiales registrados:</Typography>
        )}

        <Box display="flex" flexWrap="wrap" gap={2}>
          {Object.entries(groupedRecords).map(([date, records]) => (
            <Card
              key={date}
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
                    <Avatar src={avatarUrl} alt="Paciente" />
                    <Typography variant="body1" fontWeight="bold">
                      {patientName}
                    </Typography>
                  </Box>
                  <IconButton onClick={(e) => handleMenuOpen(e, records[0])}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Box display="flex">
                  <Typography variant="body2" sx={{ fontWeight: 600, marginRight: 1 }}>
                    Fecha:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {date}
                  </Typography>
                </Box>
                <Box mt={2}>
                  {records
                    .filter((record) => record.file_url.endsWith('.pdf'))
                    .map((record, index) => (
                      <a
                        key={index}
                        href={record.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <PictureAsPdfIcon
                          sx={{
                            fontSize: 40,
                            cursor: 'pointer',
                            color: 'primary.main',
                            marginRight: '8px',
                          }}
                        />
                      </a>
                    ))}

                  <LightGallery selector="a" download={false}>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {records
                        .filter((record) => !record.file_url.endsWith('.pdf'))
                        .map((record, index) => (
                          <a
                            key={index}
                            data-src={record.file_url}
                            href={record.file_url}
                          >
                            <CardMedia
                              component="img"
                              image={record.file_url}
                              alt="Evidencia"
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            />
                          </a>
                        ))}
                    </Box>
                  </LightGallery>
                </Box>
              </CardContent>
            </Card>
          ))}

          <Button
            sx={{ width: { xs: '100%', md: '40%', lg: 300 } }}
            variant="outlined"
            onClick={() => setIsModalOpen(true)}
            startIcon={<UploadFileIcon />}
          >
            Agregar nuevo historial
          </Button>
        </Box>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {}}> <ShareIcon sx={{ mr: 1}} color='info'/> Compartir</MenuItem>
        <MenuItem
          onClick={() => {
            setRecordToDelete(menuRecord);
            setIsDeleteModalOpen(true);
            handleMenuClose();
          }}
        >
        <DeleteForeverIcon sx={{ mr: 1}} color='error'/>  Eliminar
        </MenuItem>
      </Menu>

      <UploadFilesModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Nuevo historial clínico:"
        newRecordDate={newRecordDate}
        setNewRecordDate={setNewRecordDate}
        setNewRecordFiles={setNewRecordFiles}
        handleSaveRecord={handleSaveRecord}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        title="Eliminar historial clínico"
        description="¿Estás seguro de que quieres eliminar este historial? Esta acción no se puede deshacer."
        onConfirm={handleDeleteRecord}
      />
    </div>
  );
}
