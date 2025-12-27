import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { patientId } = await req.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId requerido" },
        { status: 400 }
      );
    }

    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/pacientes/${patientId}/summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorJson.error || "Error al obtener resumen del backend" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error en /api/patient-summary:", err);
    return NextResponse.json(
      { error: "Error interno en /api/patient-summary" },
      { status: 500 }
    );
  }
}
