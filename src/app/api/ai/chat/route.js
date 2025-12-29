import { cookies } from "next/headers";

export async function POST(req) {
  const token = cookies().get("token")?.value;

  // lee el body tal cual (json) para reenviarlo al backend
  const bodyText = await req.text();

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: bodyText,
  });

  // forward streaming/body
  const contentType = backendRes.headers.get("content-type") || "text/plain";

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    },
  });
}
