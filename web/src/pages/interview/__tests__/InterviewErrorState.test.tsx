import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import InterviewPage from "../InterviewPage";
import { sessionsApi } from "@/services/sessions";

vi.mock("@/services/sessions", () => ({
  sessionsApi: {
    getCandidateInfo: vi.fn(),
    updateCandidate: vi.fn(),
    audioComplete: vi.fn(),
  },
}));

vi.mock("@/hooks/useAudioCapture", () => ({
  useAudioCapture: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAudioPlayback", () => ({
  useAudioPlayback: () => ({
    playChunk: vi.fn(),
    stop: vi.fn(),
    scheduleAfterPlayback: vi.fn(),
    waitForDrain: vi.fn(),
    cancelDrain: vi.fn(),
  }),
}));

const mockConnect = vi.fn();

vi.mock("@/hooks/useAudioWebSocket", () => ({
  useAudioWebSocket: () => ({
    connect: mockConnect,
    send: vi.fn(),
    sendJson: vi.fn(),
    disconnect: vi.fn(),
    connectionState: "disconnected",
  }),
}));

vi.mock("@/components/HardwareCheck", () => ({
  default: () => <div data-testid="mock-hardware-check" />,
}));

describe("InterviewPage - Error vs Complete State Differentiation (UX-01)", () => {
  const mockToken = "token-error-test";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Interview Complete only when session has a clean end reason", async () => {
    vi.mocked(sessionsApi.getCandidateInfo).mockResolvedValueOnce({
      data: {
        session_id: 101,
        candidate_name: "John Doe",
        role_title: "Fullstack Engineer",
        time_limit_min: 30,
        consent_given: true,
        session_status: "ended",
        end_reason: "manual_candidate",
      },
    } as any);

    render(
      <MemoryRouter initialEntries={[`/interview/${mockToken}`]}>
        <Routes>
          <Route path="/interview/:token" element={<InterviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Interview Complete")).toBeInTheDocument();
      expect(screen.queryByText("Connection Interrupted")).not.toBeInTheDocument();
    });
  });

  it("renders Connection Interrupted with Retry Connection button when session ended with error", async () => {
    vi.mocked(sessionsApi.getCandidateInfo).mockResolvedValueOnce({
      data: {
        session_id: 102,
        candidate_name: "Jane Smith",
        role_title: "Fullstack Engineer",
        time_limit_min: 30,
        consent_given: true,
        session_status: "ended",
        end_reason: "error",
      },
    } as any);

    render(
      <MemoryRouter initialEntries={[`/interview/${mockToken}`]}>
        <Routes>
          <Route path="/interview/:token" element={<InterviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Connection Interrupted")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry Connection/i })).toBeInTheDocument();
      expect(screen.queryByText("Interview Complete")).not.toBeInTheDocument();
    });
  });

  it("renders Connection Interrupted when fetching candidate info fails due to network drop", async () => {
    vi.mocked(sessionsApi.getCandidateInfo).mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter initialEntries={[`/interview/${mockToken}`]}>
        <Routes>
          <Route path="/interview/:token" element={<InterviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Connection Interrupted")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry Connection/i })).toBeInTheDocument();
    });
  });
});
