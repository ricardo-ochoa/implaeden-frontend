"use client";

import { Box } from "@mui/material";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import ImplaedenThread from "@/components/chat/ImplaedenThread";
import Cookies from "js-cookie";

export default function ChatPage() {
const runtime = useChatRuntime({
  transport: new AssistantChatTransport({
    api: `${process.env.NEXT_PUBLIC_API_URL}/ai/chat`,
    prepareSendMessagesRequest: (options) => ({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${Cookies.get("token") || ""}`,
      },
    }),
  }),
});

  return (
    <Box sx={{ height: "calc(95dvh - 64px)" }}>
      <AssistantRuntimeProvider runtime={runtime}>
        <ImplaedenThread />
      </AssistantRuntimeProvider>
    </Box>
  );
}
