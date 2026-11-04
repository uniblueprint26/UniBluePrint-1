import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockGetActiveTeamUpdate = vi.fn();
vi.mock("../../lib/studioMetrics", () => ({
  getActiveTeamUpdate: (...args: unknown[]) => mockGetActiveTeamUpdate(...args),
}));

import TeamUpdateBell from "./TeamUpdateBell";

describe("<TeamUpdateBell>", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetActiveTeamUpdate.mockReset();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("shows no unread dot and a fallback message when nothing is posted", async () => {
    mockGetActiveTeamUpdate.mockResolvedValue({ value: null });
    render(<TeamUpdateBell hubKey="finance" />);

    const button = await screen.findByRole("button", { name: /hub updates/i });
    fireEvent.click(button);
    expect(await screen.findByText("Nothing posted here yet.")).toBeInTheDocument();
  });

  it("shows an unread dot for a new update, then clears it once opened", async () => {
    mockGetActiveTeamUpdate.mockResolvedValue({
      value: { id: "abc-123", message: "New FAQ section just shipped.", created_at: "2026-11-04T08:00:00Z" },
    });
    render(<TeamUpdateBell hubKey="finance" />);

    const button = await screen.findByRole("button", { name: /new update/i });
    fireEvent.click(button);
    expect(await screen.findByText("New FAQ section just shipped.")).toBeInTheDocument();

    // Marked seen in localStorage, and the button's accessible name drops the "new update" wording.
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("ubp-studio-updates-seen") || "[]")).toContain("abc-123");
    });
  });

  it("does not show an unread dot for an update already marked seen", async () => {
    localStorage.setItem("ubp-studio-updates-seen", JSON.stringify(["abc-123"]));
    mockGetActiveTeamUpdate.mockResolvedValue({
      value: { id: "abc-123", message: "New FAQ section just shipped.", created_at: "2026-11-04T08:00:00Z" },
    });
    render(<TeamUpdateBell hubKey="finance" />);

    await screen.findByRole("button", { name: /hub updates/i });
    expect(screen.queryByRole("button", { name: /new update/i })).not.toBeInTheDocument();
  });

  it("falls back gracefully if the RPC call fails", async () => {
    mockGetActiveTeamUpdate.mockRejectedValue(new Error("network error"));
    render(<TeamUpdateBell hubKey="finance" />);

    const button = await screen.findByRole("button", { name: /hub updates/i });
    fireEvent.click(button);
    expect(await screen.findByText("Nothing posted here yet.")).toBeInTheDocument();
  });
});
