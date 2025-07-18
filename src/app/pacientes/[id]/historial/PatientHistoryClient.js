// app/pacientes/[id]/historial/PatientHistoryClient.js
'use client'

import React, { useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  IconButton,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  Snackbar,
  Alert,
  CircularProgress,
  DialogTitle,
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import UploadFilesModal from '@/components/UploadFilesModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import useClinicalHistories from '../../../../../lib/hooks/useClinicalHistories'
import { useRandomAvatar } from '../../../../../lib/hooks/useRandomAvatar'
import { formatDate } from '../../../../../lib/utils/formatDate'
import useDeleteClinicalHistory from '../../../../../lib/hooks/useDeleteClinicalHistory'

export default function PatientHistoryClient({ patient, clinicalRecords }) {
  console.log(clinicalRecords)
  const defaultAvatar = useRandomAvatar()
  const patientId = patient.id

  // Hooks
  const {
    loading: historiesLoading,
    error: historiesError,
    fetchClinicalHistories,
    addClinicalHistory,
  } = useClinicalHistories(patientId)

  const {
    deleteClinicalHistory,
    loading: deleting,
    error: deleteError,
  } = useDeleteClinicalHistory(fetchClinicalHistories)

  // State UI
  const [isSaving,     setIsSaving]     = useState(false)
  const [showSuccess,  setShowSuccess]  = useState(false)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [toDelete,     setToDelete]     = useState(null)
  const [newDate,      setNewDate]      = useState('')
  const [newFiles,     setNewFiles]     = useState([])

  // Preview
  const [previewOpen,  setPreviewOpen]  = useState(false)
  const [previewFile,  setPreviewFile]  = useState(null)

  // Detail modal
  const [detailOpen,   setDetailOpen]   = useState(false)
  const [detailFile,   setDetailFile]   = useState(null)

  // Handlers
  const handleSave = async () => {
    if (!newDate || newFiles.length === 0) {
      alert('Fecha y archivos obligatorios')
      return
    }
    setIsSaving(true)
    try {
      await addClinicalHistory(newDate, newFiles)
      setShowSuccess(true)
      setModalOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setIsSaving(true)
    try {
      await deleteClinicalHistory(toDelete.id)
      setDeleteOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  // Agrupar por fecha en un nuevo objeto
  const groupedRecords = clinicalRecords.reduce((acc, rec) => {
    const day = rec.record_date.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(rec)
    return acc
  }, {})

  const patientName = `${patient.nombre} ${patient.apellidos}`.trim()
  const avatarUrl   = patient.foto_perfil_url || defaultAvatar

  if (historiesLoading) return <CircularProgress />
  if (historiesError)  return <Alert severity="error">{historiesError}</Alert>

  return (
    <>
      {/* Feedback mutaciones */}
      {(isSaving || deleting) && (
        <Dialog open>
          <DialogContent sx={{ textAlign: 'center', p: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>{isSaving ? 'Guardando...' : 'Eliminando...'}</Typography>
          </DialogContent>
        </Dialog>
      )}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success">Expediente guardado</Alert>
      </Snackbar>
      {deleteError && <Alert severity="error">{deleteError}</Alert>}

      {/* Grid de tarjetas */}
      <Box display="flex" flexWrap="wrap" gap={2} mt={4}>
        {Object.entries(groupedRecords).map(([date, recs]) => (
          <Card key={date} sx={{ width: { xs: '100%', md: '45%', lg: '30%' }, m: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar src={avatarUrl}/>
                <Typography ml={1}>{patientName}</Typography>
              </Box>
              <Typography fontWeight="bold">{formatDate(date)}</Typography>
              <Box mt={1}>
                {recs.map(rec => {
  const isPdf = rec.file_url.endsWith('.pdf')
  const fileName = rec.file_url.split('/').pop()

  return (
    <Box
      key={rec.id}
      mb={1}
      position="relative"
    >
      <Box>
      {isPdf ? (
        <Box
          onClick={() => {
            setPreviewFile({
              preview: rec.file_url,
              type: 'application/pdf',
              name: rec.file_url.split('/').pop(),
            });
            setPreviewOpen(true);
          }}
          sx={{ cursor: 'pointer' }}
        >
          <object
            data={rec.file_url}
            type="application/pdf"
            width="100%"
            height={100}
            style={{ pointerEvents: 'none' }}
          />
        </Box>

      ) : (
        
        <CardMedia
        onClick={() => {
                            setPreviewFile({
                              preview: rec.file_url,
                              type: isPdf ? 'application/pdf' : 'image/jpeg',
                              name: fileName,
                            })
                            setPreviewOpen(true)
                          }}
          component="img"
          src={rec.file_url}
          sx={{ height: 100, objectFit: 'cover' }}
        />
      )}
      </Box>

      <Box position="absolute" top={4} right={4} display="flex" gap={1} sx={{ backgroundColor: "#f2f2f2", paddingX: 1, borderRadius:1}}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => { setToDelete(rec); setDeleteOpen(true) }}
                        >
                          <DeleteForeverIcon fontSize="small"/>
                        </IconButton>
                        {/* Preview */}
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPreviewFile({
                              preview: rec.file_url,
                              type: isPdf ? 'application/pdf' : 'image/jpeg',
                              name: fileName,
                            })
                            setPreviewOpen(true)
                          }}
                        >
                          <VisibilityIcon color='primary' fontSize="small"/>
                        </IconButton>
      </Box>

      </Box>
            )
          })}
           </Box>
            </CardContent>
            <CardActions>
              <Button startIcon={<UploadFileIcon/>} onClick={() => setModalOpen(true)}>
                {recs.length ? 'Actualizar' : 'Subir'}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Modal de detalle */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)}>
        <DialogTitle>Detalles del archivo</DialogTitle>
        <DialogContent dividers>
          <Typography>Nombre: {detailFile?.file_url.split('/').pop()}</Typography>
          <Typography>Fecha del registro: {detailFile?.record_date.split('T')[0]}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de preview */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="xl"
      >
        <DialogActions>
          <Typography sx={{ flex: 1, pl: 2 }} fontWeight="bold">
            {previewFile?.name}
          </Typography>
          <IconButton onClick={() => setPreviewOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogActions>
        <DialogContent sx={{ height: '90vh', p: 0 }}>
          {previewFile?.type === 'application/pdf' ? (
            <iframe
              src={previewFile?.preview}
              title={previewFile.name}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        newRecordDate={newDate}
        setNewRecordDate={setNewDate}
        setNewRecordFiles={setNewFiles}
        handleSaveRecord={handleSave}
      />
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar expediente"
        description="¿Seguro que quieres eliminar este archivo?"
        onConfirm={handleDelete}
      />
    </>
  )
}