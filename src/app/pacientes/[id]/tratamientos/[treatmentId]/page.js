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
  Modal,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import UploadFilesModal from '@/components/UploadFilesModal';
import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments';
import SectionTitle from '@/components/SectionTitle';
import { useParams } from 'next/navigation';
import { usePatient } from '@/context/PatientContext';
import usePatientTreatments from '../../../../../../lib/hooks/usePatientTreatments';
import CloseIcon from '@mui/icons-material/Close';
import FilePreviewModal from '@/components/FilePreviewModal';
import { formatDate } from '../../../../../../lib/utils/formatDate';

const DOCUMENT_TYPES = [
  { type: 'budget', label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio de tratamiento' },
  { type: 'end_letter', label: 'Carta finalización de tratamiento' },
];

export default function TreatmentDetail() {
  const { id, treatmentId } = useParams();
  const { patient, setPatient } = usePatient();
  const { treatments } = usePatientTreatments(id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordFiles, setNewRecordFiles] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const { documents, loading, error, createDocument, deleteDocument, fetchDocuments } =
    useTreatmentDocuments(treatmentId);
  const [treatment, setTreatment] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);


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

  useEffect(() => {
    if (!treatmentId || !treatments.length) return;
  
    const current = treatments.find(t => t.treatment_id === parseInt(treatmentId));
    setTreatment(current);
  }, [treatmentId, treatments]);  

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
          <Typography fontWeight="bold" gutterBottom>
            {label}
          </Typography>
          {treatment?.service_date && (
            <Box display="flex" mt={1} mb={2}>
              <Typography variant="body2" sx={{ fontWeight: 600, marginRight: 1 }}>
                Fecha:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(treatment.service_date)}
              </Typography>
            </Box>
          )}
          {/* Files */}
          {filteredDocuments.length > 0 ? (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {filteredDocuments.map((document) => {
                const isPdf = document.file_url.endsWith('.pdf');
                return (
                  <Box key={document.id} position="relative" display="inline-block">
                    {isPdf ? (
                      // thumbnail PDF clickeable
                    <Box
                    onClick={() => setPreviewFile({
                      preview: document.file_url,
                      type: 'application/pdf',
                      name: document.id
                      })}
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <object
                          data={document.file_url}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                          style={{ pointerEvents: 'none' }}
                        />
                      </Box>
                    ) : (
                      // imágenes dentro de LightGallery
                      <LightGallery selector="a" download={false}>
                        <a
                          data-src={document.file_url}
                          href={document.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={document.file_url}
                            alt={label}
                            style={{
                              width: 100,
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                        </a>
                      </LightGallery>
                    )}
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
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No hay documentos
            </Typography>
          )}
        </CardContent>
        <CardActions>
          <Button
            variant={filteredDocuments.length > 0 ? 'outlined' : 'contained'}
            onClick={() => handleOpenModal(type)}
          >
            {filteredDocuments.length > 0 ? 'Actualizar' : 'Subir'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8">
      <SectionTitle
        title={`${patient?.nombre || 'Cargando...'} - ${treatment?.service_name || 'Tratamiento'}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: patient?.nombre || '', href: `/pacientes/${id}` },
          { label: 'Tratamientos', href: `/pacientes/${id}/tratamientos` },
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

      <FilePreviewModal
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
