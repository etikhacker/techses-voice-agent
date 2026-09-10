import { describe, expect, it } from "vitest";
import { getIssue, issues } from "./issueData";

describe("TechSəs issue catalog", () => {
  it("returns the selected issue with a ticket-ready action", () => {
    const issue = getIssue("wifi");

    expect(issue.category).toBe("Network");
    expect(issue.action).toContain("router");
  });

  it("contains the four MVP support paths", () => {
    expect(issues.map((issue) => issue.id)).toEqual(["wifi", "printer", "windows", "account"]);
  });
});
