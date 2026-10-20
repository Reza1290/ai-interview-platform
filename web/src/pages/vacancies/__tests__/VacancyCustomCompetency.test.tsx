import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VacancyNewPage from "../VacancyNewPage";
import { vacanciesApi } from "@/services/vacancies";

vi.mock("@/services/vacancies", () => ({
  vacanciesApi: {
    create: vi.fn(),
  },
}));

vi.mock("@/services/skillTaxonomies", () => ({
  skillTaxonomiesApi: {
    list: vi.fn().mockResolvedValue({ data: { skill_taxonomies: [] } }),
  },
}));

describe("VacancyCustomCompetency Builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends custom competency requirement and submits with is_custom flag", async () => {
    vi.mocked(vacanciesApi.create).mockResolvedValue({ data: { vacancy: { id: 10 } } } as any);

    render(
      <MemoryRouter>
        <VacancyNewPage />
      </MemoryRouter>
    );

    // Fill role title
    const roleInput = screen.getByLabelText(/Role title/i);
    fireEvent.change(roleInput, { target: { value: "Lead Distributed Systems Engineer" } });

    // Click "Add Custom Competency"
    const addCustomBtn = screen.getByRole("button", { name: /Add Custom Competency/i });
    fireEvent.click(addCustomBtn);

    // Expect custom competency input to appear
    const customInput = screen.getByPlaceholderText(/e\.g\. Distributed Consensus, Domain-Driven Design/i);
    expect(customInput).toBeInTheDocument();

    fireEvent.change(customInput, { target: { value: "Consensus Algorithms" } });

    // Submit the vacancy
    const submitBtn = screen.getByRole("button", { name: /Save Vacancy/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(vacanciesApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role_title: "Lead Distributed Systems Engineer",
          vacancy_skills_attributes: [
            expect.objectContaining({
              skill_label: "Consensus Algorithms",
              is_custom: true,
              expected_level: 3,
            }),
          ],
        })
      );
    });
  });
});
