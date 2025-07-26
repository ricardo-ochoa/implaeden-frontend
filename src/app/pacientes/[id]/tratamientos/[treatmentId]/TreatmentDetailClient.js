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
  TextField,
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
import EditIcon from '@mui/icons-material/Edit' // NUEVO
import CheckIcon from '@mui/icons-material/Check' // NUEVO

const DOCUMENT_TYPES = [
  { type: 'budget',       label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio'  },
  { type: 'end_letter',   label: 'Carta fin'     },
]

export default function TreatmentDetailClient({
  paciente,      // viene del ServerComponent
  tratamiento: initialTratamiento,    // viene del ServerComponent
}) {

  const [tratamiento, setTratamiento] = useState(initialTratamiento);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [editableCost, setEditableCost] = useState(tratamiento?.total_cost || 0);
  const [isSavingCost, setIsSavingCost] = useState(false);
  const [costAlert, setCostAlert] = useState({ open: false, message: '', severity: 'success' });


  // hook para traer / CRUD documentos
 const {
    documents,
    loading,
    error,
    isUpdating, // Se usa en lugar de isSavingCost
    fetchDocuments,
    createDocument,
    deleteDocument,
    updateCost, // Se importa la nueva función
  } = useTreatmentDocuments(paciente.id, tratamiento?.treatment_id)

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

  const handleUpdateCost = async () => {
    const success = await updateCost(editableCost);

    if (success) {
      // Si el hook confirma el éxito, actualizamos la UI
      setTratamiento(prev => ({ ...prev, total_cost: parseFloat(editableCost) }));
      setIsEditingCost(false);
      setCostAlert({ open: true, message: 'Costo actualizado exitosamente.', severity: 'success' });
    } else {
      // Si el hook reporta un error, mostramos la alerta con el error del hook
      setCostAlert({ open: true, message: error || 'Ocurrió un error.', severity: 'error' });
    }
  };

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

  console.log(documents)

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
          
          {/* La lógica de la fecha ahora está dentro de la comprobación de `docs` */}
          {docs.length > 0 ? (
            <>
              {/* SE MUESTRA LA FECHA DEL DOCUMENTO */}
              <Box display="flex" mt={1}>
                <Typography variant="body2" fontWeight={600} mr={1}>
                  Fecha:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(docs[0].created_at)}
                </Typography>
              </Box>
              
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
                          style={{ pointerEvents: 'none', cursor: 'pointer' }}
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
            </>
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
    )}

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Typography fontWeight={600} mr={1}>Costo del tratamiento:</Typography>
        
       {isEditingCost ? (
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              type="number"
              size="small"
              variant="outlined"
              value={editableCost}
              onChange={(e) => setEditableCost(e.target.value)}
              disabled={isUpdating} 
              sx={{ width: '120px' }}
            />
            <IconButton onClick={handleUpdateCost} color="primary" disabled={isUpdating}>
              {isUpdating ? <CircularProgress size={20} /> : <CheckIcon />}
            </IconButton>
            <IconButton onClick={() => setIsEditingCost(false)} disabled={isUpdating}>
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              cursor: 'pointer',
              '& .edit-icon-button': {
                visibility: 'hidden',
                opacity: 0,
                transition: 'opacity 0.2s',
              },
              '&:hover .edit-icon-button': {
                visibility: 'visible',
                opacity: 1,
              },
            }}
          >
            <Typography variant="h6">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
                .format(tratamiento?.total_cost)}
            </Typography>
            
            {/* Se añade una clase para poder seleccionarlo con CSS */}
            <IconButton
              className="edit-icon-button"
              onClick={() => setIsEditingCost(true)}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
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

      <Snackbar
      open={costAlert.open}
      autoHideDuration={4000}
      onClose={() => setCostAlert(prev => ({ ...prev, open: false }))}
      anchorOrigin={{ vertical:'bottom', horizontal:'center' }}
    >
      <Alert onClose={() => setCostAlert(prev => ({ ...prev, open: false }))} severity={costAlert.severity} sx={{ width: '100%' }}>
        {costAlert.message}
      </Alert>
    </Snackbar>
    </Box>
  )
}
