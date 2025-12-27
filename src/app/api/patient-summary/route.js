import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function joinUrl(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

export async function POST(req) {
  try {
    const { patientId } = await req.json();
    const pid = Number(patientId);

    if (!pid || Number.isNaN(pid)) {
      return NextResponse.json({ error: "patientId requerido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL; // http://localhost:4000/api
    const url = joinUrl(baseUrl, `pacientes/${pid}/summary`);

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorJson.error || "Error al obtener resumen del backend" },
        { status: res.status }
      );
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("Error en /api/patient-summary:", err);
    return NextResponse.json(
      { error: "Error interno en /api/patient-summary" },
      { status: 500 }
    );
  }
}
