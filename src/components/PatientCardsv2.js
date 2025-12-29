"use client";

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Snackbar,
  Alert,
  useMediaQuery,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import SummarizeIcon from "@mui/icons-material/VoiceChat";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import theme from "@/theme";
import { useRandomAvatar } from "../../lib/hooks/useRandomAvatar";
import SmartSummaryAssistant from "@/components/SmartSummaryAssistant";

export default function PatientCards({ patients = [] }) {
  const router = useRouter();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const patientsWithAvatars = useMemo(
    () =>
      patients.map((patient) => ({
        ...patient,
        avatarUrl: useRandomAvatar(patient.foto_perfil_url, patient.id),
      })),
    [patients]
  );

  const handleNavigateToCitas = (e, patientId) => {
    e.stopPropagation();
    router.push(`/pacientes/${patientId}/citas`);
  };

  const handleCopyToClipboard = (value) => {
    navigator.clipboard.writeText(value).then(() => {
      setSnackbarMessage(`${value} se ha copiado`);
      setSnackbarOpen(true);
    });
  };

  if (patientsWithAvatars.length === 0) {
    return (
      <Paper
        elevation={1}
        sx={{
          textAlign: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 90%)",
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
    );
  }

  return (
    <Grid container spacing={4}>
      {patientsWithAvatars.map((patient) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={patient.id}>
          <Card
            onClick={() => router.push(`/pacientes/${patient.id}`)}
            sx={{
              position: "relative",
              height: "250px",
              borderRadius: 2,
              overflow: "hidden",
              cursor: "pointer",
              transition:
                "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease",
              border: "8px solid #fff",
              "&:hover": {
                border: "none",
                transform: isMobile ? "scale(1)" : "scale(1.3)",
                zIndex: 3,
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)",
                "& .card-background": {
                  transform: "scale(1.1)",
                },
                "& .hover-content": {
                  opacity: 1,
                  transform: "translateY(0)",
                },
                "& .hover-overlay": {
                  opacity: 1,
                },
              },
            }}
          >
            <Box
              className="card-background"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `url(${patient.avatarUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "transform 0.5s ease",
              }}
            />

            <Box
              className="hover-overlay"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,40,105,0.9)",
                opacity: 0,
                transition: "opacity 0.4s ease-in-out",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(to top, rgba(0,40,105) -10%, transparent 40%)",
              }}
            />

            <CardContent
              sx={{
                position: "relative",
                zIndex: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                color: "white",
                "&:last-child": {
                  paddingBottom: "16px",
                  "&:hover": {
                    paddingBottom: "24px",
                  },
                },
              }}
            >
              <Box
                className="hover-content"
                sx={{
                  opacity: 0,
                  transform: "translateY(20px)",
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                  mb: 2,
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  mb={1}
                  sx={{
                    transition: "transform 0.2s ease, color 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.03)",
                      color: "secondary.main",
                      "& svg": { color: "secondary.main" },
                    },
                  }}
                >
                  <PhoneIcon fontSize="small" sx={{ mr: 1, opacity: 0.8 }} />
                  <Typography
                    variant="body2"
                    fontWeight={"bold"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyToClipboard(patient.telefono);
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    {patient.telefono || "N/A"}
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  mb={2}
                  sx={{
                    transition: "transform 0.2s ease, color 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.03)",
                      color: "secondary.main",
                      "& svg": { color: "secondary.main" },
                    },
                  }}
                >
                  <EmailIcon fontSize="small" sx={{ mr: 1, opacity: 0.8 }} />
                  <Typography
                    variant="body2"
                    fontWeight={"bold"}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyToClipboard(patient.email);
                    }}
                  >
                    {patient.email || "N/A"}
                  </Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    startIcon={<CalendarMonthIcon/>}
                    onClick={(e) => handleNavigateToCitas(e, patient.id)}
                  >
                    Ver Citas
                  </Button>

                  <SmartSummaryAssistant patientId={Number(patient.id)} variant="inline">
                  <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<SummarizeIcon />}
                    >
                      Resumen
                    </Button>
                  </SmartSummaryAssistant>

                </Box>
              </Box>

              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  fontWeight: 600,
                  transition: "color 0.3s ease",
                  lineHeight: 1,
                }}
              >
                {patient.nombre} {patient.apellidos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Grid>
  );
}
