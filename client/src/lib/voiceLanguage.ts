export type VoiceLanguage = "az" | "en";

export const voiceLanguages: Array<{
  value: VoiceLanguage;
  label: string;
  shortLabel: string;
}> = [
  { value: "az", label: "Azərbaycan dili", shortLabel: "AZ" },
  { value: "en", label: "English", shortLabel: "EN" },
];

export type ViewKey =
  | "overview"
  | "voiceSessions"
  | "tickets"
  | "knowledge"
  | "settings";

const copy = {
  az: {
    // Brand & sidebar
    brandSubtitle: "Dəstək konsolu",
    navWorkspace: "İş sahəsi",
    navOverview: "Ümumi baxış",
    navVoiceSessions: "Səs sessiyaları",
    navTickets: "Ticketlər",
    navKnowledge: "Bilik bazası",
    navSettings: "Parametrlər",
    systemHealth: "Sistem vəziyyəti",
    allSystemsOk: "Bütün sistemlər işləyir",
    voiceLayerReady: "Səs qatı yeni sessiya üçün hazırdır.",
    builderAccount: "Builder hesabı",

    // Topbar
    demoBadge: "Demo mühiti",
    liveBadge: "AssemblyAI canlı",
    readyBadge: "AssemblyAI hazırdır",
    helpTitle: "TechSəs haqqında",
    helpText:
      "TechSəs IT problemlərini səsli şəkildə analiz edir və ticket xülasəsi hazırlayır.",
    notificationsTitle: "Bildirişlər",
    noNotifications: "Hazırda yeni bildiriş yoxdur.",
    closeLabel: "Bağla",
    helpAria: "Kömək",
    notificationsAria: "Bildirişlər",

    // Hero
    greeting: "Salam, {name}",
    heroLine1: "IT problemlərini",
    heroLine2: "daha az texniki hiss etdir.",
    resetSession: "Sessiyanı sıfırla",

    // Voice card
    stateReadyEyebrow: "HAZIRDIR",
    stateReadyTitle: "Sizə necə kömək edim?",
    stateReadyDescription: "Söhbətə başlayın və ya aşağıdan problemi seçin.",
    stateListeningEyebrow: "DİNLƏYİRƏM",
    stateListeningTitle: "Sizi dinləyirəm…",
    stateListeningDescription: "Baş verənləri öz sözlərinizlə təsvir edin.",
    stateThinkingEyebrow: "ANALİZ EDİRƏM",
    stateThinkingTitle: "Məlumatları əlaqələndirirəm…",
    stateThinkingDescription: "Problemi yoxlayıb növbəti addımı hazırlayıram.",
    stateRespondedEyebrow: "CAVAB HAZIRDIR",
    stateRespondedTitle: "Növbəti addım budur",
    stateRespondedDescription: "Tövsiyəni yoxlayın və ticket xülasəsi yaradın.",
    liveAudio: "Canlı səs sessiyası",
    demoFallback: "Demo rejimi aktivdir",
    startLabel: "Səs sessiyasını başlat",
    finishLabel: "Danışığı bitir",
    typeInstead: "Yazaraq daxil et",
    typePlaceholder: "Problemini yaz...",
    send: "Göndər",
    typeAriaLabel: "Mesajı yaz",
    liveErrorHint: "Aşağıdakı problem kartlarından istifadə edə bilərsiniz.",

    // Quick start
    quickStart: "Sürətli başlanğıc",
    whatsGoingOn: "Problem nədir?",
    viewAll: "Hamısına bax",
    viewLess: "Daha az göstər",
    showAllIssues: "Bütün problem kateqoriyaları",
    hideAllIssues: "Siyahını bağla",

    // Transcript panel
    liveTranscript: "Canlı transkript",
    conversation: "Söhbət",
    eventsCount: (n: number) => `${n} hadisə`,
    roleAssistant: "TechSəs",
    roleUser: "Siz",
    voiceStandingBy: "Səs agenti hazır gözləyir",
    liveTyping: "Canlı yazır",
    noMessages:
      "Hələ ki, mesaj yoxdur. Səs sessiyasını başladın və ya problem seçin.",

    // Ticket panel
    ticketDraft: "Ticket layihəsi",
    readyToSummarize: "Xülasə üçün hazırdır",
    ticketCreated: "Ticket yaradıldı",
    suggestedNextStep: "Tövsiyə olunan növbəti addım:",
    createTicket: "Ticket xülasəsi yarat",
    draftSaved: "Ticket ticketlərə saxlanıldı",
    audioSecureLive: "Audio təhlükəsiz şəkildə AssemblyAI-ya ötürülür",
    audioSecureDemo: "Demo rejimi — heç bir audio göndərilmir",
    priority: { Low: "Aşağı", Medium: "Orta", High: "Yüksək" } as Record<
      "Low" | "Medium" | "High",
      string
    >,

    // Toasts
    ticketToastTitle: "Ticket xülasəsi yaradıldı",
    ticketToastDescription: "İş sahənizə saxlanıldı.",
    voiceSessionsToastTitle: "Səs sessiyaları",
    voiceSessionsToastDescription:
      "Bu bölmə hazırlanır, tezliklə əlçatan olacaq.",
    knowledgeToastTitle: "Bilik bazası",
    knowledgeToastDescription: "Aşağıya bax — ən çox verilən suallar.",
    settingsToastTitle: "Parametrlər",
    settingsToastDescription: "Dil və səs parametrlərini idarə edin.",
    closeNotification: "Bildirişi bağla",

    // Footer
    footerTagline: "TechSəs / Səs ilə idarə olunan IT dəstəyi",
    footerHackathon: "AssemblyAI Hakatonu üçün hazırlanıb",

    // Sessions header
    sessionDateLabel: "Bugünkü sessiyalar",
    sessionDate: (formatted: string) => formatted,

    // Views — Voice sessions
    sessionsHeading: "Səs sessiyaları",
    sessionsDescription: "Son səsli söhbətlər və onların nəticələri.",
    sessionsEmpty:
      "Hələ ki, başa çatmış sessiya yoxdur. Səs sessiyasını başladın.",
    sessionsItemTranscript: "Transkript",
    sessionsItemDuration: "Müddət",
    sessionsItemStatus: "Status",
    sessionsStatusCompleted: "Tamamlandı",
    sessionsStatusDemo: "Demo",
    sessionsStatusLive: "Canlı",
    sessionsActionOpen: "Aç",
    sessionsActionRestart: "Yenidən başlat",
    sessionsRestarted: "Sessiya yenidən başladıldı",
    sessionsEmptyNote: "Tamamlanmış sessiyalar burada görünəcək.",

    // Views — Tickets
    ticketsHeading: "Ticketlər",
    ticketsDescription: "Yaradılmış ticket xülasələri və prioritetləri.",
    ticketsEmpty:
      'Hələ ki, ticket yoxdur. Söhbət bitdikdən sonra "Ticket xülasəsi yarat" düyməsini basın.',
    ticketsCount: (n: number) => `${n} ticket`,
    ticketNumber: (id: string) =>
      `${id.toUpperCase()}-${(Math.floor(Math.random() * 9000) + 1000).toString()}`,
    ticketStage: "Mərhələ",
    ticketStageDraft: "Layihə",
    ticketStageInProgress: "İcradadır",
    ticketStageClosed: "Bağlı",
    ticketAction: "Addım",

    // Views — Knowledge base
    kbHeading: "Bilik bazası",
    kbDescription: "Ən çox rast gəlinən IT problemləri və onların həlli.",
    kbFaq: "Tez-tez verilən suallar",
    kbFaqItems: [
      {
        q: "Mikrofonum işləmir, nə edim?",
        a: "Brauzerin mikrofon icazəsini yoxlayın. Səhifəni yeniləyin və sessiyanı yenidən başladın.",
      },
      {
        q: "Canlı rejimə necə keçə bilərəm?",
        a: '"Səs sessiyasını başlat" düyməsini basdıqda, sistem avtomatik olaraq canlı rejimə keçir.',
      },
      {
        q: "Ticket xülasəsini necə saxlayım?",
        a: 'Söhbət bitdikdən sonra "Ticket xülasəsi yarat" düyməsini basın — ticket Tickets bölməsinə əlavə olunur.',
      },
      {
        q: "Dilim dəstəklənir?",
        a: "Hazırda Azərbaycan və İngilis dilləri dəstəklənir. Daha çox dil tezliklə əlavə olunacaq.",
      },
    ] as Array<{ q: string; a: string }>,

    // Views — Settings
    settingsHeading: "Parametrlər",
    settingsDescription: "Səs, dil və sessiya üçün üstünlükləri idarə edin.",
    settingsLanguage: "Səs dili",
    settingsLanguageDescription: "Səs agentinin və interfeysın dili.",
    settingsVolume: "Səs səviyyəsi",
    settingsVolumeDescription: "0-100 arası cavab səsini tənzimləyin.",
    settingsAutoSpeak: "Cavabları avtomatik səsləndir",
    settingsAutoSpeakDescription: "Səs agentinin cavabları avtomatik oxunsun.",
    settingsSave: "Yadda saxla",
    settingsSaved: "Parametrlər yadda saxlanıldı",
    settingsReset: "Standarta qaytar",
    settingsResetDone: "Parametrlər standarta qaytarıldı",

    // Voice session greeting (chat bootstrap)
    chatBootstrap:
      "Salam, {name}. Kompüter problemini təsvir et — mən diaqnostikanı başladım.",
    chatReset: "Yeni sessiya hazırdır. Problemini mənə danışa bilərsən.",

    // Generic
    language: "Səs dili",
    demoEnvironment: "Demo mühiti",
    noInput: "Mesaj yaz və ya səs sessiyasını başlat.",
    today: "Bu gün",
  },
  en: {
    // Brand & sidebar
    brandSubtitle: "Support console",
    navWorkspace: "Workspace",
    navOverview: "Overview",
    navVoiceSessions: "Voice sessions",
    navTickets: "Tickets",
    navKnowledge: "Knowledge base",
    navSettings: "Settings",
    systemHealth: "System health",
    allSystemsOk: "All systems operational",
    voiceLayerReady: "Voice layer is ready for a new session.",
    builderAccount: "Builder account",

    // Topbar
    demoBadge: "Demo environment",
    liveBadge: "AssemblyAI live",
    readyBadge: "AssemblyAI-ready",
    helpTitle: "About TechSes",
    helpText:
      "TechSes analyzes IT issues through voice and prepares structured ticket summaries.",
    notificationsTitle: "Notifications",
    noNotifications: "There are no new notifications.",
    closeLabel: "Close",
    helpAria: "Help",
    notificationsAria: "Notifications",

    // Hero
    greeting: "Hello, {name}",
    heroLine1: "Make IT issues",
    heroLine2: "feel less technical.",
    resetSession: "Reset session",

    // Voice card
    stateReadyEyebrow: "READY WHEN YOU ARE",
    stateReadyTitle: "How can I help?",
    stateReadyDescription:
      "Start a conversation or choose a common issue below.",
    stateListeningEyebrow: "LISTENING NOW",
    stateListeningTitle: "I'm listening…",
    stateListeningDescription: "Describe what's happening in your own words.",
    stateThinkingEyebrow: "ANALYZING SIGNAL",
    stateThinkingTitle: "Connecting the dots…",
    stateThinkingDescription:
      "Checking the issue pattern and preparing a next step.",
    stateRespondedEyebrow: "RESPONSE READY",
    stateRespondedTitle: "Here's the next move",
    stateRespondedDescription:
      "Review the recommendation, then create a ticket summary.",
    liveAudio: "Live audio session",
    demoFallback: "Demo fallback active",
    startLabel: "Start voice session",
    finishLabel: "Finish speaking",
    typeInstead: "Type instead",
    typePlaceholder: "Describe your issue...",
    send: "Send",
    typeAriaLabel: "Type a message",
    liveErrorHint: "You can still use the issue shortcuts below.",

    // Quick start
    quickStart: "Quick start",
    whatsGoingOn: "What's going on?",
    viewAll: "View all",
    viewLess: "View less",
    showAllIssues: "All issue categories",
    hideAllIssues: "Hide list",

    // Transcript panel
    liveTranscript: "Live transcript",
    conversation: "Conversation",
    eventsCount: (n: number) => `${n} events`,
    roleAssistant: "TechSes",
    roleUser: "You",
    voiceStandingBy: "Voice agent is standing by",
    liveTyping: "Live typing",
    noMessages: "No messages yet. Start a voice session or pick an issue.",

    // Ticket panel
    ticketDraft: "Ticket draft",
    readyToSummarize: "Ready to summarize",
    ticketCreated: "Ticket created",
    suggestedNextStep: "Suggested next step:",
    createTicket: "Create ticket summary",
    draftSaved: "Draft saved to tickets",
    audioSecureLive: "Audio streamed securely to AssemblyAI",
    audioSecureDemo: "Demo mode — no audio is sent",
    priority: { Low: "Low", Medium: "Medium", High: "High" } as Record<
      "Low" | "Medium" | "High",
      string
    >,

    // Toasts
    ticketToastTitle: "Ticket summary created",
    ticketToastDescription: "Saved to your workspace.",
    voiceSessionsToastTitle: "Voice sessions",
    voiceSessionsToastDescription:
      "This section is being prepared and will be available soon.",
    knowledgeToastTitle: "Knowledge base",
    knowledgeToastDescription: "See the most common questions below.",
    settingsToastTitle: "Settings",
    settingsToastDescription: "Manage language and voice preferences.",
    closeNotification: "Close notification",

    // Footer
    footerTagline: "TechSes / Voice-first IT support",
    footerHackathon: "Built for AssemblyAI Hackathon",

    // Sessions header
    sessionDateLabel: "Today's sessions",
    sessionDate: (formatted: string) => formatted,

    // Views — Voice sessions
    sessionsHeading: "Voice sessions",
    sessionsDescription: "Recent voice conversations and their outcomes.",
    sessionsEmpty: "No completed sessions yet. Start a voice session.",
    sessionsItemTranscript: "Transcript",
    sessionsItemDuration: "Duration",
    sessionsItemStatus: "Status",
    sessionsStatusCompleted: "Completed",
    sessionsStatusDemo: "Demo",
    sessionsStatusLive: "Live",
    sessionsActionOpen: "Open",
    sessionsActionRestart: "Restart",
    sessionsRestarted: "Session restarted",
    sessionsEmptyNote: "Completed sessions will appear here.",

    // Views — Tickets
    ticketsHeading: "Tickets",
    ticketsDescription: "Created ticket summaries and their priorities.",
    ticketsEmpty:
      'No tickets yet. After a conversation ends, click "Create ticket summary".',
    ticketsCount: (n: number) => `${n} tickets`,
    ticketNumber: (id: string) =>
      `${id.toUpperCase()}-${(Math.floor(Math.random() * 9000) + 1000).toString()}`,
    ticketStage: "Stage",
    ticketStageDraft: "Draft",
    ticketStageInProgress: "In progress",
    ticketStageClosed: "Closed",
    ticketAction: "Action",

    // Views — Knowledge base
    kbHeading: "Knowledge base",
    kbDescription: "Most common IT problems and how to solve them.",
    kbFaq: "Frequently asked questions",
    kbFaqItems: [
      {
        q: "My microphone is not working, what should I do?",
        a: "Check your browser's microphone permission. Reload the page and start the session again.",
      },
      {
        q: "How do I switch to live mode?",
        a: 'When you press "Start voice session", the system automatically switches to live mode.',
      },
      {
        q: "How do I save a ticket summary?",
        a: 'After the conversation ends, click "Create ticket summary" — the ticket is added to the Tickets view.',
      },
      {
        q: "Is my language supported?",
        a: "Azerbaijani and English are currently supported. More languages will be added soon.",
      },
    ] as Array<{ q: string; a: string }>,

    // Views — Settings
    settingsHeading: "Settings",
    settingsDescription: "Manage preferences for voice, language, and session.",
    settingsLanguage: "Voice language",
    settingsLanguageDescription: "The voice agent and interface language.",
    settingsVolume: "Volume",
    settingsVolumeDescription: "Adjust the response volume from 0 to 100.",
    settingsAutoSpeak: "Auto-play responses",
    settingsAutoSpeakDescription:
      "Read out the voice agent's responses automatically.",
    settingsSave: "Save",
    settingsSaved: "Preferences saved",
    settingsReset: "Reset to defaults",
    settingsResetDone: "Preferences reset to defaults",

    // Voice session greeting (chat bootstrap)
    chatBootstrap:
      "Hi {name}, describe your computer problem and I'll start the diagnosis.",
    chatReset: "A new session is ready. Tell me what's happening.",

    // Generic
    language: "Voice language",
    demoEnvironment: "Demo environment",
    noInput: "Type a message or start a voice session.",
    today: "Today",
  },
} as const;

export type VoiceCopy = {
  brandSubtitle: string;
  navWorkspace: string;
  navOverview: string;
  navVoiceSessions: string;
  navTickets: string;
  navKnowledge: string;
  navSettings: string;
  systemHealth: string;
  allSystemsOk: string;
  voiceLayerReady: string;
  builderAccount: string;
  demoBadge: string;
  liveBadge: string;
  readyBadge: string;
  helpTitle: string;
  helpText: string;
  notificationsTitle: string;
  noNotifications: string;
  closeLabel: string;
  helpAria: string;
  notificationsAria: string;
  greeting: string;
  heroLine1: string;
  heroLine2: string;
  resetSession: string;
  stateReadyEyebrow: string;
  stateReadyTitle: string;
  stateReadyDescription: string;
  stateListeningEyebrow: string;
  stateListeningTitle: string;
  stateListeningDescription: string;
  stateThinkingEyebrow: string;
  stateThinkingTitle: string;
  stateThinkingDescription: string;
  stateRespondedEyebrow: string;
  stateRespondedTitle: string;
  stateRespondedDescription: string;
  liveAudio: string;
  demoFallback: string;
  startLabel: string;
  finishLabel: string;
  typeInstead: string;
  typePlaceholder: string;
  send: string;
  typeAriaLabel: string;
  liveErrorHint: string;
  quickStart: string;
  whatsGoingOn: string;
  viewAll: string;
  viewLess: string;
  showAllIssues: string;
  hideAllIssues: string;
  liveTranscript: string;
  conversation: string;
  eventsCount: (n: number) => string;
  roleAssistant: string;
  roleUser: string;
  voiceStandingBy: string;
  liveTyping: string;
  noMessages: string;
  ticketDraft: string;
  readyToSummarize: string;
  ticketCreated: string;
  suggestedNextStep: string;
  createTicket: string;
  draftSaved: string;
  audioSecureLive: string;
  audioSecureDemo: string;
  priority: Record<"Low" | "Medium" | "High", string>;
  ticketToastTitle: string;
  ticketToastDescription: string;
  voiceSessionsToastTitle: string;
  voiceSessionsToastDescription: string;
  knowledgeToastTitle: string;
  knowledgeToastDescription: string;
  settingsToastTitle: string;
  settingsToastDescription: string;
  closeNotification: string;
  footerTagline: string;
  footerHackathon: string;
  sessionDateLabel: string;
  sessionDate: (formatted: string) => string;
  sessionsHeading: string;
  sessionsDescription: string;
  sessionsEmpty: string;
  sessionsItemTranscript: string;
  sessionsItemDuration: string;
  sessionsItemStatus: string;
  sessionsStatusCompleted: string;
  sessionsStatusDemo: string;
  sessionsStatusLive: string;
  sessionsActionOpen: string;
  sessionsActionRestart: string;
  sessionsRestarted: string;
  sessionsEmptyNote: string;
  ticketsHeading: string;
  ticketsDescription: string;
  ticketsEmpty: string;
  ticketsCount: (n: number) => string;
  ticketNumber: (id: string) => string;
  ticketStage: string;
  ticketStageDraft: string;
  ticketStageInProgress: string;
  ticketStageClosed: string;
  ticketAction: string;
  kbHeading: string;
  kbDescription: string;
  kbFaq: string;
  kbFaqItems: Array<{ q: string; a: string }>;
  settingsHeading: string;
  settingsDescription: string;
  settingsLanguage: string;
  settingsLanguageDescription: string;
  settingsVolume: string;
  settingsVolumeDescription: string;
  settingsAutoSpeak: string;
  settingsAutoSpeakDescription: string;
  settingsSave: string;
  settingsSaved: string;
  settingsReset: string;
  settingsResetDone: string;
  chatBootstrap: string;
  chatReset: string;
  language: string;
  demoEnvironment: string;
  noInput: string;
  today: string;
};

export const getVoiceCopy = (language: VoiceLanguage): VoiceCopy =>
  copy[language];

export const localizePriority = (
  priority: "Low" | "Medium" | "High",
  language: VoiceLanguage
) => copy[language].priority[priority];
