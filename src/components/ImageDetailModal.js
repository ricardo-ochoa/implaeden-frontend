import React from 'react';
import { Modal, Box, Avatar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ImageDetailModal = ({ open, onClose, imageUrl, altText }) => {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="image-modal">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          outline: 'none',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <IconButton
          onClick={onClose}
          size='large'
          sx={{ position: 'absolute', top: 330, right: 130, zIndex: 2, color: "white" }}
        >
          <CloseIcon />
        </IconButton>
        <Avatar
          src={imageUrl}
          alt={altText}
          sx={{
            width: 300,
            height: 300,
            mx: 'auto',
            boxShadow: `
              0 0 0 4px #F5F7FB,
              0 0 0 8px #B2C6FB
            `,
          }}
        />
      </Box>
    </Modal>
  );
};

export default ImageDetailModal;
