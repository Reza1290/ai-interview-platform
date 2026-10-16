import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AssessorLayout from "../AssessorLayout";

describe("AssessorLayout - Sidebar Navigation (UI-02)", () => {
  it("renders sidebar with navigation links to Assessments, Vacancies, and Settings", () => {
    render(
      <MemoryRouter initialEntries={["/assessments"]}>
        <Routes>
          <Route element={<AssessorLayout />}>
            <Route path="/assessments" element={<div>Assessments Content</div>} />
            <Route path="/vacancies" element={<div>Vacancies Content</div>} />
            <Route path="/settings" element={<div>Settings Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Assessments/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vacancies/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/i })).toBeInTheDocument();
    expect(screen.getByText("Assessments Content")).toBeInTheDocument();
  });

  it("toggles sidebar collapsed state on button click", () => {
    render(
      <MemoryRouter initialEntries={["/assessments"]}>
        <Routes>
          <Route element={<AssessorLayout />}>
            <Route path="/assessments" element={<div>Assessments Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const sidebar = screen.getByTestId("sidebar");
    const toggleButton = screen.getByTestId("sidebar-toggle");

    expect(sidebar).toHaveClass("w-64");

    fireEvent.click(toggleButton);
    expect(sidebar).toHaveClass("w-16");

    fireEvent.click(toggleButton);
    expect(sidebar).toHaveClass("w-64");
  });
});
