/* eslint-disable @next/next/no-img-element */
'use client';

import { use, useEffect, useState } from 'react';
import { Avatar, Box, Button, Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import SectionTitle from '@/components/SectionTitle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import 'lightgallery/css/lightgallery.css';
import LightGallery from 'lightgallery/react';
import useClinicalHistories from '../../../../../lib/hooks/useClinicalHistories';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import FileUploadComponent from '@/components/FileUploadComponent';

export default function PatientDetail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;

  const { clinicalRecords, loading, fetchClinicalHistories } = useClinicalHistories(id);

  const [patient, setPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordFiles, setNewRecordFiles] = useState([]);
  const [pdfToPreview, setPdfToPreview] = useState(null);

  useEffect(() => {
    fetchClinicalHistories();
  }, [id]);

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
    const date = record.record_date.split('T')[0]; // Extraer solo la fecha (YYYY-MM-DD)
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const renderPdf = async (url) => {
    try {
      const canvas = document.getElementById('pdfCanvas');
      const pdf = await getDocument(url).promise;
      const page = await pdf.getPage(1); // Muestra la primera página
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: 1.5 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (err) {
      console.error('Error al renderizar el PDF:', err);
      setError('No se pudo cargar el PDF. Verifique el archivo.');
    }
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
    newRecordFiles.forEach((file) => formData.append('files', file)); // El nombre debe ser "files"

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clinical-histories/${id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al guardar el historial clínico.');
      const result = await response.json();
      fetchClinicalHistories();
      setIsModalOpen(false);
      setNewRecordDate('');
      setNewRecordFiles([]);
    } catch (err) {
      console.error('Error al guardar el historial clínico:', err);
      alert('Error al guardar el historial clínico.');
    }
  };
  

  const patientName = `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim();

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
        <Typography variant="h6">Historiales clínicos registrados:</Typography>

        {clinicalRecords.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Paciente</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Evidencias</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(groupedRecords).map(([date, records]) => (
                  <TableRow key={date}>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={patient?.foto_perfil_url} alt="Paciente" />
                      {patientName}
                    </TableCell>
                    <TableCell>{date}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {/* PDFs outside LightGallery */}
                        {records
                          .filter((record) => record.file_url.endsWith('.pdf'))
                          .map((record, index) => (
                            <a key={index} href={record.file_url} target="_blank" rel="noopener noreferrer">
                              <PictureAsPdfIcon
                                sx={{
                                  fontSize: 50,
                                  cursor: 'pointer',
                                  color: 'primary.main',
                                }}
                              />
                            </a>
                          ))}

                        {/* Images inside LightGallery */}
                        <LightGallery
  selector="a"
  download={false} // Disable download if you don't need it
>
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px', // Space between images
    }}
  >
    {records
      .filter((record) => !record.file_url.endsWith('.pdf'))
      .map((record, index) => (
        <a
          key={index}
          data-src={record.file_url} // Ensure data-src is present
          href={record.file_url} // Fallback for LightGallery
          style={{ display: 'inline-block' }} // Inline-block for proper spacing
        >
          <img
            src={record.file_url}
            alt="Evidencia"
            style={{
              maxWidth: '50px',
              maxHeight: '50px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          />
        </a>
      ))}
  </div>
</LightGallery>


                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Button variant="outlined" onClick={() => setIsModalOpen(true)} startIcon={<UploadFileIcon />}>
          Agregar nuevo historial
        </Button>
      </Box>

 {/* Modal para subir archivos */}
 <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90%',
            overflowY: 'auto',
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography
            id="modal-title"
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Nuevo historial clínico:
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: '550' }}>
            Fecha de registro:
          </Typography>
          <TextField
            placeholder="Fecha del registro"
            type="date"
            fullWidth
            value={newRecordDate}
            onChange={(e) => setNewRecordDate(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <FileUploadComponent
            onFileUpload={(files) => setNewRecordFiles(files)}
          />
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}
          >
            <Button variant="outlined" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSaveRecord} size="large" fullWidth sx={{ maxWidth: '300px' }}>
              Guardar
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
