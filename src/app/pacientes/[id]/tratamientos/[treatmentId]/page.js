'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  Chip,
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
// import FilePresentOutlinedIcon from '@mui/icons-material/FilePresentOutlinedIcon'
import DescriptionIcon from '@mui/icons-material/Description';
import EmailIcon from '@mui/icons-material/Email'
import { ExpandMore } from '@mui/icons-material'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'

import SectionTitle               from '@/components/SectionTitle'
import UploadFilesModal          from '@/components/UploadFilesModal'
import FilePreviewModal          from '@/components/FilePreviewModal'
import UploadEvidencesModal      from '@/components/UploadEvidencesModal'
import TreatmentDetailEvidences  from '@/components/TreatmentDetailEvidences'
import { usePatient }            from '@/context/PatientContext'

import usePatientTreatments      from '../../../../../../lib/hooks/usePatientTreatments'
import useTreatmentDocuments     from '../../../../../../lib/hooks/useTreatmentDocuments'
import useEmailDocuments         from '../../../../../../lib/hooks/useEmailDocuments'
import { formatDate }            from '../../../../../../lib/utils/formatDate'

const DOCUMENT_TYPES = [
  { type: 'budget',       label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio de tratamiento' },
  { type: 'end_letter',   label: 'Carta finalización de tratamiento' },
]

export default function TreatmentDetailClient() {
  const { id, treatmentId } = useParams()
  const { patient, setPatient } = usePatient()
  const { alert: emailAlert, loadingLabels, sendDocuments, closeAlert } = useEmailDocuments()
  const { treatments } = usePatientTreatments(id)
  const {
    documents,
    loading,
    error,
    createDocument,
    deleteDocument,
    fetchDocuments
  } = useTreatmentDocuments(treatmentId)

  const [treatment, setTreatment]           = useState(null)
  const [isModalOpen, setIsModalOpen]       = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState('')
  const [newRecordDate, setNewRecordDate]   = useState('')
  const [newRecordFiles, setNewRecordFiles] = useState([])
  const [previewFile, setPreviewFile]       = useState(null)

  // cargar paciente en contexto
  useEffect(() => {
    if (!id) return
    if (patient?.id === Number(id)) return

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then(setPatient)
      .catch(err => {
        console.error('Error al cargar paciente:', err)
        alert('No se pudieron cargar los datos del paciente.')
      })
  }, [id, patient, setPatient])

  // seleccionar tratamiento actual
  useEffect(() => {
    if (!treatmentId || !treatments?.length) return
    const t = treatments.find(t => String(t.treatment_id) === treatmentId)
    setTreatment(t || null)
  }, [treatmentId, treatments])

  if (!treatment) return <CircularProgress />

  const handleOpenModal = type => {
    setSelectedDocumentType(type)
    setIsModalOpen(true)
  }

  const handleCloseModal = async () => {
    setIsModalOpen(false)
    setSelectedDocumentType('')
    setNewRecordDate('')
    setNewRecordFiles([])
    await fetchDocuments()
  }

  const handleSaveDocument = async () => {
    if (!newRecordDate || newRecordFiles.length === 0) {
      return alert('Por favor, completa todos los campos.')
    }
    const fd = new FormData()
    fd.append('created_at', newRecordDate)
    fd.append('document_type', selectedDocumentType)
    newRecordFiles.forEach(f => fd.append('file', f))

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/tratamientos/${treatmentId}/documentos`,
        { method: 'POST', body: fd }
      )
      if (!res.ok) throw new Error(await res.text())
      await handleCloseModal()
    } catch (err) {
      console.error('Error al guardar documento:', err)
      alert('No se pudieron guardar los documentos.')
    }
  }

  const handleDeleteDocument = async docId => {
    if (!confirm('¿Eliminar este documento?')) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/documentos/${docId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error(await res.text())
      await fetchDocuments()
    } catch (err) {
      console.error('Error al eliminar documento:', err)
      alert('No se pudo eliminar el documento.')
    }
  }

  const renderCard = (type, label) => {
    const docsOfType = documents.filter(d => d.document_type === type)
    const isEmailLoading = loadingLabels.has(label)

    return (
      <Card
        key={type}
        sx={{
          borderRadius: '10px',
          width: { xs: '100%', md: '40%', lg: '100%' },
          cursor: 'pointer',
          border: '2px solid transparent',
          '&:hover': { border: '2px solid #B2C6FB' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent>
            <Typography fontWeight="bold" gutterBottom>
              {label}
            </Typography>
            {treatment.service_date && (
              <Box display="flex" mt={1} mb={2}>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                  Fecha:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(treatment.service_date)}
                </Typography>
              </Box>
            )}
            {docsOfType.length > 0 ? (
              <Box display="flex" flexWrap="wrap" gap={1}>
                {docsOfType.map(doc => {
                  const isPdf = doc.file_url.endsWith('.pdf')
                  return (
                    <Box key={doc.id} position="relative" display="inline-block" width="100%">
                      {isPdf ? (
                        <Box
                          onClick={() =>
                            setPreviewFile({ preview: doc.file_url, type: 'application/pdf', name: doc.id })
                          }
                          sx={{ width: '100%', height: 100, borderRadius: 1, overflow: 'hidden', position: 'relative' }}
                        >
                          <object
                            data={doc.file_url}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                            style={{ pointerEvents: 'none', cursor: 'pointer' }}
                          />
                        </Box>
                      ) : (
                        <LightGallery selector="a" download={false}>
                          <a href={doc.file_url} data-src={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={doc.file_url}
                              alt={label}
                              style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                            />
                          </a>
                        </LightGallery>
                      )}
                      <IconButton
                        onClick={() => handleDeleteDocument(doc.id)}
                        color="error"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
                        }}
                      >
                        <DeleteForeverIcon />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No hay documentos
              </Typography>
            )}
          </CardContent>
          <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant={docsOfType.length > 0 ? 'outlined' : 'contained'} onClick={() => handleOpenModal(type)}>
              {docsOfType.length > 0 ? 'Actualizar' : 'Subir'}
            </Button>
            <Button
              variant="text"
              color="primary"
              startIcon={isEmailLoading ? <CircularProgress size={16} /> : <EmailIcon />}
              onClick={() =>
                sendDocuments({
                  to: patient.email,
                  docs: docsOfType.map(d => d.file_url),
                  label,
                  treatmentName: treatment.service_name,
                  patientName: patient.nombre,
                })
              }
              disabled={docsOfType.length === 0 || isEmailLoading}
              sx={{ cursor: 'pointer' }}
            >
              {isEmailLoading ? 'Enviando…' : 'Enviar por mail'}
            </Button>
          </CardActions>
        </Box>
      </Card>
    )
  }

  const formatCurrency = amount =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

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
        <Typography variant="h6">{formatCurrency(treatment.total_cost)}</Typography>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      <Accordion
        sx={{
          backgroundColor: '#F0F4FF',
          border: '2px solid transparent',
          '&:hover': { border: '2px solid #E8EFFF' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />} id="docs">
          <div className="flex items-center">
            <DescriptionIcon className="mr-1" />
            <Typography component="span" fontWeight="bold" variant="h6" mr={1}>
              Documentos
            </Typography>
            <Chip label={<span className="font-bold">{documents.length}</span>} color="primary" size="small" />
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            display="flex"
            gap={2}
            sx={{
              width: '100%',
              flexWrap: { xs: 'wrap', lg: 'nowrap' },
            }}
          >
            {DOCUMENT_TYPES.map(({ type, label }) => renderCard(type, label))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <TreatmentDetailEvidences patientId={id} treatmentId={treatmentId} />

      <UploadFilesModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={`Subir ${selectedDocumentType}`}
        newRecordDate={newRecordDate}
        setNewRecordDate={setNewRecordDate}
        setNewRecordFiles={setNewRecordFiles}
        handleSaveRecord={handleSaveDocument}
      />

      <FilePreviewModal open={Boolean(previewFile)} onClose={() => setPreviewFile(null)} file={previewFile} />

      <Snackbar open={emailAlert.open} autoHideDuration={4000} onClose={closeAlert} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeAlert} severity={emailAlert.severity} sx={{ width: '100%' }}>
          {emailAlert.message}
        </Alert>
      </Snackbar>
    </div>
  )
}
