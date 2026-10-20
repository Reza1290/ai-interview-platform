import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProfilePage from "../ProfilePage";
import { authApi } from "@/services/auth";

vi.mock("@/services/auth", () => ({
  authApi: {
    getMe: vi.fn(),
  },
}));

describe("ProfilePage - User Profile & Tenant Information", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user details, moved tenant profile section, and security compliance", async () => {
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      data: {
        user: {
          id: 1,
          email: "admin@example.com",
          role: "admin",
        },
        tenant: {
          id: "test-corp",
          name: "Test Corp",
        },
      },
    } as any);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify User Profile header
    expect(screen.getByRole("heading", { name: "User Profile" })).toBeInTheDocument();

    // Verify Account Details
    expect(screen.getByText("Account Details")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();

    // Verify Tenant Profile section moved from Settings
    await waitFor(() => {
      expect(screen.getByText("Tenant Profile")).toBeInTheDocument();
      expect(screen.getByText("Test Corp")).toBeInTheDocument();
      expect(screen.getByText("test-corp")).toBeInTheDocument();
    });

    // Verify Session Security
    expect(screen.getByText("Session Security")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log out/i })).toBeInTheDocument();
  });
});
