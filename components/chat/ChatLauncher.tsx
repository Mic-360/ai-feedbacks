"use client";

import { useState } from "react";
import { ChatModal } from "./ChatModal";
import { Button } from "../ui/button";

export function ChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 h-10 bg-(--ink) text-(--paper) hover:bg-(--ink-soft) transition-colors"
        style={{
          fontFamily: "var(--font-ui), system-ui, sans-serif",
          fontSize: "11px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
        aria-label="Open correspondence"
      >
        Chat →
      </Button>
      <ChatModal open={open} onOpenChange={setOpen} />
    </>
  );
}
