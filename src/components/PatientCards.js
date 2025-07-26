"use client"

import { Grid, Card, CardContent, Avatar, Typography, Box, Button, Chip, Paper } from "@mui/material"
import EditCalendarIcon from "@mui/icons-material/EditCalendar"
import PersonIcon from "@mui/icons-material/Person"
import PhoneIcon from "@mui/icons-material/Phone"
import EmailIcon from "@mui/icons-material/Email"
import { useRouter } from "next/navigation"
import { useRandomAvatar } from "../../lib/hooks/useRandomAvatar"
import { useMemo } from "react"

export default function PatientCards({ patients = [] }) {
  const router = useRouter()
  const randomAvatar = useRandomAvatar()

  const patientsWithAvatars = useMemo(
    () =>
      patients.map((patient) => ({
        ...patient,
        avatarUrl: patient.foto_perfil_url || randomAvatar,
      })),
    [patients, randomAvatar],
  )

  const handleNavigateToDetails = (patientId) => {
    router.push(`/pacientes/${patientId}`)
  }

  const handleNavigateToCitas = (patientId) => {
    router.push(`/pacientes/${patientId}/citas`)
  }

  if (patientsWithAvatars.length === 0) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 6,
          textAlign: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <PersonIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No se encontró ningún paciente.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Los pacientes aparecerán aquí cuando los agregues.
        </Typography>
      </Paper>
    )
  }

  return (
    <Grid container spacing={3} sx={{ p: 1 }}>
      {patientsWithAvatars.map((patient) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={patient.id}>
          <Card
          elevation={0}
            sx={{
              height: "100%",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
              border: "1px solid rgba(0,0,0,0.08)",
              "&:hover": {
                transform: "translateY(-8px) scale(1.02)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                "& .patient-avatar": {
                  transform: "scale(1.1)",
                },
                "& .patient-name": {
                  color: "primary.main",
                },
                "& .hover-overlay": {
                  opacity: 1,
                },
              },
            }}
            onClick={() => handleNavigateToDetails(patient.id)}
          >
            {/* Overlay de hover */}
            <Box
              className="hover-overlay"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(45deg, rgba(25,118,210,0.05) 0%, rgba(156,39,176,0.05) 100%)",
                opacity: 0,
                transition: "opacity 0.3s ease",
                zIndex: 1,
              }}
            />

            <CardContent sx={{ p: 3, position: "relative", zIndex: 2 }}>
              {/* Header con Avatar y Nombre */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Avatar
                  className="patient-avatar"
                  src={patient.avatarUrl}
                  alt={`${patient.nombre} ${patient.apellidos}`}
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    transition: "transform 0.3s ease",
                    border: "3px solid",
                    borderColor: "primary.main",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Typography
                  className="patient-name"
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    textAlign: "center",
                    transition: "color 0.3s ease",
                    lineHeight: 1.2,
                  }}
                >
                  {`${patient.nombre} ${patient.apellidos}`}
                </Typography>
              </Box>

              {/* Información de contacto */}
              <Box sx={{ mb: 3 }}>
                {/* Teléfono */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1.5,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "rgba(25,118,210,0.05)",
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 18, color: "primary.main", mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {patient.telefono || "N/A"}
                  </Typography>
                </Box>

                {/* Email */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "rgba(156,39,176,0.05)",
                  }}
                >
                  <EmailIcon sx={{ fontSize: 18, color: "secondary.main", mr: 1 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {patient.email || "N/A"}
                  </Typography>
                </Box>
              </Box>

              {/* Botón de citas */}
              <Button
                variant="contained"
                fullWidth
                startIcon={<EditCalendarIcon />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleNavigateToCitas(patient.id)
                }}
              >
                Ver citas
              </Button>
            </CardContent>

            {/* Indicador de estado (opcional) */}
            {/* <Chip
              label="Activo"
              size="small"
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                backgroundColor: "success.main",
                color: "white",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            /> */}
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
