"use client";

import { Box } from "@mui/material";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import ImplaedenThread from "@/components/chat/ImplaedenThread";

export default function ChatClient() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/ai/chat",
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
