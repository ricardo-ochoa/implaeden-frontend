"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const canSubmit =
    token &&
    newPassword.length >= 8 &&
    newPassword === confirm &&
    !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!token) return setError("Falta el token de reseteo.");
    if (newPassword.length < 8) return setError("La contraseña debe tener mínimo 8 caracteres.");
    if (newPassword !== confirm) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/password/reset/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "No se pudo resetear la contraseña.");

      setOkMsg("Contraseña actualizada. Ya puedes iniciar sesión.");
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
        Restablecer contraseña
      </Typography>

      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Crea una nueva contraseña para tu cuenta.
      </Typography>

      {!token && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Falta el token en la URL. Revisa el link que te compartió el admin.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          helperText="Mínimo 8 caracteres"
          fullWidth
        />
        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          fullWidth
        />

        <Button type="submit" variant="contained" disabled={!canSubmit}>
          {loading ? "Actualizando..." : "Guardar nueva contraseña"}
        </Button>

        <Button variant="text" onClick={() => router.replace("/login")} sx={{ justifySelf: "start" }}>
          Volver a login
        </Button>
      </Box>
    </Box>
  );
}
