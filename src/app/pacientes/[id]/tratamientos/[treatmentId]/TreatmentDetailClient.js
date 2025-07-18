// src/app/pacientes/[id]/tratamientos/[treatmentId]/TreatmentDetailClient.js
'use client'

import React, { useState } from 'react'
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
import CloseIcon from '@mui/icons-material/Close'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EmailIcon from '@mui/icons-material/Email'
import DescriptionIcon from '@mui/icons-material/Description'
import { ExpandMore } from '@mui/icons-material'

import SectionTitle from '@/components/SectionTitle'
import UploadFilesModal from '@/components/UploadFilesModal'
import FilePreviewModal from '@/components/FilePreviewModal'
import TreatmentDetailEvidences from '@/components/TreatmentDetailEvidences'

import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments'
import useEmailDocuments    from '../../../../../../lib/hooks/useEmailDocuments'
import { formatDate }       from '../../../../../../lib/utils/formatDate'
import { useRandomAvatar } from '../../../../../../lib/hooks/useRandomAvatar'

const DOCUMENT_TYPES = [
  { type: 'budget',       label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio'  },
  { type: 'end_letter',   label: 'Carta fin'     },
]

export default function TreatmentDetailClient({
  paciente,      // viene del ServerComponent
  tratamiento,    // viene del ServerComponent
}) {
  const defaultAvatar = useRandomAvatar()

  // aquí ya no usamos useParams ni context de paciente

  console.log(paciente)

  // hook para traer / CRUD documentos
  const {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    deleteDocument,
  } = useTreatmentDocuments(tratamiento?.treatment_id)

  // hook para enviar por email
  const {
    alert: emailAlert,
    loadingLabels,
    sendDocuments,
    closeAlert
  } = useEmailDocuments()

  // UI local
  const [isModalOpen, setIsModalOpen]     = useState(false)
  const [selectedDocType, setSelectedType] = useState('')
  const [newDate, setNewDate]             = useState('')
  const [newFiles, setNewFiles]           = useState([])
  const [previewFile, setPreviewFile]     = useState(null)

  const handleOpenModal = type => {
    setSelectedType(type)
    setIsModalOpen(true)
  }
  const handleCloseModal = async () => {
    setIsModalOpen(false)
    setSelectedType('')
    setNewDate('')
    setNewFiles([])
    await fetchDocuments()
  }

  const handleSaveDocument = async () => {
    if (!newDate || newFiles.length === 0) {
      alert('Fecha y archivos obligatorios')
      return
    }
    const fd = new FormData()
    fd.append('created_at', newDate)
    fd.append('document_type', selectedDocType)
    newFiles.forEach(f => fd.append('file', f))
    await createDocument(fd)
    await handleCloseModal()
  }

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este documento?')) return
    await deleteDocument(id)
    await fetchDocuments()
  }

  const renderCard = ({ type, label }) => {
    const docs = documents.filter(d => d.document_type === type)
    const isEmailLoading = loadingLabels.has(label)
    return (
      <Card key={type}
      sx={{
        borderRadius: 1,
        border: "2px solid transparent",
        "&:hover": { borderColor: "#B2C6FB" },
        width: { xs: "100%", lg: "32%" },
      }}>
        <CardContent>
          <Typography fontWeight="bold">{label}</Typography>
          {tratamiento?.service_date && (
            <Box display="flex" mt={1}>
              <Typography variant="body2" fontWeight={600} mr={1}>
                Fecha:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(tratamiento?.service_date)}
              </Typography>
            </Box>
          )}
          {docs.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={1} mt={2}>
              {docs.map(doc => {
                const isPdf = doc.file_url.endsWith('.pdf')
                const fileName = doc.file_url.split('/').pop()
                return (
                  <Box key={doc.id} position="relative">
                    <Box
                      onClick={() =>
                        setPreviewFile({
                          preview: doc.file_url,
                          type: isPdf ? 'application/pdf' : 'image/jpeg',
                          name: fileName,
                        })
                      }
                      sx={{
                        width: '100%',
                        height: 100,
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      {isPdf ? (
                        <object
                          data={doc.file_url}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                        />
                      ) : (
                        <img
                          src={doc.file_url}
                          alt={label}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 4,
                          }}
                        />
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(doc.id)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Box>
                )
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary" mt={2}>
              No hay documentos
            </Typography>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button variant={docs.length > 0 ? 'outlined' : 'contained'}
            onClick={() => handleOpenModal(type)}
          >
            {docs.length > 0 ? 'Actualizar' : 'Subir'}
          </Button>
          <Button
            startIcon={isEmailLoading ? <CircularProgress size={16} /> : <EmailIcon />}
            onClick={() =>
              sendDocuments({
                to: paciente.email,
                docs: docs.map(d => d.file_url),
                label,
                treatmentName: tratamiento?.service_name,
                patientName: tratamiento.nombre,
              })
            }
            disabled={docs.length===0 || isEmailLoading}
          >
            {isEmailLoading ? 'Enviando…' : 'Enviar por mail'}
          </Button>
        </CardActions>
      </Card>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Typography fontWeight={600} mr={1}>Costo del tratamiento:</Typography>
        <Typography variant="h6">
          {new Intl.NumberFormat('es-MX',{ style:'currency',currency:'MXN' })
            .format(tratamiento?.total_cost)}
        </Typography>
      </Box>

      {loading && <CircularProgress />}
      {error   && <Alert severity="error">{error}</Alert>}

<Accordion sx={{ mb: 2, backgroundColor: "#E8EFFF" }}>
  <AccordionSummary expandIcon={<ExpandMore />}>
    <DescriptionIcon sx={{ mr: 1 }} />
    <Typography fontWeight="bold">
      Documentos ({documents.length})
    </Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        // en pantallas muy pequeñas, columnas; desde sm en fila
        flexDirection: { xs: "column", sm: "row" },
        // opcional: centra en xs
        alignItems: { xs: "stretch", sm: "flex-start" },
        justifyContent:"space-between"
      }}
    >
      {DOCUMENT_TYPES.map((type) =>
        renderCard(type, {
          // añade en el renderCard un sx para controlar el ancho de cada tarjeta
          width: { xs: "100%", sm: "40%", lg: "33%" },
        })
      )}
    </Box>
  </AccordionDetails>
</Accordion>


      {/* evidencias adicionales */}
      <TreatmentDetailEvidences
        patientId={paciente.id}
        treatmentId={tratamiento?.treatment_id}
      />

      <UploadFilesModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={`Subir ${selectedDocType}`}
        newRecordDate={newDate}
        setNewRecordDate={setNewDate}
        setNewRecordFiles={setNewFiles}
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
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}
      >
        <Alert onClose={closeAlert} severity={emailAlert.severity}>
          {emailAlert.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
