"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";

export default function AcceptInviteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const canSubmit = token && password.length >= 8 && password === confirm && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!token) return setError("Falta el token de invitación.");
    if (password.length < 8) return setError("La contraseña debe tener mínimo 8 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "No se pudo aceptar la invitación.");

      setOkMsg("Cuenta creada. Ahora inicia sesión.");
      setTimeout(() => router.replace("/login"), 900);
    } catch (err) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 8, px: 2 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        Crear contraseña
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Estás aceptando una invitación para Implaedén.
      </Typography>

      {!token && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Falta el token en la URL. Revisa el link.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Mínimo 8 caracteres"
          fullWidth
        />
        <TextField
          label="Confirmar contraseña"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          fullWidth
        />

        <Button type="submit" variant="contained" disabled={!canSubmit}>
          {loading ? "Creando..." : "Crear cuenta"}
        </Button>
      </Box>
    </Box>
  );
}
