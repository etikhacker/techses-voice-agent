import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  Mic,
  MoreHorizontal,
  Network,
  Pause,
  Printer,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Ticket,
  UserRound,
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getIssue,
  issues as allIssues,
  type Issue,
  type IssueId,
} from "@/lib/issueData";
import { trpc } from "@/lib/trpc";
import {
  getVoiceCopy,
  localizePriority,
  voiceLanguages,
  type ViewKey,
  type VoiceLanguage,
} from "@/lib/voiceLanguage";

type SessionState = "ready" | "listening" | "thinking" | "responded";
type ChatItem = { role: "user" | "assistant"; text: string; time: string };
type CreatedTicket = {
  id: string;
  issue: Issue;
  createdAt: string;
  language: VoiceLanguage;
};
type SessionLog = {
  id: string;
  issueId: IssueId;
  startedAt: string;
  durationSeconds: number;
  language: VoiceLanguage;
  status: "live" | "demo" | "completed";
};

const iconForIssue = (id: IssueId) =>
  ({
    wifi: Wifi,
    printer: Printer,
    windows: SquareTerminal,
    account: ShieldCheck,
  })[id];

const timeNow = () =>
  new Intl.DateTimeFormat("az-AZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
const dateLong = () =>
  new Intl.DateTimeFormat(languageForDate(), {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

function languageForDate() {
  if (
    typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("en")
  )
    return "en-GB";
  return "az-AZ";
}

const pcmBase64 = (samples: Float32Array) => {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  samples.forEach((sample, index) =>
    view.setInt16(index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true)
  );
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 1)
    binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
};

const audioFromBase64 = (encoded: string) => {
  const binary = atob(encoded);
  const samples = new Int16Array(binary.length / 2);
  for (let index = 0; index < samples.length; index += 1)
    samples[index] =
      binary.charCodeAt(index * 2) | (binary.charCodeAt(index * 2 + 1) << 8);
  return samples;
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
};

export default function Home() {
  const [sessionState, setSessionState] = useState<SessionState>("ready");
  const [activeIssueId, setActiveIssueId] = useState<IssueId>("wifi");
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [showToast, setShowToast] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [connectionMode, setConnectionMode] = useState<"demo" | "live">("demo");
  const [liveError, setLiveError] = useState<string | null>(null);
  const [language, setLanguage] = useState<VoiceLanguage>("az");
  const [draftText, setDraftText] = useState("");
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [createdTickets, setCreatedTickets] = useState<CreatedTicket[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [volume, setVolume] = useState(85);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const sessionStartedAt = useRef<number | null>(null);
  const createVoiceToken = trpc.voiceAgent.createToken.useQuery(undefined, {
    enabled: false,
  });
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef(0);
  const sessionReadyRef = useRef(false);
  const voiceCopy = getVoiceCopy(language);

  // Initialize chat with the localized greeting on language change.
  useEffect(() => {
    setChat([
      {
        role: "assistant",
        text: voiceCopy.chatBootstrap.replace("{name}", "Omar"),
        time: timeNow(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const activeIssue = useMemo(
    () => getIssue(activeIssueId, language),
    [activeIssueId, language]
  );
  const localizedIssues = useMemo(
    () => allIssues.map(issue => getIssue(issue.id, language)),
    [language]
  );

  const stopLiveAudio = () => {
    sessionReadyRef.current = false;
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    playbackContextRef.current?.close();
    processorRef.current = null;
    sourceRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    playbackContextRef.current = null;
  };

  const playAgentAudio = (encoded: string) => {
    const samples = audioFromBase64(encoded);
    const context =
      playbackContextRef.current ?? new AudioContext({ sampleRate: 24000 });
    playbackContextRef.current = context;
    const buffer = context.createBuffer(1, samples.length, 24000);
    const channel = buffer.getChannelData(0);
    samples.forEach((sample, index) => {
      channel[index] = (sample / 0x7fff) * (volume / 100);
    });
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime, nextPlaybackTimeRef.current);
    source.start(startAt);
    nextPlaybackTimeRef.current = startAt + buffer.duration;
  };

  const startMicrophone = (stream: MediaStream, socket: WebSocket) => {
    const context = new AudioContext({ sampleRate: 24000 });
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = event => {
      if (!sessionReadyRef.current || socket.readyState !== WebSocket.OPEN)
        return;
      socket.send(
        JSON.stringify({
          type: "input.audio",
          audio: pcmBase64(event.inputBuffer.getChannelData(0)),
        })
      );
    };
    source.connect(processor);
    processor.connect(context.destination);
    audioContextRef.current = context;
    sourceRef.current = source;
    processorRef.current = processor;
  };

  useEffect(() => {
    if (sessionState !== "thinking" || connectionMode !== "demo") return;
    const timeout = window.setTimeout(() => {
      setChat(current => [
        ...current,
        { role: "assistant", text: activeIssue.response, time: timeNow() },
      ]);
      setSessionState("responded");
    }, 850);
    return () => window.clearTimeout(timeout);
  }, [activeIssue, sessionState, connectionMode]);

  const logSession = (status: SessionLog["status"]) => {
    if (sessionStartedAt.current === null) return;
    const seconds = Math.max(
      1,
      Math.round((Date.now() - sessionStartedAt.current) / 1000)
    );
    setSessionLogs(current => [
      {
        id: `s-${Date.now().toString(36)}`,
        issueId: activeIssueId,
        startedAt: new Date().toLocaleTimeString(languageForDate(), {
          hour: "2-digit",
          minute: "2-digit",
        }),
        durationSeconds: seconds,
        language,
        status,
      },
      ...current,
    ]);
    sessionStartedAt.current = null;
  };

  const startListening = async () => {
    setActiveView("overview");
    setTicketCreated(false);
    setLiveError(null);
    setSessionState("listening");
    sessionStartedAt.current = Date.now();

    try {
      const directResponse = await fetch("/api/voice-agent-token");
      const tokenResult = directResponse.ok
        ? ((await directResponse.json()) as { token?: string })
        : (await createVoiceToken.refetch()).data;
      const token = tokenResult?.token;
      if (!token)
        throw new Error(
          language === "az"
            ? "Müvəqqəti AssemblyAI tokeni alınmadı."
            : "Temporary AssemblyAI token was not received."
        );
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          language === "az"
            ? "Bu brauzer mikrofon girişini dəstəkləmir."
            : "This browser does not support microphone access."
        );

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const socket = new WebSocket(
        `wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(token)}`
      );
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "session.update",
            session: {
              system_prompt:
                language === "az"
                  ? "Sən TechSəs adlı IT help desk səsli agentsən. Azərbaycan dilində cavab ver. Qısa, praktik və təhlükəsiz troubleshooting addımları ver. Əmin olmadıqda bunu açıq de və ticket yaratmağı təklif et."
                  : "You are TechSes, a practical IT help desk voice agent. Always respond in English. Give short, safe troubleshooting steps. If uncertain, say so clearly and offer to create a ticket.",
              greeting: voiceCopy.greeting,
              input: {
                format: { encoding: "audio/pcm" },
                keyterms: [
                  "AssemblyAI",
                  "TechSəs",
                  "Wi-Fi",
                  "Windows",
                  "router",
                ],
              },
              output: {
                voice: "anna",
                format: { encoding: "audio/pcm" },
                volume,
              },
            },
          })
        );
      };

      socket.onmessage = event => {
        const payload = JSON.parse(event.data as string) as {
          type?: string;
          text?: string;
          data?: string;
          error?: string;
        };
        if (payload.type === "session.ready") {
          sessionReadyRef.current = true;
          setConnectionMode("live");
          startMicrophone(stream, socket);
          return;
        }
        if (payload.type === "transcript.user" && payload.text) {
          setChat(current => [
            ...current,
            { role: "user", text: payload.text as string, time: timeNow() },
          ]);
          setSessionState("thinking");
        }
        if (payload.type === "reply.audio" && payload.data)
          playAgentAudio(payload.data);
        if (payload.type === "transcript.agent" && payload.text) {
          setChat(current => [
            ...current,
            {
              role: "assistant",
              text: payload.text as string,
              time: timeNow(),
            },
          ]);
          setSessionState("responded");
        }
        if (payload.type === "session.error" || payload.type === "error") {
          setLiveError(
            payload.error ??
              (language === "az"
                ? "AssemblyAI sessiya xətası."
                : "AssemblyAI session error.")
          );
          setSessionState("ready");
          stopLiveAudio();
        }
      };

      socket.onerror = () => {
        setLiveError(
          language === "az"
            ? "AssemblyAI bağlantısı qurulmadı. Demo rejimi ilə davam edə bilərsən."
            : "AssemblyAI connection failed. You can continue in demo mode."
        );
        setConnectionMode("demo");
        setSessionState("ready");
        stopLiveAudio();
      };
      socket.onclose = () => {
        sessionReadyRef.current = false;
        if (connectionMode === "live") logSession("completed");
      };
    } catch (error) {
      setLiveError(
        error instanceof Error
          ? error.message
          : language === "az"
            ? "Mikrofon sessiyası başlatılmadı."
            : "Microphone session could not start."
      );
      setConnectionMode("demo");
      setSessionState("ready");
      stopLiveAudio();
    }
  };

  const finishListening = () => {
    if (connectionMode === "live") {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      processorRef.current = null;
      sourceRef.current = null;
      mediaStreamRef.current = null;
      audioContextRef.current = null;
      logSession("completed");
      setSessionState("thinking");
      return;
    }
    logSession("demo");
    setSessionState("thinking");
  };

  const chooseIssue = (issue: Issue) => {
    setActiveIssueId(issue.id);
    setTicketCreated(false);
    setActiveView("overview");
    setChat(current => [
      ...current,
      { role: "user", text: issue.prompt, time: timeNow() },
    ]);
    setSessionState("thinking");
  };

  const submitTypedMessage = () => {
    const text = draftText.trim();
    if (!text) return;
    setChat(current => [...current, { role: "user", text, time: timeNow() }]);
    setDraftText("");
    setShowTypeInput(false);
    setSessionState("thinking");
  };

  const resetSession = () => {
    socketRef.current?.close();
    stopLiveAudio();
    setSessionState("ready");
    setConnectionMode("demo");
    setLiveError(null);
    setTicketCreated(false);
    setShowAllIssues(false);
    setChat([
      { role: "assistant", text: voiceCopy.chatReset, time: timeNow() },
    ]);
    setActiveView("overview");
  };

  const createTicket = () => {
    if (ticketCreated) return;
    const newTicket: CreatedTicket = {
      id: `${activeIssueId.toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      issue: activeIssue,
      createdAt: timeNow(),
      language,
    };
    setCreatedTickets(current => [newTicket, ...current]);
    setTicketCreated(true);
    setShowToast({
      title: voiceCopy.ticketToastTitle,
      description: voiceCopy.ticketToastDescription,
    });
    window.setTimeout(() => setShowToast(null), 3200);
  };

  const openNav = (view: ViewKey) => {
    setActiveView(view);
    if (view === "voiceSessions") {
      setShowToast({
        title: voiceCopy.voiceSessionsToastTitle,
        description: voiceCopy.voiceSessionsToastDescription,
      });
      window.setTimeout(() => setShowToast(null), 2200);
    }
    if (view === "knowledge") {
      setShowToast({
        title: voiceCopy.knowledgeToastTitle,
        description: voiceCopy.knowledgeToastDescription,
      });
      window.setTimeout(() => setShowToast(null), 2200);
    }
    if (view === "settings") {
      setShowToast({
        title: voiceCopy.settingsToastTitle,
        description: voiceCopy.settingsToastDescription,
      });
      window.setTimeout(() => setShowToast(null), 2200);
    }
  };

  const restartSession = (sessionLog: SessionLog) => {
    const issue = getIssue(sessionLog.issueId, language);
    chooseIssue(issue);
    setShowToast({
      title: voiceCopy.sessionsRestarted,
      description: `${issue.shortLabel}`,
    });
    window.setTimeout(() => setShowToast(null), 2200);
  };

  const saveSettings = () => {
    setShowToast({
      title: voiceCopy.settingsSaved,
      description: `${voiceCopy.settingsVolume}: ${volume}`,
    });
    window.setTimeout(() => setShowToast(null), 2200);
  };

  const resetSettings = () => {
    setVolume(85);
    setAutoSpeak(true);
    setLanguage("az");
    setShowToast({
      title: voiceCopy.settingsResetDone,
      description: voiceCopy.settingsReset,
    });
    window.setTimeout(() => setShowToast(null), 2200);
  };

  const stateCopy = {
    ready: {
      eyebrow: voiceCopy.stateReadyEyebrow,
      title: voiceCopy.stateReadyTitle,
      description: voiceCopy.stateReadyDescription,
    },
    listening: {
      eyebrow: voiceCopy.stateListeningEyebrow,
      title: voiceCopy.stateListeningTitle,
      description: voiceCopy.stateListeningDescription,
    },
    thinking: {
      eyebrow: voiceCopy.stateThinkingEyebrow,
      title: voiceCopy.stateThinkingTitle,
      description: voiceCopy.stateThinkingDescription,
    },
    responded: {
      eyebrow: voiceCopy.stateRespondedEyebrow,
      title: voiceCopy.stateRespondedTitle,
      description: voiceCopy.stateRespondedDescription,
    },
  }[sessionState];

  const issuesToShow = showAllIssues
    ? localizedIssues
    : localizedIssues.slice(0, 4);

  return (
    <div className="min-h-screen overflow-hidden bg-ink text-paper">
      <div className="grain" aria-hidden="true" />
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[232px] shrink-0 flex-col border-r border-white/10 bg-graphite/75 px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="brand-mark">
              <span>TS</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">
                TechSəs
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mute">
                {voiceCopy.brandSubtitle}
              </p>
            </div>
          </div>
          <div className="mt-12 space-y-1">
            <p className="eyebrow px-3 pb-3">{voiceCopy.navWorkspace}</p>
            <NavItem
              icon={LayoutDashboard}
              label={voiceCopy.navOverview}
              active={activeView === "overview"}
              onClick={() => openNav("overview")}
            />
            <NavItem
              icon={Headphones}
              label={voiceCopy.navVoiceSessions}
              count={sessionLogs.length.toString().padStart(2, "0")}
              active={activeView === "voiceSessions"}
              onClick={() => openNav("voiceSessions")}
            />
            <NavItem
              icon={Ticket}
              label={voiceCopy.navTickets}
              count={createdTickets.length.toString().padStart(2, "0")}
              active={activeView === "tickets"}
              onClick={() => openNav("tickets")}
            />
            <NavItem
              icon={LifeBuoy}
              label={voiceCopy.navKnowledge}
              active={activeView === "knowledge"}
              onClick={() => openNav("knowledge")}
            />
          </div>
          <div className="mt-auto space-y-5">
            <div className="rounded-2xl border border-mint/20 bg-mint/10 p-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-mint">
                  {voiceCopy.systemHealth}
                </span>
                <span className="status-dot" />
              </div>
              <p className="mt-3 text-sm font-semibold">
                {voiceCopy.allSystemsOk}
              </p>
              <p className="mt-1 text-xs leading-5 text-mute">
                {voiceCopy.voiceLayerReady}
              </p>
            </div>
            <NavItem
              icon={Settings2}
              label={voiceCopy.navSettings}
              active={activeView === "settings"}
              onClick={() => openNav("settings")}
            />
            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <div className="avatar">OB</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Omar Babayev</p>
                <p className="text-xs text-mute">{voiceCopy.builderAccount}</p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-mute" />
            </div>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="brand-mark small">
                <span>TS</span>
              </div>
              <span className="font-display text-lg font-bold">TechSəs</span>
            </div>
            <div className="hidden items-center gap-2 text-xs text-mute sm:flex">
              <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_12px_#C7F36B]" />{" "}
              <span>{voiceCopy.demoBadge}</span>
              <span className="mx-1 text-white/20">/</span>
              <span>{dateLong()}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 relative">
              <div
                className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 sm:flex"
                aria-label={voiceCopy.language}
              >
                {voiceLanguages.map(item => (
                  <button
                    key={item.value}
                    onClick={() => setLanguage(item.value)}
                    className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold transition",
                      language === item.value
                        ? "bg-mint text-ink"
                        : "text-mute hover:text-paper"
                    )}
                    title={item.label}
                  >
                    {item.shortLabel}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowHelp(value => !value);
                  setShowNotifications(false);
                }}
                className="icon-button"
                aria-label={voiceCopy.helpAria}
              >
                <CircleHelp className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowNotifications(value => !value);
                  setShowHelp(false);
                }}
                className="icon-button"
                aria-label={voiceCopy.notificationsAria}
              >
                <Activity className="h-4 w-4" />
              </button>
              <div className="avatar ml-1">OB</div>
              {(showHelp || showNotifications) && (
                <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-white/10 bg-graphite p-4 shadow-2xl">
                  <p className="eyebrow text-mint">
                    {showHelp
                      ? voiceCopy.helpTitle
                      : voiceCopy.notificationsTitle}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-paper">
                    {showHelp ? voiceCopy.helpText : voiceCopy.noNotifications}
                  </p>
                  <button
                    onClick={() => {
                      setShowHelp(false);
                      setShowNotifications(false);
                    }}
                    className="mt-3 text-xs font-bold text-mint"
                  >
                    {voiceCopy.closeLabel}
                  </button>
                </div>
              )}
            </div>
          </header>

          {activeView === "overview" && renderOverview()}
          {activeView === "voiceSessions" && renderSessions()}
          {activeView === "tickets" && renderTickets()}
          {activeView === "knowledge" && renderKnowledgeBase()}
          {activeView === "settings" && renderSettings()}

          <footer className="mt-8 flex flex-col gap-2 border-t border-white/10 py-5 text-[10px] uppercase tracking-[0.14em] text-mute sm:flex-row sm:items-center sm:justify-between">
            <span>{voiceCopy.footerTagline}</span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-mint" />{" "}
              {voiceCopy.footerHackathon}
            </span>
          </footer>
        </main>
      </div>
      {showToast && (
        <div className="toast">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-ink">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold">{showToast.title}</p>
            <p className="mt-0.5 text-xs text-mute">{showToast.description}</p>
          </div>
          <button
            onClick={() => setShowToast(null)}
            className="ml-3 text-mute hover:text-paper"
            aria-label={voiceCopy.closeNotification}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  function renderOverview() {
    return (
      <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-mint">
                {voiceCopy.greeting.replace("{name}", "Omar")}
              </p>
              <h1 className="mt-2 max-w-[680px] font-display text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-paper sm:text-5xl">
                {voiceCopy.heroLine1}
                <br />
                <span className="text-white/45">{voiceCopy.heroLine2}</span>
              </h1>
            </div>
            <button
              onClick={resetSession}
              className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-mute transition hover:border-white/25 hover:text-paper sm:flex"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {voiceCopy.resetSession}
            </button>
          </div>

          <div className="voice-card relative overflow-hidden rounded-[24px] border border-white/10 bg-[#171B1A] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-mint/10 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "live-pulse",
                      sessionState !== "ready" && "active"
                    )}
                  />
                  <span className="eyebrow">{stateCopy.eyebrow}</span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                  {stateCopy.title}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-mute">
                  {stateCopy.description}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-mute">
                <span className="text-mint">●</span>{" "}
                {connectionMode === "live"
                  ? voiceCopy.liveBadge
                  : voiceCopy.readyBadge}
              </div>
            </div>

            <div
              className="wave-wrap my-8"
              aria-label={
                sessionState === "listening"
                  ? voiceCopy.stateListeningTitle
                  : voiceCopy.stateReadyTitle
              }
            >
              {Array.from({ length: 42 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "wave-bar",
                    sessionState === "listening" && "wave-live",
                    sessionState === "thinking" && "wave-thinking"
                  )}
                  style={
                    {
                      height: `${18 + ((index * 7) % 40)}px`,
                      "--i": index,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={
                    sessionState === "listening"
                      ? finishListening
                      : startListening
                  }
                  disabled={createVoiceToken.isFetching}
                  className="h-12 rounded-xl bg-mint px-5 font-bold text-ink hover:bg-[#d8ff83]"
                >
                  {sessionState === "listening" ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> {voiceCopy.finishLabel}
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" /> {voiceCopy.startLabel}
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setShowTypeInput(value => !value)}
                  className="flex h-12 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-mute transition hover:border-white/20 hover:text-paper"
                  aria-label={voiceCopy.typeInstead}
                >
                  <span className="kbd">⌘</span>
                  <span className="kbd">K</span>
                  <span className="hidden sm:inline">
                    {voiceCopy.typeInstead}
                  </span>
                </button>
              </div>
              <span className="text-xs text-mute">
                {sessionState === "ready"
                  ? `${voiceCopy.language}: ${voiceCopy.demoEnvironment}`
                  : connectionMode === "live"
                    ? voiceCopy.liveAudio
                    : voiceCopy.demoFallback}
              </span>
            </div>

            {showTypeInput && (
              <div className="relative mt-4 flex gap-2">
                <input
                  value={draftText}
                  onChange={event => setDraftText(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") submitTypedMessage();
                  }}
                  placeholder={voiceCopy.typePlaceholder}
                  aria-label={voiceCopy.typeAriaLabel}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-mint/50"
                  autoFocus
                />
                <Button
                  onClick={submitTypedMessage}
                  className="rounded-xl bg-mint px-4 font-bold text-ink"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {voiceCopy.send}
                </Button>
              </div>
            )}

            {liveError && (
              <p className="relative mt-4 rounded-lg border border-coral/25 bg-coral/10 px-3 py-2 text-xs leading-5 text-coral">
                {liveError} {voiceCopy.liveErrorHint}
              </p>
            )}
          </div>

          <div className="mt-7 flex items-center justify-between">
            <div>
              <p className="eyebrow">{voiceCopy.quickStart}</p>
              <h3 className="mt-1 font-display text-lg font-bold">
                {voiceCopy.whatsGoingOn}
              </h3>
            </div>
            <button
              onClick={() => setShowAllIssues(value => !value)}
              className="flex items-center gap-1 text-xs font-bold text-mute transition hover:text-mint"
            >
              {showAllIssues ? voiceCopy.viewLess : voiceCopy.viewAll}
              <ArrowUpRight
                className={cn(
                  "h-3.5 w-3.5 transition",
                  showAllIssues && "rotate-180"
                )}
              />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {issuesToShow.map(issue => {
              const Icon = iconForIssue(issue.id);
              return (
                <button
                  key={issue.id}
                  onClick={() => chooseIssue(issue)}
                  className={cn(
                    "issue-card group text-left",
                    activeIssueId === issue.id && "selected"
                  )}
                >
                  <div className={cn("issue-icon", `issue-${issue.color}`)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm font-bold leading-5">
                    {issue.shortLabel}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-mute">
                    {issue.label}
                  </p>
                  <ChevronRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-mint" />
                </button>
              );
            })}
          </div>

          {showAllIssues && (
            <p className="mt-3 text-center text-[11px] text-mute">
              {voiceCopy.showAllIssues}
            </p>
          )}
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="panel rounded-[22px] border border-white/10 bg-graphite/70 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">{voiceCopy.liveTranscript}</p>
                <h3 className="mt-1 font-display text-lg font-bold">
                  {voiceCopy.conversation}
                </h3>
              </div>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-mute">
                {voiceCopy.eventsCount(chat.length)}
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {chat.length === 0 ? (
                <p className="text-xs leading-5 text-mute">
                  {voiceCopy.noMessages}
                </p>
              ) : (
                chat.slice(-3).map((item, index) => (
                  <div
                    key={`${item.time}-${index}`}
                    className={cn(
                      "flex gap-3",
                      item.role === "user" && "flex-row-reverse text-right"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        item.role === "assistant"
                          ? "bg-mint/15 text-mint"
                          : "bg-sky/15 text-sky"
                      )}
                    >
                      {item.role === "assistant" ? (
                        <Bot className="h-3.5 w-3.5" />
                      ) : (
                        <UserRound className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mute">
                        {item.role === "assistant"
                          ? voiceCopy.roleAssistant
                          : voiceCopy.roleUser}{" "}
                        <span className="ml-1 font-normal normal-case tracking-normal text-white/25">
                          {item.time}
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/75">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
              <div className="flex -space-x-1.5">
                <span className="mini-avatar bg-mint text-ink">TS</span>
                <span className="mini-avatar bg-sky text-ink">AI</span>
              </div>
              <span className="text-[11px] text-mute">
                {sessionState === "listening"
                  ? voiceCopy.liveTyping
                  : voiceCopy.voiceStandingBy}
              </span>
              <span className="ml-auto">
                <Volume2 className="h-3.5 w-3.5 text-mint" />
              </span>
            </div>
          </section>

          <section className="ticket-card rounded-[22px] border border-white/10 bg-paper p-5 text-ink sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow text-ink/45">{voiceCopy.ticketDraft}</p>
                <h3 className="mt-1 font-display text-lg font-bold">
                  {ticketCreated
                    ? voiceCopy.ticketCreated
                    : voiceCopy.readyToSummarize}
                </h3>
              </div>
              <div
                className={cn(
                  "rounded-xl p-2.5",
                  ticketCreated ? "bg-mint" : "bg-ink text-mint"
                )}
              >
                {ticketCreated ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Ticket className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-ink/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-ink/50">
                  {activeIssue.category} / {activeIssueId.toUpperCase()}-024
                </span>
                <span
                  className={cn(
                    "priority",
                    `priority-${activeIssue.priority.toLowerCase()}`
                  )}
                >
                  {localizePriority(activeIssue.priority, language)}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold leading-5">
                {activeIssue.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink/55">
                {voiceCopy.suggestedNextStep} {activeIssue.action}
              </p>
            </div>
            <Button
              onClick={createTicket}
              disabled={ticketCreated || sessionState === "ready"}
              className="mt-4 h-11 w-full rounded-xl bg-ink font-bold text-paper hover:bg-ink/85 disabled:opacity-50"
            >
              {ticketCreated ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-mint" />{" "}
                  {voiceCopy.draftSaved}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> {voiceCopy.createTicket}
                </>
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-ink/45">
              <ShieldCheck className="h-3 w-3" />{" "}
              {connectionMode === "live"
                ? voiceCopy.audioSecureLive
                : voiceCopy.audioSecureDemo}
            </p>
          </section>
        </aside>
      </section>
    );
  }

  function renderSessions() {
    return (
      <section className="mt-8 space-y-5">
        <div>
          <p className="eyebrow text-mint">{voiceCopy.sessionDateLabel}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {voiceCopy.sessionsHeading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            {voiceCopy.sessionsDescription}
          </p>
        </div>

        {sessionLogs.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-graphite/40 p-8 text-center">
            <Headphones className="mx-auto h-8 w-8 text-mute" />
            <p className="mt-4 text-sm font-semibold text-paper">
              {voiceCopy.sessionsEmpty}
            </p>
            <p className="mt-1 text-xs text-mute">
              {voiceCopy.sessionsEmptyNote}
            </p>
            <Button
              onClick={() => openNav("overview")}
              className="mt-5 h-10 rounded-xl bg-mint px-4 font-bold text-ink hover:bg-[#d8ff83]"
            >
              <Mic className="mr-2 h-4 w-4" /> {voiceCopy.startLabel}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionLogs.map(log => {
              const issue = getIssue(log.issueId, language);
              const statusLabel =
                log.status === "live"
                  ? voiceCopy.sessionsStatusLive
                  : log.status === "demo"
                    ? voiceCopy.sessionsStatusDemo
                    : voiceCopy.sessionsStatusCompleted;
              return (
                <article
                  key={log.id}
                  className="rounded-[22px] border border-white/10 bg-graphite/60 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-mint/15 text-mint">
                          {issue.shortLabel}
                        </Badge>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-mute">
                          {statusLabel}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold">
                        {issue.label}
                      </h3>
                      <p className="mt-1 max-w-2xl text-xs leading-5 text-mute">
                        {issue.prompt}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-mute">
                      <span>{voiceCopy.sessionsItemDuration}</span>
                      <span className="font-bold text-paper">
                        {formatDuration(log.durationSeconds)}
                      </span>
                      <span>{voiceCopy.sessionDateLabel}</span>
                      <span className="font-bold text-paper">
                        {log.startedAt}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
                    <Button
                      onClick={() => restartSession(log)}
                      variant="outline"
                      className="h-9 rounded-xl border-white/10 bg-white/[0.04] text-paper hover:bg-white/[0.08]"
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />{" "}
                      {voiceCopy.sessionsActionRestart}
                    </Button>
                    <span className="ml-auto text-[11px] text-mute">
                      {voiceCopy.sessionsItemStatus}: {statusLabel}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function renderTickets() {
    return (
      <section className="mt-8 space-y-5">
        <div>
          <p className="eyebrow text-mint">{voiceCopy.ticketsHeading}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {voiceCopy.ticketsHeading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            {voiceCopy.ticketsDescription}{" "}
            {voiceCopy.ticketsCount(createdTickets.length)}
          </p>
        </div>

        {createdTickets.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-graphite/40 p-8 text-center">
            <Ticket className="mx-auto h-8 w-8 text-mute" />
            <p className="mt-4 text-sm font-semibold text-paper">
              {voiceCopy.ticketsEmpty}
            </p>
            <Button
              onClick={() => openNav("overview")}
              className="mt-5 h-10 rounded-xl bg-mint px-4 font-bold text-ink hover:bg-[#d8ff83]"
            >
              <Send className="mr-2 h-4 w-4" /> {voiceCopy.createTicket}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {createdTickets.map(ticket => (
              <article
                key={ticket.id}
                className="rounded-[22px] border border-white/10 bg-graphite/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-sky/15 text-sky">
                        {ticket.issue.category}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-mute">
                        {ticket.id}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold">
                      {ticket.issue.label}
                    </h3>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-mute">
                      {ticket.issue.prompt}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-mute">
                    <span>{voiceCopy.ticketStage}</span>
                    <span className="font-bold text-paper">
                      {voiceCopy.ticketStageDraft}
                    </span>
                    <span>{voiceCopy.sessionsItemDuration}</span>
                    <span className="font-bold text-paper">
                      {ticket.createdAt}
                    </span>
                    <span>Priority</span>
                    <span className="font-bold text-paper">
                      {localizePriority(ticket.issue.priority, language)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
                  <span className="text-[11px] text-mute">
                    {voiceCopy.ticketAction}: {ticket.issue.action}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderKnowledgeBase() {
    return (
      <section className="mt-8 space-y-5">
        <div>
          <p className="eyebrow text-mint">{voiceCopy.kbHeading}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {voiceCopy.kbHeading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            {voiceCopy.kbDescription}
          </p>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-graphite/60 p-5 sm:p-7">
          <h2 className="font-display text-lg font-bold">{voiceCopy.kbFaq}</h2>
          <div className="mt-4 space-y-3">
            {voiceCopy.kbFaqItems.map((item, index) => (
              <details
                key={index}
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 open:bg-white/[0.06]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  <span>{item.q}</span>
                  <ChevronRight className="h-4 w-4 text-mute transition group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-xs leading-5 text-mute">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderSettings() {
    return (
      <section className="mt-8 space-y-5">
        <div>
          <p className="eyebrow text-mint">{voiceCopy.navSettings}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {voiceCopy.settingsHeading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            {voiceCopy.settingsDescription}
          </p>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-graphite/60 p-5 sm:p-7 space-y-6">
          <div>
            <p className="text-sm font-bold">{voiceCopy.settingsLanguage}</p>
            <p className="mt-1 text-xs text-mute">
              {voiceCopy.settingsLanguageDescription}
            </p>
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
              {voiceLanguages.map(item => (
                <button
                  key={item.value}
                  onClick={() => setLanguage(item.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition",
                    language === item.value
                      ? "bg-mint text-ink"
                      : "text-mute hover:text-paper"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{voiceCopy.settingsVolume}</p>
                <p className="mt-1 text-xs text-mute">
                  {voiceCopy.settingsVolumeDescription}
                </p>
              </div>
              <span className="font-display text-2xl font-bold text-mint">
                {volume}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={event => setVolume(Number(event.target.value))}
              className="mt-3 w-full accent-mint"
              aria-label={voiceCopy.settingsVolume}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="text-sm font-bold">{voiceCopy.settingsAutoSpeak}</p>
              <p className="mt-1 text-xs text-mute">
                {voiceCopy.settingsAutoSpeakDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoSpeak(value => !value)}
              aria-pressed={autoSpeak}
              className={cn(
                "relative h-6 w-11 rounded-full transition",
                autoSpeak ? "bg-mint" : "bg-white/15"
              )}
              aria-label={voiceCopy.settingsAutoSpeak}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-ink transition",
                  autoSpeak ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            <Button
              onClick={saveSettings}
              className="h-11 rounded-xl bg-mint px-5 font-bold text-ink hover:bg-[#d8ff83]"
            >
              {voiceCopy.settingsSave}
            </Button>
            <button
              onClick={resetSettings}
              className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-mute transition hover:border-white/20 hover:text-paper"
            >
              {voiceCopy.settingsReset}
            </button>
          </div>
        </div>
      </section>
    );
  }
}

function NavItem({
  icon: Icon,
  label,
  active,
  count,
  onClick,
}: {
  icon: typeof Activity;
  label: string;
  active?: boolean;
  count?: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className={cn("nav-item", active && "active")}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {count && <span className="ml-auto text-[10px] text-mute">{count}</span>}
    </button>
  );
}
