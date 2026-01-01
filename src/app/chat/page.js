import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export default function ChatPage() {
  const token = cookies().get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <ChatClient />;
}
