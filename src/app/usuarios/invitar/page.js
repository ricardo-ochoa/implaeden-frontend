"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import {
  Box,
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function InvitarUsuarioPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("medico");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  const token = Cookies.get("token") || ""; // o de donde guardes el accessToken

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setInviteUrl("");

    if (!email) return setError("Email requerido.");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "No se pudo crear la invitación.");

      setOkMsg(data.message || "Invitación creada.");
      setInviteUrl(data.inviteUrl || "");
      setEmail("");
      setRole("medico");
    } catch (err) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setOkMsg("Link copiado ✅");
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: 8, px: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Invitar usuario
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

      <Box component="form" onSubmit={handleInvite} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          fullWidth
        />

        <Select value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
          <MenuItem value="medico">Médico (editor)</MenuItem>
          <MenuItem value="secretario">Secretario (editor)</MenuItem>
          <MenuItem value="reader">Lector (reader)</MenuItem>
        </Select>

        <Button type="submit" variant="contained" disabled={loading || !email}>
          {loading ? "Creando..." : "Crear invitación"}
        </Button>

        {inviteUrl && (
          <TextField
            label="Link de invitación"
            value={inviteUrl}
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
