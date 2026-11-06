import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { OPPORTUNITY_TYPES } from "../../lib/jobSearchConstants";

// --- mocks -------------------------------------------------------------------

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

function makeChain() {
  const chain: Record<string, (...args: unknown[]) => unknown> = {};
  ["select", "eq", "order", "limit", "insert", "update", "delete"].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // Draft-check / handler-guide / submission-status lookups all end in
  // maybeSingle(), and "nothing found" is the right answer for all three in
  // this test (no stale draft, no handler guide, no submission row yet).
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
  // The only .single() call in this flow is the session insert.
  chain.single = vi.fn(() => Promise.resolve({ data: { id: "sess-1" }, error: null }));
  return chain;
}

vi.mock("../../lib/supabase", () => ({
  supabase: { from: vi.fn(() => makeChain()) },
}));

const mockInvokeFunction = vi.fn();
vi.mock("../../lib/invokeFunction", () => ({
  invokeFunction: (...args: unknown[]) => mockInvokeFunction(...args),
}));

const mockSubmitForReview = vi.fn();
vi.mock("../../lib/submitForReview", () => ({
  submitForReview: (...args: unknown[]) => mockSubmitForReview(...args),
}));

vi.mock("../../lib/careerProfile", () => ({
  loadProfileDefaults: () => Promise.resolve({ profile: null, target: null }),
}));

import JobSearchSupportPage from "./JobSearchSupportPage";

const FIRST_OPPORTUNITY_LABEL = OPPORTUNITY_TYPES[0][1];

// Each step's onStepAdvance (saveDraft) is async, so goNext doesn't move to
// the next question until that resolves — fireEvent.click alone doesn't wait
// for it. Waiting for the next step's own heading between clicks keeps this
// in lockstep with the real (async) navigation instead of racing it.
async function clickAndAwaitStep(buttonText: string, nextStepHeading: string) {
  fireEvent.click(screen.getByText(buttonText));
  await screen.findByText(nextStepHeading);
}

/** Drives the QuestionFlow wizard from the first question through to submit. */
async function completeWizard() {
  // field_or_industry — IndustrySelect, picked via "Other — not listed" so
  // this doesn't depend on the real INDUSTRIES list's contents.
  fireEvent.click(await screen.findByText("Search your industry…"));
  fireEvent.click(await screen.findByText("Other — not listed"));
  fireEvent.change(screen.getByLabelText("Your industry"), { target: { value: "Software Engineering" } });
  await clickAndAwaitStep("Next", "What are you looking for?");

  // opportunity_type — ChoiceGrid, pick the first real option.
  fireEvent.click(screen.getByText(FIRST_OPPORTUNITY_LABEL));
  await clickAndAwaitStep("Next", "Is this your first ever job search?");

  // has_no_experience, urgency, search_progress — none have a validate(),
  // their pre-filled defaults are already valid, just advance through them.
  await clickAndAwaitStep("Next", "How urgent is this?");
  await clickAndAwaitStep("Next", "How has the search gone so far?");
  await clickAndAwaitStep("Next", "Where and when?");

  // logistics, presence, specifics, unsure_about — all optional, skip them.
  await clickAndAwaitStep("Skip", "Your CV and LinkedIn");
  await clickAndAwaitStep("Skip", "A couple of specifics");
  await clickAndAwaitStep("Skip", "Anything you're unsure about?");
  await clickAndAwaitStep("Skip", "Choose your turnaround");

  // tier — default is already valid, advance.
  await clickAndAwaitStep("Next", "Ready to build your strategy");

  // summary — the final step's button carries the page's own completeLabel.
  fireEvent.click(screen.getByText("Get my strategy"));
}

describe("<JobSearchSupportPage> queue-failure retry", () => {
  beforeEach(() => {
    mockInvokeFunction.mockReset();
    mockSubmitForReview.mockReset();
    mockInvokeFunction.mockResolvedValue({ session: { id: "sess-1", student_strategy: {} } });
  });

  it("shows a retry banner when the Handler-queue submission fails, and clears it on a successful retry", async () => {
    mockSubmitForReview
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce("sub-1");

    render(
      <HelmetProvider>
        <MemoryRouter>
          <JobSearchSupportPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    await completeWizard();

    // The strategy still renders even though the queue attempt failed —
    // this was never gated on Handler submission succeeding.
    expect(await screen.findByText("Your situation")).toBeInTheDocument();
    // ...and the failure is surfaced instead of silently dropped.
    expect(await screen.findByText(/couldn't book your advisory session/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => {
      expect(screen.queryByText(/couldn't book your advisory session/i)).not.toBeInTheDocument();
    });
    expect(mockSubmitForReview).toHaveBeenCalledTimes(2);
  });

  it("shows no banner at all when the queue submission succeeds on the first try", async () => {
    mockSubmitForReview.mockResolvedValueOnce("sub-1");

    render(
      <HelmetProvider>
        <MemoryRouter>
          <JobSearchSupportPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    await completeWizard();

    expect(await screen.findByText("Your situation")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't book your advisory session/i)).not.toBeInTheDocument();
    expect(mockSubmitForReview).toHaveBeenCalledTimes(1);
  });
});
