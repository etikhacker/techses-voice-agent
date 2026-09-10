export type VoiceLanguage = "az" | "en";

export const voiceLanguages: Array<{ value: VoiceLanguage; label: string; shortLabel: string }> = [
  { value: "az", label: "Azərbaycan dili", shortLabel: "AZ" },
  { value: "en", label: "English", shortLabel: "EN" },
];

const copy = {
  az: {
    greeting: "Salam, mən TechSəsəm. Kompüter problemini danış, birlikdə həll edək.",
    startLabel: "Səs sessiyasını başlat",
    finishLabel: "Danışığı bitir",
    typeInstead: "Yazaraq daxil et",
    typePlaceholder: "Problemini yaz...",
    send: "Göndər",
    language: "Səs dili",
    demoEnvironment: "Demo mühiti",
    demoFallback: "Demo rejimi aktivdir",
    noInput: "Mesaj yaz və ya səs sessiyasını başlat.",
    helpTitle: "TechSəs haqqında",
    helpText: "TechSəs IT problemlərini səsli şəkildə analiz edir və ticket xülasəsi hazırlayır.",
    notificationsTitle: "Bildirişlər",
    noNotifications: "Hazırda yeni bildiriş yoxdur.",
  },
  en: {
    greeting: "Hi, I’m TechSes. Tell me about your computer problem and we’ll solve it together.",
    startLabel: "Start voice session",
    finishLabel: "Finish speaking",
    typeInstead: "Type instead",
    typePlaceholder: "Describe your issue...",
    send: "Send",
    language: "Voice language",
    demoEnvironment: "Demo environment",
    demoFallback: "Demo fallback active",
    noInput: "Type a message or start a voice session.",
    helpTitle: "About TechSes",
    helpText: "TechSes analyzes IT issues through voice and prepares structured ticket summaries.",
    notificationsTitle: "Notifications",
    noNotifications: "There are no new notifications.",
  },
} as const;

export type VoiceCopy = (typeof copy)[VoiceLanguage];

export const getVoiceCopy = (language: VoiceLanguage): VoiceCopy => copy[language];
