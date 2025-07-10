// src/app/pacientes/[id]/tratamientos/[treatmentId]/TreatmentDetailClient.js
'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, CardActions,
  Button, CircularProgress, Alert, IconButton, Snackbar,
  Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EmailIcon from '@mui/icons-material/Email'
import { ExpandMore } from '@mui/icons-material'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'

import SectionTitle from '@/components/SectionTitle'
import UploadFilesModal    from '@/components/UploadFilesModal'
import FilePreviewModal    from '@/components/FilePreviewModal'
import UploadEvidencesModal from '@/components/UploadEvidencesModal'
import TreatmentDetailEvidences from '@/components/TreatmentDetailEvidences'
import useEmailDocuments from '../../../../../../lib/hooks/useEmailDocuments'
import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments'
import { formatDate } from '../../../../../../lib/utils/formatDate'

const DOCUMENT_TYPES = [
  { type: 'budget',      label: 'Presupuesto' },
  { type: 'start_letter',label: 'Carta inicio' },
  { type: 'end_letter',  label: 'Carta fin' },
]

export default function TreatmentDetailClient({
  patient,
  treatment,
  initialDocuments
}) {
  // ——— LÓGICA CLIENT: hooks, modales, estados ———
  const { alert: emailAlert, loadingLabels, sendDocuments, closeAlert } = useEmailDocuments()
  const {
    documents,
    loading: docsLoading,
    error: docsError,
    createDocument,
    deleteDocument,
    fetchDocuments
  } = useTreatmentDocuments(treatment.treatment_id, initialDocuments)

  const [isModalOpen,          setIsModalOpen]          = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState('')
  const [newRecordDate,        setNewRecordDate]        = useState('')
  const [newRecordFiles,       setNewRecordFiles]       = useState([])
  const [previewFile,          setPreviewFile]          = useState(null)

  // Cuando cierras el modal recargas la lista
  const handleCloseModal = async () => {
    setIsModalOpen(false)
    setSelectedDocumentType('')
    setNewRecordDate('')
    setNewRecordFiles([])
    await fetchDocuments()
  }

  const handleSaveDocument = async () => {
    if (!newRecordDate || newRecordFiles.length === 0) {
      return alert('Completa fecha y archivos')
    }
    const fd = new FormData()
    fd.append('created_at', newRecordDate)
    fd.append('document_type', selectedDocumentType)
    newRecordFiles.forEach(f => fd.append('file', f))

    await createDocument(fd)
    await handleCloseModal()
  }

  const handleDeleteDocument = async (docId) => {
    if (!confirm('Eliminar documento?')) return
    await deleteDocument(docId)
    await fetchDocuments()
  }

  // Render de cada sección
  const renderCard = (type, label) => {
    const docsOfType = documents.filter(d => d.document_type === type)
    const isEmailLoading = loadingLabels.has(label)

    return (
      <Card key={type} sx={{ width: 300, m:1 }}>
        <CardContent>
          <Typography fontWeight="bold">{label}</Typography>
          <Typography variant="body2">Fecha: {formatDate(treatment.service_date)}</Typography>

          {docsOfType.length > 0
            ? docsOfType.map(doc => (
                <Box key={doc.id} position="relative" mb={1}>
                  {doc.file_url.endsWith('.pdf') 
                    ? <object data={doc.file_url} type="application/pdf" width="100%" height={100}/>
                    : <LightGallery selector="a"><a href={doc.file_url}><img src={doc.file_url} width="100%" height={100} style={{objectFit:'cover'}}/></a></LightGallery>
                  }
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteDocument(doc.id)}
                    sx={{ position:'absolute', top:0, right:0, background:'rgba(255,255,255,0.8)' }}
                  >
                    <DeleteForeverIcon fontSize="small" color="error"/>
                  </IconButton>
                </Box>
              ))
            : <Typography>No hay documentos</Typography>
          }
        </CardContent>
        <CardActions sx={{justifyContent:'space-between'}}>
          <Button
            variant={docsOfType.length>0?'outlined':'contained'}
            onClick={()=>{ setSelectedDocumentType(type); setIsModalOpen(true) }}
          >
            {docsOfType.length>0?'Actualizar':'Subir'}
          </Button>
          <Button
            startIcon={isEmailLoading ? <CircularProgress size={16}/> : <EmailIcon/>}
            disabled={!docsOfType.length || isEmailLoading}
            onClick={()=> sendDocuments({
              to: patient.email,
              docs: docsOfType.map(d=>d.file_url),
              label,
              treatmentName: treatment.service_name,
              patientName: patient.nombre
            })}
          >
            {isEmailLoading ? 'Enviando…' : 'Enviar mail'}
          </Button>
        </CardActions>
      </Card>
    )
  }

  return (
    <div className="px-8 py-6">
      <SectionTitle
        title={`${patient.nombre} — ${treatment.service_name}`}
        breadcrumbs={[
          { label:'Pacientes', href:'/pacientes' },
          { label:patient.nombre, href:`/pacientes/${patient.id}` },
          { label:'Tratamientos', href:`/pacientes/${patient.id}/tratamientos` },
        ]}
      />

      <Box mb={4}>
        <Typography>Costo del tratamiento: <b>{treatment.total_cost}</b></Typography>
      </Box>

      {docsLoading && <CircularProgress/>}
      {docsError   && <Alert severity="error">{docsError}</Alert>}

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore/>}>
          <Typography fontWeight="bold">Documentos ({documents.length})</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{display:'flex', flexWrap:'wrap'}}>
          {DOCUMENT_TYPES.map(d=>renderCard(d.type,d.label))}
        </AccordionDetails>
      </Accordion>

      <TreatmentDetailEvidences
        patientId={patient.id}
        treatmentId={treatment.treatment_id}
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
        onClose={()=>setPreviewFile(null)}
        file={previewFile}
      />

      <Snackbar open={emailAlert.open} autoHideDuration={4000} onClose={closeAlert}>
        <Alert severity={emailAlert.severity}>{emailAlert.message}</Alert>
      </Snackbar>
    </div>
  )
}
