"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function ResetPasswordAdminClient() {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = Cookies.get("token") || ""; // si lo guardas así

  const handleCreate = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setError("");
    setResetUrl("");

    if (!email) return setError("Email requerido.");

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/password/reset/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "No se pudo crear el link.");

      setResetUrl(data.resetUrl || "");
      setOkMsg("Link generado. Compártelo con el usuario.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!resetUrl) return;
    await navigator.clipboard.writeText(resetUrl);
    setOkMsg("Link copiado ✅");
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: 8, px: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Resetear contraseña (Admin)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

      <Box component="form" onSubmit={handleCreate} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Email del usuario"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          fullWidth
        />

        <Button type="submit" variant="contained" disabled={loading || !email}>
          {loading ? "Generando..." : "Generar link de reseteo"}
        </Button>

        {resetUrl && (
          <TextField
            label="Link de reseteo"
            value={resetUrl}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={copyLink} edge="end" aria-label="Copiar link">
                    <ContentCopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>
    </Box>
  );
}
