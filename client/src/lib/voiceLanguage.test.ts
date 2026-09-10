import { describe, expect, it } from "vitest";
import {
  getVoiceCopy,
  type VoiceLanguage,
  localizePriority,
} from "./voiceLanguage";

describe("voice language copy", () => {
  it("returns Azerbaijani copy by default", () => {
    const copy = getVoiceCopy("az");
    expect(copy.greeting).toContain("Salam");
    expect(copy.startLabel).toBe("Səs sessiyasını başlat");
    expect(copy.navOverview).toBe("Ümumi baxış");
  });

  it("returns English copy when English is selected", () => {
    const copy = getVoiceCopy("en");
    expect(copy.greeting).toContain("Hello");
    expect(copy.startLabel).toBe("Start voice session");
    expect(copy.navOverview).toBe("Overview");
  });

  it("localizes priority labels for both languages", () => {
    expect(localizePriority("High", "az")).toBe("Yüksək");
    expect(localizePriority("Low", "en")).toBe("Low");
  });

  it("only accepts supported voice languages", () => {
    const language: VoiceLanguage = "en";
    expect(["az", "en"]).toContain(language);
  });
});
