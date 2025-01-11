'use client';

import { Box, Pagination } from '@mui/material';

export default function PaginationControl({ page, onPageChange, totalPages }) {
  return (
    <Box className="flex justify-center mt-4">
      <Pagination
        count={totalPages}
        page={page}
        onChange={onPageChange}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
}
