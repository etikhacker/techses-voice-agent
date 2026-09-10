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
  Plus,
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
import { getIssue, issues, type Issue, type IssueId } from "@/lib/issueData";
import { trpc } from "@/lib/trpc";
import { getVoiceCopy, voiceLanguages, type VoiceLanguage } from "@/lib/voiceLanguage";

type SessionState = "ready" | "listening" | "thinking" | "responded";
type ChatItem = { role: "user" | "assistant"; text: string; time: string };

const iconForIssue = (id: IssueId) => ({ wifi: Wifi, printer: Printer, windows: SquareTerminal, account: ShieldCheck })[id];

const timeNow = () => new Intl.DateTimeFormat("az-AZ", { hour: "2-digit", minute: "2-digit" }).format(new Date());

const pcmBase64 = (samples: Float32Array) => {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  samples.forEach((sample, index) => view.setInt16(index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true));
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
};

const audioFromBase64 = (encoded: string) => {
  const binary = atob(encoded);
  const samples = new Int16Array(binary.length / 2);
  for (let index = 0; index < samples.length; index += 1) samples[index] = (binary.charCodeAt(index * 2) | (binary.charCodeAt(index * 2 + 1) << 8));
  return samples;
};

export default function Home() {
  const [sessionState, setSessionState] = useState<SessionState>("ready");
  const [activeIssueId, setActiveIssueId] = useState<IssueId>("wifi");
  const [chat, setChat] = useState<ChatItem[]>([
    { role: "assistant", text: "Salam, Omar. Kompüter problemini təsvir et — mən diaqnostikanı başladım.", time: "09:41" },
  ]);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"demo" | "live">("demo");
  const [liveError, setLiveError] = useState<string | null>(null);
  const [language, setLanguage] = useState<VoiceLanguage>("az");
  const [draftText, setDraftText] = useState("");
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const createVoiceToken = trpc.voiceAgent.createToken.useQuery(undefined, { enabled: false });
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef(0);
  const sessionReadyRef = useRef(false);

  const activeIssue = useMemo(() => getIssue(activeIssueId), [activeIssueId]);
  const voiceCopy = getVoiceCopy(language);

  const localizedIssue = useMemo(() => {
    if (language === "az") return activeIssue;
    const english = {
      wifi: { prompt: "Wi-Fi connects, but the internet does not work.", response: "The router connection is visible, but internet access is unavailable. Restart the router for 30 seconds, then check another device." },
      printer: { prompt: "The printer is visible, but the print job does not go through.", response: "The print queue may be stuck. Clear the queue, restart the printer, and check its network connection." },
      windows: { prompt: "A Windows app closes as soon as it opens.", response: "This may be caused by a damaged cache or an outdated version. Update the app, clear its cache, and restart Windows." },
      account: { prompt: "I cannot access my account and cannot reset the password.", response: "Account access should be verified securely first. After verification, a password reset link can be sent." },
    }[activeIssue.id];
    return { ...activeIssue, prompt: english.prompt, response: english.response };
  }, [activeIssue, language]);

  const stopLiveAudio = () => {
    sessionReadyRef.current = false;
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
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
    const context = playbackContextRef.current ?? new AudioContext({ sampleRate: 24000 });
    playbackContextRef.current = context;
    const buffer = context.createBuffer(1, samples.length, 24000);
    const channel = buffer.getChannelData(0);
    samples.forEach((sample, index) => { channel[index] = sample / 0x7fff; });
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
    processor.onaudioprocess = (event) => {
      if (!sessionReadyRef.current || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "input.audio", audio: pcmBase64(event.inputBuffer.getChannelData(0)) }));
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
      setChat((current) => [...current, { role: "assistant", text: localizedIssue.response, time: timeNow() }]);
      setSessionState("responded");
    }, 850);
    return () => window.clearTimeout(timeout);
  }, [localizedIssue, sessionState, connectionMode]);

  const startListening = async () => {
    setTicketCreated(false);
    setLiveError(null);
    setSessionState("listening");

    try {
      const directResponse = await fetch("/api/voice-agent-token");
      const tokenResult = directResponse.ok
        ? await directResponse.json() as { token?: string }
        : (await createVoiceToken.refetch()).data;
      const token = tokenResult?.token;
      if (!token) throw new Error("Temporary AssemblyAI token alınmadı.");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Bu brauzer mikrofon girişini dəstəkləmir.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      const socket = new WebSocket(`wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(token)}`);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: "session.update",
          session: {
            system_prompt: language === "az" ? "Sən TechSəs adlı IT help desk səsli agentsən. Azərbaycan dilində cavab ver. Qısa, praktik və təhlükəsiz troubleshooting addımları ver. Əmin olmadıqda bunu açıq de və ticket yaratmağı təklif et." : "You are TechSes, a practical IT help desk voice agent. Always respond in English. Give short, safe troubleshooting steps. If uncertain, say so clearly and offer to create a ticket.",
            greeting: voiceCopy.greeting,
            input: { format: { encoding: "audio/pcm" }, keyterms: ["AssemblyAI", "TechSəs", "Wi-Fi", "Windows", "router"] },
            output: { voice: "anna", format: { encoding: "audio/pcm" }, volume: 85 },
          },
        }));
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data as string) as { type?: string; text?: string; data?: string; error?: string };
        if (payload.type === "session.ready") {
          sessionReadyRef.current = true;
          setConnectionMode("live");
          startMicrophone(stream, socket);
          return;
        }
        if (payload.type === "transcript.user" && payload.text) {
          setChat((current) => [...current, { role: "user", text: payload.text as string, time: timeNow() }]);
          setSessionState("thinking");
        }
        if (payload.type === "reply.audio" && payload.data) playAgentAudio(payload.data);
        if (payload.type === "transcript.agent" && payload.text) {
          setChat((current) => [...current, { role: "assistant", text: payload.text as string, time: timeNow() }]);
          setSessionState("responded");
        }
        if (payload.type === "session.error" || payload.type === "error") {
          setLiveError(payload.error ?? "AssemblyAI sessiya xətası.");
          setSessionState("ready");
          stopLiveAudio();
        }
      };

      socket.onerror = () => {
        setLiveError("AssemblyAI bağlantısı qurulmadı. Demo rejimi ilə davam edə bilərsən.");
        setConnectionMode("demo");
        setSessionState("ready");
        stopLiveAudio();
      };
      socket.onclose = () => { sessionReadyRef.current = false; };
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Mikrofon sessiyası başlatılmadı.");
      setConnectionMode("demo");
      setSessionState("ready");
      stopLiveAudio();
    }
  };

  const finishListening = () => {
    if (connectionMode === "live") {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close();
      processorRef.current = null;
      sourceRef.current = null;
      mediaStreamRef.current = null;
      audioContextRef.current = null;
      setSessionState("thinking");
      return;
    }
    setSessionState("thinking");
  };

  const chooseIssue = (issue: Issue) => {
    setActiveIssueId(issue.id);
    setTicketCreated(false);
    const prompt = language === "az" ? issue.prompt : localizedIssue.id === issue.id ? localizedIssue.prompt : issue.prompt;
    setChat((current) => [...current, { role: "user", text: prompt, time: timeNow() }]);
    setSessionState("thinking");
  };

  const submitTypedMessage = () => {
    const text = draftText.trim();
    if (!text) return;
    setChat((current) => [...current, { role: "user", text, time: timeNow() }]);
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
    setChat([{ role: "assistant", text: "Yeni sessiya hazırdır. Problemini mənə danışa bilərsən.", time: timeNow() }]);
  };

  const createTicket = () => {
    setTicketCreated(true);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3200);
  };

  const stateCopy = {
    ready: { eyebrow: language === "en" ? "READY WHEN YOU ARE" : "HAZIRDIR", title: language === "en" ? "How can I help?" : "Sizə necə kömək edim?", description: language === "en" ? "Start a conversation or choose a common issue below." : "Söhbətə başlayın və ya aşağıdan problemi seçin." },
    listening: { eyebrow: language === "en" ? "LISTENING NOW" : "DİNLƏYİRƏM", title: language === "en" ? "I’m listening…" : "Sizi dinləyirəm…", description: language === "en" ? "Describe what’s happening in your own words." : "Baş verənləri öz sözlərinizlə təsvir edin." },
    thinking: { eyebrow: language === "en" ? "ANALYZING SIGNAL" : "ANALİZ EDİRƏM", title: language === "en" ? "Connecting the dots…" : "Məlumatları əlaqələndirirəm…", description: language === "en" ? "Checking the issue pattern and preparing a next step." : "Problemi yoxlayıb növbəti addımı hazırlayıram." },
    responded: { eyebrow: language === "en" ? "RESPONSE READY" : "CAVAB HAZIRDIR", title: language === "en" ? "Here’s the next move" : "Növbəti addım budur", description: language === "en" ? "Review the recommendation, then create a ticket summary." : "Tövsiyəni yoxlayın və ticket xülasəsi yaradın." },
  }[sessionState];

  return (
    <div className="min-h-screen overflow-hidden bg-ink text-paper">
      <div className="grain" aria-hidden="true" />
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[232px] shrink-0 flex-col border-r border-white/10 bg-graphite/75 px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="brand-mark"><span>TS</span></div>
            <div><p className="font-display text-lg font-bold tracking-tight">TechSəs</p><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mute">Support console</p></div>
          </div>
          <div className="mt-12 space-y-1">
            <p className="eyebrow px-3 pb-3">Workspace</p>
            <NavItem icon={LayoutDashboard} label="Overview" active={activeNav === "Overview"} onClick={() => setActiveNav("Overview")} />
            <NavItem icon={Headphones} label="Voice sessions" count="03" active={activeNav === "Voice sessions"} onClick={() => { setActiveNav("Voice sessions"); setShowToast(true); window.setTimeout(() => setShowToast(false), 2200); }} />
            <NavItem icon={Ticket} label="Tickets" count="08" active={activeNav === "Tickets"} onClick={() => { setActiveNav("Tickets"); setTicketCreated(true); }} />
            <NavItem icon={CircleHelp} label="Knowledge base" active={activeNav === "Knowledge base"} onClick={() => { setActiveNav("Knowledge base"); setShowHelp(true); }} />
          </div>
          <div className="mt-auto space-y-5">
            <div className="rounded-2xl border border-mint/20 bg-mint/10 p-4">
              <div className="flex items-center justify-between"><span className="eyebrow text-mint">System health</span><span className="status-dot" /></div>
              <p className="mt-3 text-sm font-semibold">All systems operational</p><p className="mt-1 text-xs leading-5 text-mute">Voice layer is ready for a new session.</p>
            </div>
            <NavItem icon={Settings2} label="Settings" active={activeNav === "Settings"} onClick={() => { setActiveNav("Settings"); setShowHelp(true); }} />
            <div className="flex items-center gap-3 border-t border-white/10 pt-4"><div className="avatar">OB</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Omar Babayev</p><p className="text-xs text-mute">Builder account</p></div><MoreHorizontal className="h-4 w-4 text-mute" /></div>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden"><div className="brand-mark small"><span>TS</span></div><span className="font-display text-lg font-bold">TechSəs</span></div>
            <div className="hidden items-center gap-2 text-xs text-mute sm:flex"><span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_12px_#C7F36B]" /> <span>Demo environment</span><span className="mx-1 text-white/20">/</span><span>Thu, 10 Sep 2026</span></div>
            <div className="ml-auto flex items-center gap-2 relative"><div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 sm:flex" aria-label={voiceCopy.language}>{voiceLanguages.map((item) => <button key={item.value} onClick={() => setLanguage(item.value)} className={cn("rounded-full px-2 py-1 text-[10px] font-bold transition", language === item.value ? "bg-mint text-ink" : "text-mute hover:text-paper")} title={item.label}>{item.shortLabel}</button>)}</div><button onClick={() => setShowHelp((value) => !value)} className="icon-button" aria-label="Help"><CircleHelp className="h-4 w-4" /></button><button onClick={() => setShowNotifications((value) => !value)} className="icon-button" aria-label="Notifications"><Activity className="h-4 w-4" /></button><div className="avatar ml-1">OB</div>{(showHelp || showNotifications) && <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-white/10 bg-graphite p-4 shadow-2xl"><p className="eyebrow text-mint">{showHelp ? voiceCopy.helpTitle : voiceCopy.notificationsTitle}</p><p className="mt-2 text-sm leading-6 text-paper">{showHelp ? voiceCopy.helpText : voiceCopy.noNotifications}</p><button onClick={() => { setShowHelp(false); setShowNotifications(false); }} className="mt-3 text-xs font-bold text-mint">Close</button></div>}</div>
          </header>

          <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow text-mint">Good morning, Omar</p><h1 className="mt-2 max-w-[680px] font-display text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-paper sm:text-5xl">Make IT issues<br /><span className="text-white/45">feel less technical.</span></h1></div><button onClick={resetSession} className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-mute transition hover:border-white/25 hover:text-paper sm:flex"><RotateCcw className="h-3.5 w-3.5" /> Reset session</button></div>
              <div className="voice-card relative overflow-hidden rounded-[24px] border border-white/10 bg-[#171B1A] p-5 shadow-2xl shadow-black/20 sm:p-7">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-mint/10 blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className={cn("live-pulse", sessionState !== "ready" && "active")} /><span className="eyebrow">{stateCopy.eyebrow}</span></div><h2 className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{stateCopy.title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-mute">{stateCopy.description}</p></div><div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-mute"><span className="text-mint">●</span> {connectionMode === "live" ? "AssemblyAI live" : "AssemblyAI-ready"}</div></div>
                <div className="wave-wrap my-8" aria-label={sessionState === "listening" ? "Listening" : "Voice visualization"}>{Array.from({ length: 42 }).map((_, index) => <span key={index} className={cn("wave-bar", sessionState === "listening" && "wave-live", sessionState === "thinking" && "wave-thinking")} style={{ height: `${18 + ((index * 7) % 40)}px`, "--i": index } as React.CSSProperties } />)}</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Button onClick={sessionState === "listening" ? finishListening : startListening} disabled={createVoiceToken.isFetching} className="h-12 rounded-xl bg-mint px-5 font-bold text-ink hover:bg-[#d8ff83]">{sessionState === "listening" ? <><Pause className="mr-2 h-4 w-4" /> {voiceCopy.finishLabel}</> : <><Mic className="mr-2 h-4 w-4" /> {voiceCopy.startLabel}</>}</Button><button onClick={() => setShowTypeInput((value) => !value)} className="flex h-12 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-mute transition hover:border-white/20 hover:text-paper" aria-label={voiceCopy.typeInstead}><span className="kbd">⌘</span><span className="kbd">K</span><span className="hidden sm:inline">{voiceCopy.typeInstead}</span></button></div><span className="text-xs text-mute">{sessionState === "ready" ? `${voiceCopy.language}: ${voiceCopy.demoEnvironment}` : connectionMode === "live" ? "Live audio session" : voiceCopy.demoFallback}</span></div>
                {showTypeInput && <div className="relative mt-4 flex gap-2"><input value={draftText} onChange={(event) => setDraftText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitTypedMessage(); }} placeholder={voiceCopy.typePlaceholder} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-mint/50" autoFocus /><Button onClick={submitTypedMessage} className="rounded-xl bg-mint px-4 font-bold text-ink"><Send className="mr-2 h-4 w-4" />{voiceCopy.send}</Button></div>}
                {liveError && <p className="relative mt-4 rounded-lg border border-coral/25 bg-coral/10 px-3 py-2 text-xs leading-5 text-coral">{liveError} You can still use the issue shortcuts below.</p>}
              </div>

              <div className="mt-7 flex items-center justify-between"><div><p className="eyebrow">Quick start</p><h3 className="mt-1 font-display text-lg font-bold">What’s going on?</h3></div><button onClick={() => { setActiveIssueId("wifi"); setTicketCreated(false); }} className="flex items-center gap-1 text-xs font-bold text-mute transition hover:text-mint">View all <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{issues.map((issue) => { const Icon = iconForIssue(issue.id); return <button key={issue.id} onClick={() => chooseIssue(issue)} className={cn("issue-card group text-left", activeIssueId === issue.id && "selected")}><div className={cn("issue-icon", `issue-${issue.color}`)}><Icon className="h-4 w-4" /></div><p className="mt-4 text-sm font-bold leading-5">{issue.shortLabel}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-mute">{issue.label}</p><ChevronRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-mint" /></button>; })}</div>
            </div>

            <aside className="min-w-0 space-y-5">
              <section className="panel rounded-[22px] border border-white/10 bg-graphite/70 p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Live transcript</p><h3 className="mt-1 font-display text-lg font-bold">Conversation</h3></div><span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-mute">{chat.length} events</span></div><div className="mt-5 space-y-4">{chat.slice(-3).map((item, index) => <div key={`${item.time}-${index}`} className={cn("flex gap-3", item.role === "user" && "flex-row-reverse text-right")}><div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", item.role === "assistant" ? "bg-mint/15 text-mint" : "bg-sky/15 text-sky")} >{item.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}</div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mute">{item.role === "assistant" ? "TechSəs" : "You"} <span className="ml-1 font-normal normal-case tracking-normal text-white/25">{item.time}</span></p><p className="mt-1 text-xs leading-5 text-white/75">{item.text}</p></div></div>)}</div><div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4"><div className="flex -space-x-1.5"><span className="mini-avatar bg-mint text-ink">TS</span><span className="mini-avatar bg-sky text-ink">AI</span></div><span className="text-[11px] text-mute">Voice agent is standing by</span><span className="ml-auto"><Volume2 className="h-3.5 w-3.5 text-mint" /></span></div></section>
              <section className="ticket-card rounded-[22px] border border-white/10 bg-paper p-5 text-ink sm:p-6"><div className="flex items-start justify-between"><div><p className="eyebrow text-ink/45">Ticket draft</p><h3 className="mt-1 font-display text-lg font-bold">{ticketCreated ? "Ticket created" : "Ready to summarize"}</h3></div><div className={cn("rounded-xl p-2.5", ticketCreated ? "bg-mint" : "bg-ink text-mint")}>{ticketCreated ? <Check className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}</div></div><div className="mt-5 rounded-xl bg-ink/[0.06] p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-ink/50">{activeIssue.category} / {activeIssueId.toUpperCase()}-024</span><span className={cn("priority", `priority-${activeIssue.priority.toLowerCase()}`)}>{activeIssue.priority}</span></div><p className="mt-3 text-sm font-bold leading-5">{activeIssue.label}</p><p className="mt-1 text-xs leading-5 text-ink/55">Suggested next step: {activeIssue.action}</p></div><Button onClick={createTicket} disabled={ticketCreated || sessionState === "ready"} className="mt-4 h-11 w-full rounded-xl bg-ink font-bold text-paper hover:bg-ink/85 disabled:opacity-50">{ticketCreated ? <><Check className="mr-2 h-4 w-4 text-mint" /> Draft saved to tickets</> : <><Send className="mr-2 h-4 w-4" /> Create ticket summary</>}</Button><p className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-ink/45"><ShieldCheck className="h-3 w-3" /> {connectionMode === "live" ? "Audio streamed securely to AssemblyAI" : "Demo mode — no audio is sent"}</p></section>
            </aside>
          </section>
          <footer className="mt-8 flex flex-col gap-2 border-t border-white/10 py-5 text-[10px] uppercase tracking-[0.14em] text-mute sm:flex-row sm:items-center sm:justify-between"><span>TechSəs / Voice-first IT support</span><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-mint" /> Built for AssemblyAI Hackathon</span></footer>
        </main>
      </div>
      {showToast && <div className="toast"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-ink"><Check className="h-4 w-4" /></div><div><p className="text-sm font-bold">Ticket summary created</p><p className="mt-0.5 text-xs text-mute">Saved to your workspace.</p></div><button onClick={() => setShowToast(false)} className="ml-3 text-mute hover:text-paper" aria-label="Close notification"><X className="h-4 w-4" /></button></div>}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, count, onClick }: { icon: typeof Activity; label: string; active?: boolean; count?: string; onClick?: () => void }) {
  return <button onClick={onClick} className={cn("nav-item", active && "active")}><Icon className="h-4 w-4" /><span>{label}</span>{count && <span className="ml-auto text-[10px] text-mute">{count}</span>}</button>;
}
