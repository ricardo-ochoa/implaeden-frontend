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
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
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
import EmailIcon from '@mui/icons-material/Email';
import FilePreviewModal from '@/components/FilePreviewModal';
import { formatDate } from '../../../../../../lib/utils/formatDate';
import useEmailDocuments from '../../../../../../lib/hooks/useEmailDocuments';
import { ExpandMore } from '@mui/icons-material';
import UploadEvidencesModal from '@/components/UploadEvidencesModal';
import FilePresentOutlinedIcon from '@mui/icons-material/FilePresentOutlined';
import TreatmentDetailEvidences from '@/components/TreatmentDetailEvidences';

const DOCUMENT_TYPES = [
  { type: 'budget', label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio de tratamiento' },
  { type: 'end_letter', label: 'Carta finalización de tratamiento' },
];

export default function TreatmentDetail() {
  const { id, treatmentId } = useParams();
  const { patient, setPatient } = usePatient();
  const { alert: emailAlert, loadingLabels, sendDocuments, closeAlert } = useEmailDocuments();
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
    const current = treatments.find((t) => t.treatment_id === parseInt(treatmentId, 10));
    setTreatment(current);
  }, [treatmentId, treatments]);

  if (!treatment) return <CircularProgress />;

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
    const isEmailLoading = loadingLabels.has(label);
  
    return (
      <Card
        key={type}
        display="flex"
        sx={{
          borderRadius: '10px',
          width: { xs: '100%', md: '40%', lg: "100%" },
          cursor: 'pointer',
          border: '2px solid transparent',
          '&:hover': {
            border: '2px solid #B2C6FB',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                  <Box key={document.id} position="relative" display="inline-block" width="100%">
                    {isPdf ? (
                      // thumbnail PDF clickeable
                    <Box
                    onClick={() => setPreviewFile({
                      preview: document.file_url,
                      type: 'application/pdf',
                      name: document.id
                      })}
                        sx={{
                          width: "100%",
                          height: 100,
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <object
                          data={document.file_url}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                          style={{ pointerEvents: 'none', cursor: 'pointer'}}
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
                              width: "100%",
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
        <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant={filteredDocuments.length > 0 ? 'outlined' : 'contained'}
          onClick={() => handleOpenModal(type)}
        >
          {filteredDocuments.length > 0 ? 'Actualizar' : 'Subir'}
        </Button>

        {/* Botón de enviar por email */}
        <Button
          variant="text"
          color="primary"
          startIcon={ isEmailLoading
            ? <CircularProgress size={16} />
            : <EmailIcon />
          }
          onClick={() =>
            sendDocuments({
              to: patient.email,
              docs: filteredDocuments.map(d => d.file_url),
              label,
              treatmentName: treatment?.service_name,
              patientName: patient?.nombre
            })
          }
          disabled={filteredDocuments.length === 0 || isEmailLoading}
          sx={{ cursor:"pointer"}}
        >
           { isEmailLoading ? 'Enviando…' : 'Enviar por mail' }
        </Button>
        </CardActions>
        </Box>
      </Card>
    );
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);


  return (
    <div className="px-10 py-10">
      <SectionTitle
        title={`${patient?.nombre || 'Cargando...'} - ${treatment?.service_name || 'Tratamiento'}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: patient?.nombre || '', href: `/pacientes/${id}` },
          { label: 'Tratamientos', href: `/pacientes/${id}/tratamientos` },
        ]}
      />

      <Box display="flex" alignItems="center" mb={3}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
          Costo del tratamiento:
        </Typography>
        <Typography variant="h6">
          {formatCurrency(treatment.total_cost)}
        </Typography>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      <Accordion
        sx={{
          backgroundColor: "#F0F4FF",
          border: '2px solid transparent',
          '&:hover': {
            border: '2px solid #E8EFFF',
          },
        }}
      >
      <AccordionSummary
          expandIcon={<ExpandMore />}
          id="docs"
        >
           <div className='flex items-center'>
            <FilePresentOutlinedIcon className='mr-1'/>
            <Typography component="span" fontWeight={"bold"} variant="h6" mr={1}> Documentos</Typography>
            <Chip label={<span className='font-bold'>{documents.length}</span>} color="primary" size="small"/>
           </div>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" gap={2} sx={{
            width: '100%',
            flexWrap: {
              xs: 'wrap',
              lg: 'nowrap',
            },
          }}>
            {DOCUMENT_TYPES.map(({ type, label }) => renderCard(type, label))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <TreatmentDetailEvidences
        patientId={id}
        treatmentId={treatmentId}
      />

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

      <Snackbar
          open={emailAlert.open}
          autoHideDuration={4000}
          onClose={closeAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={closeAlert}
            severity={emailAlert.severity}
            sx={{ width: '100%' }}
          >
            {emailAlert.message}
          </Alert>
        </Snackbar>

    </div>
  );
}
