"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useClinicAI } from "../hooks/useClinicAI";

export default function AdminHome() {
  const [input, setInput] = useState("");
  const { ask, loading, answer, rawData, error } = useClinicAI();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    ask(input.trim());
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Asistente inteligente de la clínica
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", gap: 2, mb: 3 }}
      >
        <TextField
          fullWidth
          label="Haz una pregunta sobre tus pacientes, citas, etc."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Preguntar"}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {answer && (
        <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd", mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Respuesta del asistente:
          </Typography>
          <Typography>{answer}</Typography>
        </Box>
      )}

      {rawData && Array.isArray(rawData) && rawData.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Datos desde la base (ej. pacientes últimos 30 días):
          </Typography>
          <pre style={{ fontSize: 12, maxHeight: 200, overflow: "auto" }}>
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
}
