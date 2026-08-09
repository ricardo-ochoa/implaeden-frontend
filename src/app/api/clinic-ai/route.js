// app/api/clinic-ai/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Detecta intent a partir de la pregunta
function detectQueryType(question = "") {
  const q = question.toLowerCase();

  // Ejemplo: "pacientes de los últimos 30 días"
  if (
    q.includes("pacientes") &&
    (q.includes("últimos 30 días") || q.includes("ultimos 30 dias"))
  ) {
    return { type: "recent-patients-30" };
  }

  // Ejemplo: "pacientes llamados Ricardo", "pacientes con nombre Ricardo"
  const byNameMatch = question.match(
    /pacientes?.*?(llamados?|que se llamen|con nombre)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i
  );
  if (byNameMatch) {
    const name = byNameMatch[2].trim();
    return { type: "patients-by-name", name };
  }

  return { type: "generic" };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const question = body?.question || "";
    const patientId = body?.patientId || null; // usado por el resumen flotante

    const token = cookies().get("token")?.value || null;

    if (!question && !patientId) {
      return NextResponse.json(
        { error: "Falta question o patientId" },
        { status: 400 }
      );
    }

    let rawData = null;
    let mode = null;

    // 🔹 Caso A: resumen de un paciente (botón flotante)
    if (patientId) {
      if (!token) {
        return NextResponse.json(
          { error: "No hay token de autenticación" },
          { status: 401 }
        );
      }

      const resSummary = await fetch(
        `${API_BASE}/pacientes/${patientId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resSummary.ok) {
        const t = await resSummary.text();
        console.error("Error backend /summary:", resSummary.status, t);
        return NextResponse.json(
          { error: "Error al obtener resumen del paciente" },
          { status: 500 }
        );
      }

      const summaryData = await resSummary.json();
      rawData = summaryData;
      mode = "patient-summary";

      const { patient, lastService, lastAppointment, nextAppointment, lastPayment } = summaryData;


      const contextText = `
Paciente:
${patient ? `${patient.nombre} ${patient.apellidos} (ID: ${patient.id})` : "No encontrado"}

Último servicio:
${
  lastService
    ? `${lastService.service_name} (${lastService.status}) el ${lastService.service_date}, costo $${lastService.total_cost}`
    : "Sin servicios registrados"
}

Última cita registrada:
${
  lastAppointment
    ? `${lastAppointment.service_name} el ${lastAppointment.appointment_at}`
    : "No hay citas registradas"
}

Próxima cita:
${
  nextAppointment
    ? `${nextAppointment.service_name} el ${nextAppointment.appointment_at}`
    : "No hay próximas citas"
}

Último pago:
${
  lastPayment
    ? `Fecha: ${lastPayment.fecha}, monto: $${lastPayment.monto}, método: ${lastPayment.payment_method}, estado: ${lastPayment.payment_status}`
    : "Sin pagos registrados"
}
      `;

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system:
          "Eres un asistente de una clínica dental. Resume la información de forma clara y muy breve en viñetas. Siempre responde en español.",
        prompt: `
Genera un resumen corto del estado de este paciente.

Información de la base de datos:
${contextText}

Responde con viñetas markdown del tipo:
- **Nombre del paciente:** ...
- **Último servicio realizado:** ...
- **Próxima cita:** ...
- **Último pago:** ...
(No menciones número de evidencias ni archivos.)
        `,
      });

      return NextResponse.json({ answer: text, rawData, mode });
    }

    // 🔹 Caso B: preguntas desde el Home (question)
    if (!token) {
      return NextResponse.json(
        { error: "No hay token de autenticación" },
        { status: 401 }
      );
    }

    const intent = detectQueryType(question);

    // B1) Pacientes últimos 30 días (si quieres usar este intent)
    if (intent.type === "recent-patients-30") {
      const resDb = await fetch(`${API_BASE}/pacientes/recent?days=30`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resDb.ok) {
        const t = await resDb.text();
        console.error("Error backend /pacientes/recent:", resDb.status, t);
        return NextResponse.json(
          { error: "Error consultando pacientes recientes" },
          { status: 500 }
        );
      }

      const data = await resDb.json();
      const patients = data.patients || data || [];
      rawData = patients;
      mode = "recent-patients-30";

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system:
          "Eres un asistente de una clínica dental. Explicas de forma muy breve los datos que se te pasan. Siempre respondes en español.",
        prompt: `
El usuario hizo esta pregunta:
"${question}"

Estos son los pacientes registrados en los últimos 30 días (JSON):
${JSON.stringify(patients).slice(0, 5000)}

Da una respuesta corta del estilo:
"Hay X pacientes registrados en los últimos 30 días. Algunos nombres son: ...".
No inventes datos, solo resume lo que ves.
        `,
      });

      return NextResponse.json({ answer: text, rawData, mode });
    }

    // B2) Pacientes por nombre
    if (intent.type === "patients-by-name") {
      const name = intent.name;

      const resDb = await fetch(
        `${API_BASE}/pacientes?search=${encodeURIComponent(name)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resDb.ok) {
        const t = await resDb.text();
        console.error("Error backend /pacientes?search=", resDb.status, t);
        return NextResponse.json(
          { error: "Error buscando pacientes por nombre" },
          { status: 500 }
        );
      }

      const data = await resDb.json(); // { patients, totalPages }
      const patients = data.patients || [];
      rawData = patients;
      mode = "patients-by-name";

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system:
          "Eres un asistente de una clínica dental. Resumes resultados de búsqueda de pacientes. Siempre respondes en español.",
        prompt: `
El usuario preguntó:
"${question}"

Estos son los pacientes encontrados en la base de datos (JSON):
${JSON.stringify(patients).slice(0, 5000)}

Responde de forma breve, por ejemplo:
- Di cuántos pacientes coinciden.
- Menciona algunos nombres completos y su ID.
- Si no hay resultados, dilo claramente.

No inventes datos fuera de lo que ves en el JSON.
        `,
      });

      return NextResponse.json({ answer: text, rawData, mode });
    }

    // B3) Pregunta genérica (no hay intent de BD)
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "Eres un asistente de una clínica dental. Responde en español, de forma clara y concisa. Puedes dar información general sobre odontología, tratamientos, higiene, etc.",
      prompt: `
Pregunta del usuario:
${question}

Responde de forma útil y concreta.
      `,
    });

    return NextResponse.json({ answer: text, rawData: null, mode: "generic" });
  } catch (error) {
    console.error("Error en /api/clinic-ai:", error);
    return NextResponse.json(
      { error: "Error interno procesando la pregunta" },
      { status: 500 }
    );
  }
}
