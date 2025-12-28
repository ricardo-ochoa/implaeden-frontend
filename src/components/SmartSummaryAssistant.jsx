"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, IconButton, Stack, Portal, Tooltip } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import CloseIcon from "@mui/icons-material/Close";
import SummarizeIcon from "@mui/icons-material/VoiceChat";
import { isValidElement, cloneElement } from "react";

function formatDate(dateString) {
  if (!dateString) return "Sin fecha";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "Sin fecha";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSummaryItems(summary) {
  if (!summary) return [];
  const { patient, lastService, lastAppointment, lastPayment } = summary;
  const items = [];

  if (patient) {
    items.push({
      label: "Nombre del paciente",
      value: `${patient.nombre || ""} ${patient.apellidos || ""}`.trim(),
    });
  }

  if (lastService) {
    const fecha = lastService.service_date ? formatDate(lastService.service_date) : "Sin fecha";

    const costoNumber =
      lastService.total_cost !== null &&
      lastService.total_cost !== undefined &&
      lastService.total_cost !== ""
        ? Number(lastService.total_cost)
        : null;

    const costo =
      costoNumber !== null && !Number.isNaN(costoNumber) ? `$${costoNumber.toFixed(2)}` : null;

    const partes = [];
    if (lastService.service_name) partes.push(lastService.service_name);
    if (lastService.status) partes.push(`(${lastService.status})`);
    if (fecha) partes.push(`el ${fecha}`);
    if (costo) partes.push(`costo: ${costo}`);

    items.push({ label: "Último servicio realizado", value: partes.join(" ") });
  } else {
    items.push({ label: "Último servicio realizado", value: "No hay servicios registrados." });
  }

  if (lastAppointment) {
    const fecha = lastAppointment.appointment_at
      ? formatDateTime(lastAppointment.appointment_at)
      : "Sin fecha";

    const partes = [fecha];
    if (lastAppointment.service_name) partes.push(`para ${lastAppointment.service_name}`);

    items.push({ label: "Última cita registrada", value: partes.join(" ") });
  } else {
    items.push({ label: "Última cita registrada", value: "No hay citas registradas." });
  }

  if (lastPayment) {
    const fecha = lastPayment.fecha ? formatDate(lastPayment.fecha) : "Sin fecha";

    const montoNumber =
      lastPayment.monto !== null && lastPayment.monto !== undefined && lastPayment.monto !== ""
        ? Number(lastPayment.monto)
        : null;

    const monto =
      montoNumber !== null && !Number.isNaN(montoNumber) ? `$${montoNumber.toFixed(2)}` : null;

    const partes = [fecha];
    if (monto) partes.push(`monto: ${monto}`);
    if (lastPayment.payment_method) partes.push(`(${lastPayment.payment_method})`);
    if (lastPayment.payment_status) partes.push(`estado: ${lastPayment.payment_status}`);

    items.push({ label: "Último pago", value: partes.join(" ") });
  } else {
    items.push({ label: "Último pago", value: "No hay pagos registrados." });
  }

  return items;
}

export default function SmartSummaryAssistant({
  patientId,
  variant = "floating",
  size = "small",
  children,
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const [ttsLoading, setTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);
  const ttsPromiseRef = useRef(null);

  // ✅ corta burbujeo hacia la Card (muy importante en Portals)
  const stopEvent = (e) => {
    if (!e) return;
    e.preventDefault?.();
    e.stopPropagation?.();
  };

  const stopSoft = () => {
    try {
      const a = audioRef.current;
      if (!a) return;
      a.pause();
      try { a.currentTime = 0; } catch {}
      setIsPlaying(false);
    } catch {}
  };

  const cleanupHard = () => {
    try {
      const a = audioRef.current;
      if (a) {
        a.pause();
        try { a.currentTime = 0; } catch {}
        a.onplay = null;
        a.onpause = null;
        a.onended = null;
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setIsPlaying(false);
      ttsPromiseRef.current = null;
    } catch {}
  };

  const attachAudioEvents = (audio) => {
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      try { audio.currentTime = 0; } catch {}
    };
  };

  const fetchSummary = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);

    const res = await fetch("/api/patient-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: Number(patientId) }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Error al obtener resumen");

    setSummary(json);
    setLoading(false);
  };

  const handleClick = async () => {
    try {
      if (summary) {
        setOpen(true);
        return;
      }
      await fetchSummary();
    } catch (err) {
      console.error("Error en SmartSummaryAssistant:", err);
      setError(err?.message || "Error desconocido");
      setLoading(false);
    }
  };

  const ensureAudioLoaded = async () => {
    if (audioRef.current) return audioRef.current;
    if (ttsPromiseRef.current) return ttsPromiseRef.current;

    const promise = (async () => {
      setTtsLoading(true);

      const res = await fetch("/api/patient-summary/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: Number(patientId) }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let j = null;
        try { j = JSON.parse(text); } catch {}
        throw new Error(j?.error || text || "No se pudo generar el audio");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      attachAudioEvents(audio);
      audioRef.current = audio;

      return audio;
    })();

    ttsPromiseRef.current = promise;

    try {
      return await promise;
    } finally {
      setTtsLoading(false);
      ttsPromiseRef.current = null;
    }
  };

  const handleSpeak = async () => {
    try {
      setError(null);

      if (audioRef.current) {
        const a = audioRef.current;
        const ended = a.ended || (a.duration && a.currentTime >= a.duration - 0.05);
        if (ended) {
          try { a.currentTime = 0; } catch {}
        }
        if (a.paused) await a.play();
        else a.pause();
        return;
      }

      const audio = await ensureAudioLoaded();
      if (!audio) return;
      await audio.play();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Error TTS");
      cleanupHard();
    }
  };

  const handleStopAudio = () => stopSoft();

  const handleClose = () => {
    setOpen(false);
    cleanupHard();
  };

  useEffect(() => {
    return () => cleanupHard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryItems = summary ? buildSummaryItems(summary) : [];
  const canTts = !!summary && !loading;
  const showStop = isPlaying;

  const renderTrigger = () => {
    if (variant === "floating") {
  return (
    <Tooltip title="Resumen" placement="left" arrow>
      {/* Tooltip no funciona directo en disabled, por eso el span */}
      <span className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={(e) => { stopEvent(e); handleClick(); }}
          disabled={loading}
          className="
            h-12 w-12 rounded-full
            bg-blue-50 shadow-lg
            flex items-center justify-center
            border border-blue-200
            hover:scale-105 hover:bg-blue-100 hover:border-blue-300
            disabled:bg-slate-700 disabled:border-slate-600
            transition-transform transition-colors
          "
          aria-label="Resumen"
        >
          {loading ? (
            <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <SummarizeIcon color="primary" />
          )}
        </button>
      </span>
    </Tooltip>
  );
}

    if (children && isValidElement(children)) {
      const originalOnClick = children.props?.onClick;

      return cloneElement(children, {
        onClick: async (e) => {
          stopEvent(e);
          if (typeof originalOnClick === "function") originalOnClick(e);
          await handleClick();
        },
        disabled: Boolean(children.props?.disabled) || loading,
      });
    }

    return (
      <IconButton
        size={size}
        onClick={(e) => { stopEvent(e); handleClick(); }}
        color="primary"
        aria-label="Ver resumen"
        title="Ver resumen"
      >
        <SummarizeIcon fontSize="small" />
      </IconButton>
    );
  };

  return (
    <>
      {renderTrigger()}

      {open && (
        <Portal>
          {/* ✅ este wrapper detiene el burbujeo hacia la Card */}
          <div
            className="fixed inset-0 z-[2000] flex items-end justify-end pointer-events-none"
            onMouseDown={stopEvent}
            onClick={stopEvent}
          >
            {/* overlay */}
            <div
              className="absolute inset-0 bg-black/30 pointer-events-auto"
              onMouseDown={(e) => { stopEvent(e); }}
              onClick={(e) => { stopEvent(e); handleClose(); }}
            />

            {/* panel */}
            <div
              className="relative m-4 w-full max-w-sm pointer-events-auto"
              onMouseDown={stopEvent}
              onClick={stopEvent}
            >
              <div className="rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-sm">
                      <Image src="/favicon.png" alt="Resumen" width={28} height={28} className="rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Resumen</p>
                      <p className="text-xs text-gray-500">Estado actual del paciente</p>
                    </div>
                  </div>

                  <IconButton
                    onClick={(e) => { stopEvent(e); handleClose(); }}
                    aria-label="Cerrar"
                    title="Cerrar"
                    size="small"
                    sx={{ color: "grey.500", "&:hover": { color: "grey.700" } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>

                <div className="px-4 py-2 border-b border-gray-100">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={async (e) => { stopEvent(e); await handleSpeak(); }}
                      disabled={!canTts || ttsLoading}
                      startIcon={ttsLoading ? null : isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    >
                      {ttsLoading ? "Cargando..." : isPlaying ? "Pausar" : "Escuchar"}
                    </Button>

                    {showStop && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={(e) => { stopEvent(e); handleStopAudio(); }}
                        startIcon={<StopIcon />}
                      >
                        Parar
                      </Button>
                    )}
                  </Stack>
                </div>

                <div className="px-4 py-3 max-h-80 overflow-y-auto text-sm">
                  {loading && <p className="text-gray-500">Generando resumen…</p>}
                  {error && !loading && <p className="text-red-600">{error}</p>}

                  {summaryItems.length > 0 && !loading && !error && (
                    <ul className="space-y-3">
                      {summaryItems.map((item, idx) => (
                        <li key={idx} className="flex gap-3 items-start rounded-lg bg-slate-50 px-3 py-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                          <div>
                            {item.label && (
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                {item.label}
                              </p>
                            )}
                            <p className="text-sm text-slate-900">{item.value}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!loading && !error && !summary && (
                    <p className="text-gray-500">Haz clic para generar un resumen.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
