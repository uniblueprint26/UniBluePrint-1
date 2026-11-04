import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FaqSection from "./FaqSection";
import { GENERAL_FAQS, FAQS, getFaqPool } from "./faqs";
import { HUB_REGISTRY } from "./hubRegistry";

describe("faqs.js content", () => {
  it("has a non-empty hub-specific pool for every hub in HUB_REGISTRY", () => {
    for (const hubKey of Object.keys(HUB_REGISTRY)) {
      expect(getFaqPool(hubKey).length, `hub "${hubKey}" has no FAQ entries`).toBeGreaterThan(0);
    }
  });

  it("every question/answer entry is real text, not a placeholder", () => {
    const allEntries = [...GENERAL_FAQS, ...Object.values(FAQS).flat()];
    for (const { q, a } of allEntries) {
      expect(q.trim().length).toBeGreaterThan(0);
      expect(a.trim().length).toBeGreaterThan(10);
    }
  });

  it("falls back to an empty array (not a crash) for an unknown hub key", () => {
    expect(getFaqPool("not-a-real-hub")).toEqual([]);
  });
});

describe("<FaqSection>", () => {
  it("renders the general pool plus the hub's own questions, collapsed by default", () => {
    render(<FaqSection id="fn-faq" hubKey="finance" />);

    expect(screen.getByText("FAQ")).toBeInTheDocument();
    // one general question (shared by every hub) ...
    expect(screen.getByText(GENERAL_FAQS[0].q)).toBeInTheDocument();
    // ... and one finance-specific question.
    expect(screen.getByText(FAQS.finance[0].q)).toBeInTheDocument();

    // Answers exist in the DOM (native <details>) but aren't visible until opened.
    const firstAnswer = screen.getByText(GENERAL_FAQS[0].a);
    expect(firstAnswer.closest("details")).not.toHaveAttribute("open");
  });

  it("opens an item on click, revealing its answer", () => {
    render(<FaqSection id="fn-faq" hubKey="finance" />);
    const question = screen.getByText(GENERAL_FAQS[0].q);
    const details = question.closest("details")!;

    expect(details).not.toHaveAttribute("open");
    fireEvent.click(question);
    expect(details).toHaveAttribute("open");
  });

  it("still renders (general pool only) for a hub with no specific entries", () => {
    render(<FaqSection id="x-faq" hubKey="not-a-real-hub" />);
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText(GENERAL_FAQS[0].q)).toBeInTheDocument();
  });
});
