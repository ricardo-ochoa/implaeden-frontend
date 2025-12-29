// src/app/api/chat/route.js
export const runtime = "nodejs";
export const maxDuration = 30;

import { cookies } from "next/headers";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool } from "ai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL; // http://localhost:4000/api

function getToken() {
  const token = cookies().get("token")?.value; // ajusta si tu cookie se llama diferente
  if (!token) throw new Error("No hay token en cookies (token). Inicia sesión.");
  return token;
}

async function apiFetch(path) {
  if (!API_BASE_URL) throw new Error("Falta API_BASE_URL en env.");
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (res.status === 401) throw new Error("401: sesión expirada o token inválido.");
  if (!res.ok) throw new Error(`Backend error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function POST(req) {
  const { messages, system, tools: uiTools } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: system ?? `
Eres un asistente para una clínica dental.
No inventes datos.
Si piden información real, usa herramientas.
`.trim(),

    // 👇 CLAVE: await (si no, revienta con "ModelMessage[] schema")
    messages: await convertToModelMessages(messages),

    tools: {
      // tools que (opcionalmente) vengan del frontend
      ...frontendTools(uiTools),

      buscar_pacientes: tool({
        description: "Busca pacientes por texto (nombre/apellidos/teléfono/email).",
        inputSchema: z.object({
          search: z.string().min(1),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ search, page, limit }) => {
          const data = await apiFetch(
            `/pacientes?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
          );

          const patients = (data?.patients || []).map((p) => ({
            id: p.id,
            nombre: p.nombre,
            apellidos: p.apellidos,
          }));

          return { patients, totalPages: data?.totalPages ?? 1 };
        },
      }),

      resumen_paciente: tool({
        description: "Obtiene el resumen del paciente por ID (endpoint /summary).",
        inputSchema: z.object({
          patientId: z.number().int().positive(),
        }),
        execute: async ({ patientId }) => {
          return apiFetch(`/pacientes/${patientId}/summary`);
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
