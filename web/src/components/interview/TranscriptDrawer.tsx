import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import TranscriptBubble from "./TranscriptBubble";
import { X, MessageSquare } from "lucide-react";
import type { TranscriptTurn } from "@/types";

interface TranscriptDrawerProps {
  open: boolean;
  onClose: () => void;
  transcript: Pick<TranscriptTurn, "speaker" | "text">[];
}

export default function TranscriptDrawer({
  open,
  onClose,
  transcript,
}: TranscriptDrawerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, transcript.length]);

  if (!open) return null;

  return (
    <aside
      aria-label="Live interview transcript drawer"
      className="fixed inset-y-0 right-0 z-40 w-80 md:w-96 bg-background border-l shadow-lg flex flex-col transition-transform duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Live Transcript</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {transcript.length} turns
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
          aria-label="Close transcript drawer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Transcript turns list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6 text-sm text-muted-foreground">
            Spoken responses will appear here in real-time.
          </div>
        ) : (
          transcript.map((turn, index) => (
            <TranscriptBubble
              key={index}
              speaker={turn.speaker}
              text={turn.text}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </aside>
  );
}
