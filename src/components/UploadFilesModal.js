import React, { useState } from 'react';
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography
} from '@mui/material';
import FileUploadComponent from '@/components/FileUploadComponent';

const UploadFilesModal = ({
  open,
  onClose,
  title = "Nuevo historial clínico:",
  newRecordDate,
  setNewRecordDate,
  setNewRecordFiles,
  handleSaveRecord
}) => {
  const [filesUploaded, setFilesUploaded] = useState([]);

  const isSaveDisabled = !newRecordDate || filesUploaded.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
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
        <Typography id="modal-title" variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
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
        <FileUploadComponent onFileUpload={(files) => {
          setNewRecordFiles(files);
          setFilesUploaded(files);
        }} />
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}
        >
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRecord}
            size="large"
            fullWidth
            sx={{ maxWidth: '300px' }}
            disabled={isSaveDisabled}
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UploadFilesModal;
