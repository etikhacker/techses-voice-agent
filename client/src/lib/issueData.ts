import type { VoiceLanguage } from "./voiceLanguage";

export type IssueId = "wifi" | "printer" | "windows" | "account";

export type Issue = {
  id: IssueId;
  label: string;
  shortLabel: string;
  prompt: string;
  response: string;
  action: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  color: string;
};

const issueRecords: Record<IssueId, { az: Omit<Issue, "id">; en: Omit<Issue, "id"> }> = {
  wifi: {
    az: {
      label: "Wi-Fi qoşulur, internet işləmir",
      shortLabel: "Wi-Fi",
      prompt: "Wi-Fi qoşulur, amma internet işləmir.",
      response:
        "Router bağlantısı görünür, lakin internet çıxışı yoxdur. Əvvəlcə router-i 30 saniyə söndürüb yenidən qoşaq, sonra digər cihazlarda əlaqəni yoxlayaq.",
      action: "Router-i 30 saniyə söndürüb yenidən yandır, sonra ikinci cihazda yoxla",
      category: "Şəbəkə",
      priority: "Medium",
      color: "mint",
    },
    en: {
      label: "Wi-Fi connected, no internet",
      shortLabel: "Wi-Fi",
      prompt: "Wi-Fi connects, but the internet does not work.",
      response:
        "The router connection is visible, but internet access is unavailable. Restart the router for 30 seconds, then check another device.",
      action: "Restart the router for 30 seconds and verify on a second device",
      category: "Network",
      priority: "Medium",
      color: "mint",
    },
  },
  printer: {
    az: {
      label: "Printer cavab vermir",
      shortLabel: "Printer",
      prompt: "Printer görünür, amma çap əmri getmir.",
      response:
        "Printer növbədə ilişib qala bilər. Print queue-nu təmizləyin, printeri yenidən başladın və Wi-Fi/kabel bağlantısını yoxlayın.",
      action: "Print queue-nu təmizlə, printeri yenidən başlat və şəbəkəni yoxla",
      category: "Avadanlıq",
      priority: "Medium",
      color: "sky",
    },
    en: {
      label: "Printer is not responding",
      shortLabel: "Printer",
      prompt: "The printer is visible, but the print job does not go through.",
      response:
        "The print queue may be stuck. Clear the queue, restart the printer, and check its network connection.",
      action: "Clear the print queue, restart the printer, and verify the network",
      category: "Hardware",
      priority: "Medium",
      color: "sky",
    },
  },
  windows: {
    az: {
      label: "Windows proqramı daim bağlanır",
      shortLabel: "Windows",
      prompt: "Windows-da proqram açılan kimi bağlanır.",
      response:
        "Bu, zədələnmiş cache və ya köhnə versiya ilə əlaqəli ola bilər. Proqramı yeniləyin, sonra cache-i təmizləyib yenidən başladın.",
      action: "Proqramı yenilə, cache-i təmizlə, Windows-u yenidən başlat",
      category: "Proqram təminatı",
      priority: "Low",
      color: "amber",
    },
    en: {
      label: "Windows app keeps crashing",
      shortLabel: "Windows",
      prompt: "A Windows app closes as soon as it opens.",
      response:
        "This may be caused by a damaged cache or an outdated version. Update the app, clear its cache, and restart Windows.",
      action: "Update the app, clear its cache, and restart Windows",
      category: "Software",
      priority: "Low",
      color: "amber",
    },
  },
  account: {
    az: {
      label: "Hesabıma daxil ola bilmirəm",
      shortLabel: "Hesab",
      prompt: "Hesabıma daxil ola bilmirəm, şifrəni də sıfırlaya bilmirəm.",
      response:
        "Hesab girişində təhlükəsizliyi qorumaq üçün əvvəlcə hesab sahibini təsdiqləmək lazımdır. Sonra password reset linki göndərilə bilər.",
      action: "Şəxsiyyəti təsdiqlə və şifrə sıfırlama linki göndər",
      category: "Giriş",
      priority: "High",
      color: "coral",
    },
    en: {
      label: "I cannot access my account",
      shortLabel: "Account",
      prompt: "I cannot access my account and cannot reset the password.",
      response:
        "Account access should be verified securely first. After verification, a password reset link can be sent.",
      action: "Verify identity and send password reset link",
      category: "Access",
      priority: "High",
      color: "coral",
    },
  },
};

export const issues: Issue[] = (Object.keys(issueRecords) as IssueId[]).map((id) => ({
  id,
  ...issueRecords[id].az,
}));

export const getIssue = (id: IssueId, language: VoiceLanguage = "az"): Issue => ({
  id,
  ...issueRecords[id][language],
});
