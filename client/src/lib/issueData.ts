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

export const issues: Issue[] = [
  {
    id: "wifi",
    label: "Wi-Fi connected, no internet",
    shortLabel: "Wi-Fi",
    prompt: "Wi-Fi qoşulur, amma internet işləmir.",
    response: "Router bağlantısı görünür, lakin internet çıxışı yoxdur. Əvvəlcə router-i 30 saniyə söndürüb yenidən qoşaq, sonra digər cihazlarda əlaqəni yoxlayaq.",
    action: "Restart router and verify on a second device",
    category: "Network",
    priority: "Medium",
    color: "mint",
  },
  {
    id: "printer",
    label: "Printer is not responding",
    shortLabel: "Printer",
    prompt: "Printer görünür, amma çap əmri getmir.",
    response: "Printer növbədə ilişib qala bilər. Print queue-nu təmizləyin, printeri yenidən başladın və Wi-Fi kabel bağlantısını yoxlayın.",
    action: "Clear print queue and reconnect printer",
    category: "Hardware",
    priority: "Medium",
    color: "sky",
  },
  {
    id: "windows",
    label: "Windows app keeps crashing",
    shortLabel: "Windows",
    prompt: "Windows-da proqram açılan kimi bağlanır.",
    response: "Bu, zədələnmiş cache və ya köhnə versiya ilə əlaqəli ola bilər. Proqramı yeniləyin, sonra cache-i təmizləyib yenidən başladın.",
    action: "Update app, clear cache, restart Windows",
    category: "Software",
    priority: "Low",
    color: "amber",
  },
  {
    id: "account",
    label: "I cannot access my account",
    shortLabel: "Account",
    prompt: "Hesabıma daxil ola bilmirəm, şifrəni də sıfırlaya bilmirəm.",
    response: "Hesab girişində təhlükəsizliyi qorumaq üçün əvvəlcə hesab sahibini təsdiqləmək lazımdır. Sonra password reset linki göndərilə bilər.",
    action: "Verify identity and send password reset",
    category: "Access",
    priority: "High",
    color: "coral",
  },
];

export const getIssue = (id: IssueId) => issues.find((issue) => issue.id === id) ?? issues[0];
