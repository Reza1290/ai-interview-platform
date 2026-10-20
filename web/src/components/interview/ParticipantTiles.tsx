import { useEffect, useState } from "react";
import { Bot, Mic, MicOff, Volume2 } from "lucide-react";
import type { InterviewSpeaker } from "@/types";

interface ParticipantTilesProps {
  candidateName?: string;
  speaker: InterviewSpeaker;
  micMuted: boolean;
  getAiVolume?: () => number;
  getCandidateVolume?: () => number;
}

export default function ParticipantTiles({
  candidateName,
  speaker,
  micMuted,
  getAiVolume,
  getCandidateVolume,
}: ParticipantTilesProps) {
  const isAiTalking = speaker === "ai";
  const isCandidateTalking = speaker === "candidate";

  const [aiVolumeLevel, setAiVolumeLevel] = useState(0);
  const [candidateIsSpeaking, setCandidateIsSpeaking] = useState(false);

  // Sound volume tracking and natural voice cadence loop
  useEffect(() => {
    let animId: number;
    let fallbackAiPhase = 0;
    let silenceTimeout: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      // AI volume tracking
      if (isAiTalking) {
        const measured = getAiVolume ? getAiVolume() : 0;
        if (measured > 0.02) {
          setAiVolumeLevel(measured);
        } else {
          // Smooth conversational cadence modulation when audio analyser is silent or in test environment
          fallbackAiPhase += 0.15;
          const simulated = 0.35 + Math.sin(fallbackAiPhase) * 0.25 + Math.sin(fallbackAiPhase * 2.3) * 0.15;
          setAiVolumeLevel(Math.max(0.05, Math.min(1, simulated)));
        }
      } else {
        setAiVolumeLevel(0);
      }

      // Candidate volume tracking: steady active state if input > 0.02 (2%) or speaker turn
      if (!micMuted && (isCandidateTalking || (getCandidateVolume && getCandidateVolume() > 0.02))) {
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          silenceTimeout = null;
        }
        setCandidateIsSpeaking(true);
      } else if (micMuted) {
        setCandidateIsSpeaking(false);
      } else if (candidateIsSpeaking && !silenceTimeout) {
        // Hold active state for 400ms across conversational pauses to prevent blinking
        silenceTimeout = setTimeout(() => {
          setCandidateIsSpeaking(false);
          silenceTimeout = null;
        }, 400);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      if (silenceTimeout) clearTimeout(silenceTimeout);
    };
  }, [isAiTalking, isCandidateTalking, micMuted, getAiVolume, getCandidateVolume, candidateIsSpeaking]);

  const getInitials = (name?: string) => {
    if (!name?.trim()) return "K";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // AI dynamic border thickness & glow relating to sound volume
  const aiBorderWidth = isAiTalking ? `${Math.round(3 + aiVolumeLevel * 3.5)}px` : "1px";
  const aiBorderColor = isAiTalking ? "#3b82f6" : "#334155";
  const aiBoxShadow = isAiTalking
    ? `0 0 ${Math.round(6 + aiVolumeLevel * 14)}px rgba(59, 130, 246, ${0.4 + aiVolumeLevel * 0.45})`
    : "none";

  // Steady candidate active state without volume jitter or blinking
  const isCandidateActive = !micMuted && (candidateIsSpeaking || isCandidateTalking);
  const candidateBorderWidth = isCandidateActive ? "3px" : "1px";
  const candidateBorderColor = isCandidateActive ? "#3b82f6" : "#334155";
  const candidateBoxShadow = isCandidateActive ? "0 0 14px rgba(59, 130, 246, 0.55)" : "none";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-w-6xl mx-auto p-4 items-center">
      {/* ── AI Interviewer Tile ── */}
      <div
        style={{
          borderStyle: "solid",
          borderWidth: aiBorderWidth,
          borderColor: aiBorderColor,
          boxShadow: aiBoxShadow,
          transform: isAiTalking ? `scale(${1 + aiVolumeLevel * 0.01})` : "scale(1)",
        }}
        className="relative flex flex-col items-center justify-center rounded-2xl w-full h-64 sm:h-80 md:h-[400px] bg-slate-900 text-white transition-all duration-150 overflow-hidden"
      >
        {/* Top-Right Voice Activity / Status Icon */}
        <div className="absolute top-4 right-4 z-10">
          {isAiTalking ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/90 backdrop-blur text-white text-xs font-medium">
              <Volume2 className="h-3.5 w-3.5" />
              <span>Speaking</span>
              <div className="flex items-end gap-0.5 ml-1 h-3">
                <span
                  className="w-0.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.round(4 + aiVolumeLevel * 8)}px` }}
                />
                <span
                  className="w-0.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.round(6 + aiVolumeLevel * 6)}px` }}
                />
                <span
                  className="w-0.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.round(3 + aiVolumeLevel * 9)}px` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/80 backdrop-blur text-slate-300 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Ready</span>
            </div>
          )}
        </div>

        {/* Center Avatar — Clean, No Ping Blip */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
              isAiTalking
                ? "bg-gradient-to-tr from-blue-600 to-indigo-500 ring-2 ring-blue-400 text-white"
                : "bg-slate-800 border-2 border-slate-700 text-slate-300"
            }`}
          >
            <Bot className="w-12 h-12" />
          </div>
        </div>

        {/* Bottom Left Participant Name Label */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur text-xs font-medium text-white tracking-wide">
            AI Interviewer (Rakamin)
          </span>
        </div>
      </div>

      {/* ── Candidate (User) Tile ── */}
      <div
        style={{
          borderStyle: "solid",
          borderWidth: candidateBorderWidth,
          borderColor: candidateBorderColor,
          boxShadow: candidateBoxShadow,
          transform: "scale(1)",
        }}
        className="relative flex flex-col items-center justify-center rounded-2xl w-full h-64 sm:h-80 md:h-[400px] bg-slate-900 text-white transition-all duration-150 overflow-hidden"
      >
        {/* Top-Right Mic Status */}
        <div className="absolute top-4 right-4 z-10">
          {micMuted ? (
            <div className="p-1.5 rounded-full bg-red-600/90 text-white" title="Microphone muted">
              <MicOff className="h-4 w-4" />
            </div>
          ) : (
            <div
              className={`flex items-center gap-1.5 p-1.5 px-2.5 rounded-full text-xs font-medium transition-colors ${
                isCandidateActive ? "bg-blue-600 text-white" : "bg-slate-800/80 text-slate-300"
              }`}
              title={isCandidateActive ? "Microphone active (speaking)" : "Microphone active"}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>{isCandidateActive ? "Speaking" : "On"}</span>
            </div>
          )}
        </div>

        {/* Center Avatar — Clean, No Ping Blip */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-2xl font-bold shadow-md transition-all duration-200 ${
              isCandidateActive
                ? "bg-purple-700 ring-2 ring-blue-400 text-white"
                : "bg-purple-800 border-2 border-purple-600 text-purple-100"
            }`}
          >
            {getInitials(candidateName)}
          </div>
        </div>

        {/* Bottom Left Participant Name Label */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur text-xs font-medium text-white tracking-wide">
            {candidateName || "Candidate"} (You)
          </span>
        </div>
      </div>
    </div>
  );
}
