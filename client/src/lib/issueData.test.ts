import { describe, expect, it } from "vitest";
import { getIssue, issues } from "./issueData";

describe("TechSəs issue catalog", () => {
  it("returns the selected issue with a ticket-ready action (English)", () => {
    const issue = getIssue("wifi", "en");

    expect(issue.category).toBe("Network");
    expect(issue.action).toContain("router");
  });

  it("returns the Azerbaijani issue by default for the quick-start cards", () => {
    const issue = getIssue("wifi", "az");

    expect(issue.category).toBe("Şəbəkə");
    expect(issue.action).toMatch(/router/i);
  });

  it("contains the four MVP support paths", () => {
    expect(issues.map((issue) => issue.id)).toEqual(["wifi", "printer", "windows", "account"]);
  });
});
