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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return Response.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const pid = Number(body?.patientId);

    if (!pid || Number.isNaN(pid)) {
      return Response.json({ error: "patientId inválido" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL; // http://localhost:4000/api
    const url = joinUrl(baseUrl, `pacientes/${pid}/resumen/tts`);

    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      let j = null;
      try { j = JSON.parse(text); } catch {}
      return Response.json(
        { error: j?.error || j?.details || text || "Error TTS (backend)" },
        { status: r.status }
      );
    }

    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("Next TTS route error:", e);
    return Response.json({ error: "Error proxy TTS" }, { status: 500 });
  }
}
