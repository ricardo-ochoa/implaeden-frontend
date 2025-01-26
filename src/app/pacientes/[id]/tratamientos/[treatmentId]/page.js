'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import UploadFilesModal from '@/components/UploadFilesModal';
import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments';
import SectionTitle from '@/components/SectionTitle';
import { useParams } from 'next/navigation';
import { usePatient } from '@/context/PatientContext';

const DOCUMENT_TYPES = [
  { type: 'budget', label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio de tratamiento' },
  { type: 'end_letter', label: 'Carta finalización de tratamiento' },
];

export default function TreatmentDetail() {
  const { id, treatmentId } = useParams();
  const { patient, setPatient } = usePatient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordFiles, setNewRecordFiles] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const { documents, loading, error, createDocument, deleteDocument, fetchDocuments } =
    useTreatmentDocuments(treatmentId);

  useEffect(() => {
    if (!id) {
      console.error('El ID del paciente no está definido.');
      return;
    }

    const fetchPatient = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`);
        if (!response.ok) {
          throw new Error(`Error al obtener los datos del paciente: ${response.statusText}`);
        }
        const data = await response.json();
        setPatient(data); // Guarda los datos del paciente en el contexto
      } catch (err) {
        console.error('Error al obtener los datos del paciente:', err);
        alert('No se pudieron cargar los datos del paciente. Por favor, inténtalo nuevamente.');
      }
    };

    // Solo cargar datos si no están ya en el contexto o si el ID no coincide
    if (!patient || patient.id !== parseInt(id, 10)) {
      fetchPatient();
    }
  }, [id, patient, setPatient]);

  const handleOpenModal = (type) => {
    setSelectedDocumentType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setSelectedDocumentType('');
    setNewRecordDate('');
    setNewRecordFiles([]);
    await fetchDocuments(); // Refrescar documentos después de cerrar el modal
  };  

  const handleSaveDocument = async () => {
    if (!newRecordDate || newRecordFiles.length === 0) {
      alert('Por favor, completa todos los campos.');
      return;
    }
  
    const formData = new FormData();
    formData.append('created_at', newRecordDate);
    formData.append('document_type', selectedDocumentType);
  
    newRecordFiles.forEach((file) => {
      formData.append('file', file);
    });
  
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/tratamientos/${treatmentId}/documentos`,
        {
          method: 'POST',
          body: formData,
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta del servidor:', errorText);
        throw new Error(`Error al guardar el documento: ${response.statusText}`);
      }
  
      console.log('Documentos guardados exitosamente');
      await handleCloseModal(); // Refrescar datos
    } catch (error) {
      console.error('Error al guardar documentos:', error);
      alert('No se pudieron guardar los documentos. Por favor, inténtalo nuevamente.');
    }
  };
  

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
  
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/documentos/${documentId}`,
        {
          method: 'DELETE',
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta del servidor:', errorText);
        throw new Error(`Error al eliminar el documento: ${response.statusText}`);
      }
  
      console.log('Documento eliminado exitosamente');
      await fetchDocuments(); // Refrescar documentos después de eliminar
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      alert('No se pudo eliminar el documento. Por favor, inténtalo nuevamente.');
    }
  };  
  

const renderCard = (type, label) => {
  const filteredDocuments = documents.filter((doc) => doc.document_type === type);

  return (
    <Card
      key={type}
      sx={{
        borderRadius: '10px',
        width: { xs: '100%', md: '40%', lg: 300 },
        cursor: 'pointer',
        border: '2px solid transparent',
        '&:hover': {
          border: '2px solid #B2C6FB',
        },
      }}
    >
      <CardContent>
        <Typography fontWeight="bold">{label}</Typography>
        {filteredDocuments.length > 0 ? (
          <LightGallery selector="a" download={false}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {filteredDocuments.map((document) => (
                <Box key={document.id} position="relative" display="inline-block">
                  <a
                    data-src={document.file_url}
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {document.file_url.endsWith('.pdf') ? (
                      <PictureAsPdfIcon
                        sx={{
                          fontSize: 40,
                          cursor: 'pointer',
                          color: 'primary.main',
                          marginRight: '8px',
                        }}
                      />
                    ) : (
                      <img
                        src={document.file_url}
                        alt={label}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                    )}
                  </a>
                  <IconButton
                    onClick={() => handleDeleteDocument(document.id)}
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                    }}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </LightGallery>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No hay documentos
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Button variant={filteredDocuments.length > 0 ? 'outlined' : 'contained'} onClick={() => handleOpenModal(type)}>
          {filteredDocuments.length > 0 ? 'Actualizar' : 'Subir'}
        </Button>
      </CardActions>
    </Card>
  );
};


  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8">
      <SectionTitle
        title={`${patient?.nombre || 'Cargando...'} - Tratamiento`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: patient?.nombre || '', href: `/pacientes/${id}` },
          { label: 'Historial clínico', href: `/pacientes/${id}/historial` },
        ]}
      />
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <Box display="flex" gap={2} flexWrap="wrap">
        {DOCUMENT_TYPES.map(({ type, label }) => renderCard(type, label))}
      </Box>
      <UploadFilesModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={`Subir ${selectedDocumentType}`}
        newRecordDate={newRecordDate}
        setNewRecordDate={setNewRecordDate}
        setNewRecordFiles={setNewRecordFiles}
        handleSaveRecord={handleSaveDocument}
      />
    </div>
  );
}
