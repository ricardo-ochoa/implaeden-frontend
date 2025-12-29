"use client";

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  AssistantIf,
} from "@assistant-ui/react";
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StopIcon from "@mui/icons-material/Stop";

const BOT_AVATAR_SRC = "/favicon.png";

export default function ImplaedenThread() {
  const theme = useTheme();

  const accent = theme.palette.primary.main;
  const accentText = theme.palette.getContrastText(accent);

  return (
    <ThreadPrimitive.Root
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        ["--thread-max-width"]: "42rem", // como el ejemplo
      }}
    >
      <ThreadPrimitive.Viewport
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          paddingBottom: 24, // aire para el sticky footer
        }}
      >
        {/* Empty / Welcome */}
        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <ImplaedenWelcome />
        </AssistantIf>

        {/* Messages */}
        <ThreadPrimitive.Messages
          components={{
            AssistantMessage: ImplaedenAssistantMessage,
            UserMessage: ImplaedenUserMessage,
          }}
        />

        {/* Sticky composer footer */}
<ThreadPrimitive.ViewportFooter
  style={{
    position: "sticky",
    bottom: 0,
    background: theme.palette.background.default,
    paddingTop: 12,
    paddingBottom: 12,
    backdropFilter: "blur(10px)",
  }}
>
  <ThreadPrimitive.ScrollToBottom />

  {/* ✅ Solo mostrar composer en footer si NO está vacío */}
  <AssistantIf condition={({ thread }) => !thread.isEmpty}>
    <ImplaedenComposer
  accent={theme.palette.primary.main}
  accentText={theme.palette.getContrastText(theme.palette.primary.main)}
/>

  </AssistantIf>
</ThreadPrimitive.ViewportFooter>

      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

function ImplaedenWelcome() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "var(--thread-max-width)" }}>
    <Typography
      sx={{
        fontSize: { xs: 30, md: 44 },
        fontWeight: 700,
        letterSpacing: -0.5,
        mb: 2,
        color: "primary.main",
      }}
    >
      ¿Qué quieres consultar?
    </Typography>

        <Typography
          variant="body1"
          sx={{ color: "text.secondary", mb: 3, maxWidth: 720 }}
        >
          Puedo ayudarte a buscar pacientes, ver resúmenes, citas y pagos.
          Escribe tu pregunta o usa un botón rápido.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
          <ThreadPrimitive.Suggestion prompt="Resumen del paciente Ricardo" send asChild>
            <Button variant="outlined" size="small">Resumen de Ricardo</Button>
          </ThreadPrimitive.Suggestion>

          <ThreadPrimitive.Suggestion prompt="Buscar paciente Luis" send asChild>
            <Button variant="outlined" size="small">Buscar “Luis”</Button>
          </ThreadPrimitive.Suggestion>

          <ThreadPrimitive.Suggestion prompt="Pacientes recientes (últimos 30 días)" send asChild>
            <Button variant="outlined" size="small">Pacientes recientes</Button>
          </ThreadPrimitive.Suggestion>
        </Box>

        {/* Composer también visible en empty (como el ejemplo) */}
        <ImplaedenComposer
          accent={theme.palette.primary.main}
          accentText={theme.palette.getContrastText(theme.palette.primary.main)}
        />
      </Box>
    </Box>
  );
}

function ImplaedenComposer({ accent, accentText }) {
  const theme = useTheme();

  return (
    <ComposerPrimitive.Root>
      <Box
        sx={{
          width: "100%",
          maxWidth: "var(--thread-max-width)",
          mx: "auto",
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          px: 1,
          py: 0.5,
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          "&:focus-within": {
            borderColor: accent,
            boxShadow: `0 0 0 4px ${accent}22`,
          },
        }}
      >
        <ComposerPrimitive.Input
          placeholder='Pregunta por pacientes, citas, pagos… (ej. "Resumen del paciente Ricardo")'
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            padding: "12px 10px",
            fontSize: 16,
            background: "transparent",
            color: theme.palette.text.primary,
          }}
        />

        <ComposerPrimitive.Send asChild>
          <IconButton
            aria-label="Enviar"
            sx={{

              bgcolor: accent,
              color: accentText,
              "&:hover": { bgcolor: accent },
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </ComposerPrimitive.Send>

        <AssistantIf condition={({ thread }) => thread.isRunning}>
          <ComposerPrimitive.Cancel asChild>
            <IconButton aria-label="Detener" color="error">
              <StopIcon />
            </IconButton>
          </ComposerPrimitive.Cancel>
        </AssistantIf>
      </Box>
    </ComposerPrimitive.Root>
  );
}

function ImplaedenAssistantMessage() {
  const theme = useTheme();

  return (
    <MessagePrimitive.Root
      data-role="assistant"
      style={{
        width: "100%",
        maxWidth: "var(--thread-max-width)",
        margin: "14px auto",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <Avatar src={BOT_AVATAR_SRC} sx={{ width: 34, height: 34 }}>
        I
      </Avatar>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          p: 2,
          borderRadius: 1,
          bgcolor: "background.paper",
        }}
      >
        <MessagePrimitive.Parts />
      </Paper>
    </MessagePrimitive.Root>
  );
}

function ImplaedenUserMessage() {
  return (
    <MessagePrimitive.Root
      data-role="user"
      style={{
        width: "100%",
        maxWidth: "var(--thread-max-width)",
        margin: "14px auto",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 10,
          maxWidth: "80%",
          bgcolor: "action.hover",
        }}
      >
        <MessagePrimitive.Parts />
      </Paper>
    </MessagePrimitive.Root>
  );
}
