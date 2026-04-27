"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatModal } from "./ChatModal";

export function ChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon-lg"
        className="fixed bottom-6 right-6 z-40 shadow-lg shadow-primary/20"
        aria-label="Open chat"
      >
        <MessageCircle />
      </Button>
      <ChatModal open={open} onOpenChange={setOpen} />
    </>
  );
}
