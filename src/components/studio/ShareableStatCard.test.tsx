import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetMyStudioAvatar = vi.fn();
vi.mock("../../lib/studioMetrics", () => ({
  getMyStudioAvatar: (...args: unknown[]) => mockGetMyStudioAvatar(...args),
}));

import ShareableStatCard from "./ShareableStatCard";

const ITEMS = [
  { key: "mrr", label: "Estimated MRR", value: "€1,200" },
  { key: "active-subs", label: "Active Pro subscribers", value: "14", sub: "2 new this period" },
  { key: "margin", label: "UBP margin this period", value: "€900" },
];

describe("<ShareableStatCard>", () => {
  beforeEach(() => {
    mockGetMyStudioAvatar.mockReset();
    mockGetMyStudioAvatar.mockResolvedValue({ userId: "u1", fullName: "Wami", avatarUrl: null });
  });

  it("renders the hub label and every item's value/label inside the card", async () => {
    render(<ShareableStatCard hubLabel="Finance Hub" items={ITEMS} />);

    expect(await screen.findByText("Finance Hub")).toBeInTheDocument();
    expect(screen.getByText("€1,200")).toBeInTheDocument();
    expect(screen.getByText("ESTIMATED MRR")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("2 new this period")).toBeInTheDocument();
    expect(screen.getByText("€900")).toBeInTheDocument();

    // Download button appears once there is something real to export.
    expect(screen.getByRole("button", { name: /download stat card as png/i })).toBeInTheDocument();
  });

  it("shows a loading skeleton and no download button while loading", async () => {
    render(<ShareableStatCard hubLabel="Finance Hub" items={ITEMS} loading />);
    await mockGetMyStudioAvatar.mock.results[0].value.catch(() => {});
    expect(screen.queryByRole("img", { name: /finance hub stat card/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /download stat card as png/i })).not.toBeInTheDocument();
  });

  it("shows an honest empty state (no download button) when there are no real items yet", async () => {
    render(<ShareableStatCard hubLabel="Finance Hub" items={[]} />);
    expect(await screen.findByText(/nothing to show yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /download stat card as png/i })).not.toBeInTheDocument();
  });

  it("falls back to a generic name if the viewer's profile can't be read", async () => {
    mockGetMyStudioAvatar.mockRejectedValue(new Error("not signed in"));
    render(<ShareableStatCard hubLabel="Finance Hub" items={ITEMS} />);
    expect(await screen.findByText(/UniBlueprint Studio/)).toBeInTheDocument();
  });
});
