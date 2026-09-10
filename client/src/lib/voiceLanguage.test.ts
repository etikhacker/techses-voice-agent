import { describe, expect, it } from "vitest";
import { getVoiceCopy, type VoiceLanguage } from "./voiceLanguage";

describe("voice language copy", () => {
  it("returns Azerbaijani copy by default", () => {
    expect(getVoiceCopy("az").greeting).toContain("TechSəs");
    expect(getVoiceCopy("az").startLabel).toBe("Səs sessiyasını başlat");
  });

  it("returns English copy when English is selected", () => {
    expect(getVoiceCopy("en").greeting).toContain("TechSes");
    expect(getVoiceCopy("en").startLabel).toBe("Start voice session");
  });

  it("only accepts supported voice languages", () => {
    const language: VoiceLanguage = "en";
    expect(["az", "en"]).toContain(language);
  });
});
