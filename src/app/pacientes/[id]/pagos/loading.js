import { Box, Skeleton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton variant="text" width="20%" height={50} />
      <Skeleton variant="text" width="20%" height={20} />
      <Skeleton variant="text" width="50%" height={50} sx={{ marginBottom: 4 }} />

      <Paper elevation={2} className="mb-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="rectangular" width={240} height={40} />
          <Skeleton variant="rectangular" width={120} height={40} />
        </div>

        <TableContainer>
          <Table aria-label="tabla de historial de pagos">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Tratamiento</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton variant="text" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Skeleton variant="rectangular" width={240} height={40} />
        </Box>
      </Paper>
    </div>
  )
}
