import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ParticipantTiles from "../ParticipantTiles";

describe("ParticipantTiles - Google Meet Layout & Volume Border", () => {
  it("renders both AI and Candidate conference tiles with clean avatars and no ping blip", () => {
    const { container } = render(
      <ParticipantTiles
        candidateName="Sarah Connor"
        speaker={null}
        micMuted={false}
      />
    );

    expect(screen.getByText("AI Interviewer (Rakamin)")).toBeInTheDocument();
    expect(screen.getByText("Sarah Connor (You)")).toBeInTheDocument();
    expect(screen.getByText("SC")).toBeInTheDocument();

    // Verify ping blip animation is completely removed
    const pings = container.querySelectorAll(".animate-ping");
    expect(pings.length).toBe(0);
  });

  it("applies bold active border responding to sound volume when on turn", () => {
    const mockGetAiVolume = vi.fn().mockReturnValue(0.75);

    const { container } = render(
      <ParticipantTiles
        candidateName="Sarah Connor"
        speaker="ai"
        micMuted={false}
        getAiVolume={mockGetAiVolume}
      />
    );

    const aiTile = container.querySelector(".bg-slate-900") as HTMLElement;
    expect(aiTile).toBeInTheDocument();
    expect(aiTile.style.borderColor).toBe("rgb(59, 130, 246)"); // #3b82f6
    expect(parseInt(aiTile.style.borderWidth, 10)).toBeGreaterThanOrEqual(3);
  });

  it("applies bold border to Candidate tile when candidate is on turn", () => {
    const mockGetCandidateVolume = vi.fn().mockReturnValue(0.8);

    const { container } = render(
      <ParticipantTiles
        candidateName="Sarah Connor"
        speaker="candidate"
        micMuted={false}
        getCandidateVolume={mockGetCandidateVolume}
      />
    );

    const tiles = container.querySelectorAll(".bg-slate-900");
    const candidateTile = tiles[1] as HTMLElement;
    expect(candidateTile).toBeInTheDocument();
    expect(candidateTile.style.borderColor).toBe("rgb(59, 130, 246)");
    expect(parseInt(candidateTile.style.borderWidth, 10)).toBeGreaterThanOrEqual(3);
  });
});
