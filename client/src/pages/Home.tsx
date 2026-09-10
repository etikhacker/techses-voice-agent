import { useEffect, useMemo, useState } from "react";
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

type SessionState = "ready" | "listening" | "thinking" | "responded";
type ChatItem = { role: "user" | "assistant"; text: string; time: string };

const iconForIssue = (id: IssueId) => ({ wifi: Wifi, printer: Printer, windows: SquareTerminal, account: ShieldCheck })[id];

const timeNow = () => new Intl.DateTimeFormat("az-AZ", { hour: "2-digit", minute: "2-digit" }).format(new Date());

export default function Home() {
  const [sessionState, setSessionState] = useState<SessionState>("ready");
  const [activeIssueId, setActiveIssueId] = useState<IssueId>("wifi");
  const [chat, setChat] = useState<ChatItem[]>([
    { role: "assistant", text: "Salam, Omar. Kompüter problemini təsvir et — mən diaqnostikanı başladım.", time: "09:41" },
  ]);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const activeIssue = useMemo(() => getIssue(activeIssueId), [activeIssueId]);

  useEffect(() => {
    if (sessionState !== "thinking") return;
    const timeout = window.setTimeout(() => {
      setChat((current) => [...current, { role: "assistant", text: activeIssue.response, time: timeNow() }]);
      setSessionState("responded");
    }, 850);
    return () => window.clearTimeout(timeout);
  }, [activeIssue, sessionState]);

  const startListening = () => {
    setTicketCreated(false);
    setSessionState("listening");
    window.setTimeout(() => setSessionState("thinking"), 1200);
  };

  const chooseIssue = (issue: Issue) => {
    setActiveIssueId(issue.id);
    setTicketCreated(false);
    setChat((current) => [...current, { role: "user", text: issue.prompt, time: timeNow() }]);
    setSessionState("thinking");
  };

  const resetSession = () => {
    setSessionState("ready");
    setTicketCreated(false);
    setChat([{ role: "assistant", text: "Yeni sessiya hazırdır. Problemini mənə danışa bilərsən.", time: timeNow() }]);
  };

  const createTicket = () => {
    setTicketCreated(true);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3200);
  };

  const stateCopy = {
    ready: { eyebrow: "READY WHEN YOU ARE", title: "How can I help?", description: "Start a conversation or choose a common issue below." },
    listening: { eyebrow: "LISTENING NOW", title: "I’m listening…", description: "Describe what’s happening in your own words." },
    thinking: { eyebrow: "ANALYZING SIGNAL", title: "Connecting the dots…", description: "Checking the issue pattern and preparing a next step." },
    responded: { eyebrow: "RESPONSE READY", title: "Here’s the next move", description: "Review the recommendation, then create a ticket summary." },
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
            <NavItem icon={LayoutDashboard} label="Overview" active />
            <NavItem icon={Headphones} label="Voice sessions" count="03" />
            <NavItem icon={Ticket} label="Tickets" count="08" />
            <NavItem icon={CircleHelp} label="Knowledge base" />
          </div>
          <div className="mt-auto space-y-5">
            <div className="rounded-2xl border border-mint/20 bg-mint/10 p-4">
              <div className="flex items-center justify-between"><span className="eyebrow text-mint">System health</span><span className="status-dot" /></div>
              <p className="mt-3 text-sm font-semibold">All systems operational</p><p className="mt-1 text-xs leading-5 text-mute">Voice layer is ready for a new session.</p>
            </div>
            <NavItem icon={Settings2} label="Settings" />
            <div className="flex items-center gap-3 border-t border-white/10 pt-4"><div className="avatar">OB</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Omar Babayev</p><p className="text-xs text-mute">Builder account</p></div><MoreHorizontal className="h-4 w-4 text-mute" /></div>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden"><div className="brand-mark small"><span>TS</span></div><span className="font-display text-lg font-bold">TechSəs</span></div>
            <div className="hidden items-center gap-2 text-xs text-mute sm:flex"><span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_12px_#C7F36B]" /> <span>Demo environment</span><span className="mx-1 text-white/20">/</span><span>Thu, 10 Sep 2026</span></div>
            <div className="ml-auto flex items-center gap-2"><button className="icon-button" aria-label="Help"><CircleHelp className="h-4 w-4" /></button><button className="icon-button" aria-label="Notifications"><Activity className="h-4 w-4" /></button><div className="avatar ml-1">OB</div></div>
          </header>

          <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow text-mint">Good morning, Omar</p><h1 className="mt-2 max-w-[680px] font-display text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-paper sm:text-5xl">Make IT issues<br /><span className="text-white/45">feel less technical.</span></h1></div><button onClick={resetSession} className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-mute transition hover:border-white/25 hover:text-paper sm:flex"><RotateCcw className="h-3.5 w-3.5" /> Reset session</button></div>
              <div className="voice-card relative overflow-hidden rounded-[24px] border border-white/10 bg-[#171B1A] p-5 shadow-2xl shadow-black/20 sm:p-7">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-mint/10 blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className={cn("live-pulse", sessionState !== "ready" && "active")} /><span className="eyebrow">{stateCopy.eyebrow}</span></div><h2 className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{stateCopy.title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-mute">{stateCopy.description}</p></div><div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-mute"><span className="text-mint">●</span> AssemblyAI-ready</div></div>
                <div className="wave-wrap my-8" aria-label={sessionState === "listening" ? "Listening" : "Voice visualization"}>{Array.from({ length: 42 }).map((_, index) => <span key={index} className={cn("wave-bar", sessionState === "listening" && "wave-live", sessionState === "thinking" && "wave-thinking")} style={{ height: `${18 + ((index * 7) % 40)}px`, "--i": index } as React.CSSProperties } />)}</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Button onClick={sessionState === "listening" ? () => setSessionState("thinking") : startListening} className="h-12 rounded-xl bg-mint px-5 font-bold text-ink hover:bg-[#d8ff83]">{sessionState === "listening" ? <><Pause className="mr-2 h-4 w-4" /> Finish speaking</> : <><Mic className="mr-2 h-4 w-4" /> Start voice session</>}</Button><button className="flex h-12 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-mute transition hover:border-white/20 hover:text-paper" aria-label="Use keyboard input"><span className="kbd">⌘</span><span className="kbd">K</span><span className="hidden sm:inline">Type instead</span></button></div><span className="text-xs text-mute">{sessionState === "ready" ? "Usually replies in under 2 sec" : "Session is simulated for this demo"}</span></div>
              </div>

              <div className="mt-7 flex items-center justify-between"><div><p className="eyebrow">Quick start</p><h3 className="mt-1 font-display text-lg font-bold">What’s going on?</h3></div><button className="flex items-center gap-1 text-xs font-bold text-mute transition hover:text-mint">View all <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{issues.map((issue) => { const Icon = iconForIssue(issue.id); return <button key={issue.id} onClick={() => chooseIssue(issue)} className={cn("issue-card group text-left", activeIssueId === issue.id && "selected")}><div className={cn("issue-icon", `issue-${issue.color}`)}><Icon className="h-4 w-4" /></div><p className="mt-4 text-sm font-bold leading-5">{issue.shortLabel}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-mute">{issue.label}</p><ChevronRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-mint" /></button>; })}</div>
            </div>

            <aside className="min-w-0 space-y-5">
              <section className="panel rounded-[22px] border border-white/10 bg-graphite/70 p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Live transcript</p><h3 className="mt-1 font-display text-lg font-bold">Conversation</h3></div><span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-mute">{chat.length} events</span></div><div className="mt-5 space-y-4">{chat.slice(-3).map((item, index) => <div key={`${item.time}-${index}`} className={cn("flex gap-3", item.role === "user" && "flex-row-reverse text-right")}><div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", item.role === "assistant" ? "bg-mint/15 text-mint" : "bg-sky/15 text-sky")} >{item.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}</div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mute">{item.role === "assistant" ? "TechSəs" : "You"} <span className="ml-1 font-normal normal-case tracking-normal text-white/25">{item.time}</span></p><p className="mt-1 text-xs leading-5 text-white/75">{item.text}</p></div></div>)}</div><div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4"><div className="flex -space-x-1.5"><span className="mini-avatar bg-mint text-ink">TS</span><span className="mini-avatar bg-sky text-ink">AI</span></div><span className="text-[11px] text-mute">Voice agent is standing by</span><span className="ml-auto"><Volume2 className="h-3.5 w-3.5 text-mint" /></span></div></section>
              <section className="ticket-card rounded-[22px] border border-white/10 bg-paper p-5 text-ink sm:p-6"><div className="flex items-start justify-between"><div><p className="eyebrow text-ink/45">Ticket draft</p><h3 className="mt-1 font-display text-lg font-bold">{ticketCreated ? "Ticket created" : "Ready to summarize"}</h3></div><div className={cn("rounded-xl p-2.5", ticketCreated ? "bg-mint" : "bg-ink text-mint")}>{ticketCreated ? <Check className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}</div></div><div className="mt-5 rounded-xl bg-ink/[0.06] p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-ink/50">{activeIssue.category} / {activeIssueId.toUpperCase()}-024</span><span className={cn("priority", `priority-${activeIssue.priority.toLowerCase()}`)}>{activeIssue.priority}</span></div><p className="mt-3 text-sm font-bold leading-5">{activeIssue.label}</p><p className="mt-1 text-xs leading-5 text-ink/55">Suggested next step: {activeIssue.action}</p></div><Button onClick={createTicket} disabled={ticketCreated || sessionState === "ready"} className="mt-4 h-11 w-full rounded-xl bg-ink font-bold text-paper hover:bg-ink/85 disabled:opacity-50">{ticketCreated ? <><Check className="mr-2 h-4 w-4 text-mint" /> Draft saved to tickets</> : <><Send className="mr-2 h-4 w-4" /> Create ticket summary</>}</Button><p className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-ink/45"><ShieldCheck className="h-3 w-3" /> No data leaves this demo</p></section>
            </aside>
          </section>
          <footer className="mt-8 flex flex-col gap-2 border-t border-white/10 py-5 text-[10px] uppercase tracking-[0.14em] text-mute sm:flex-row sm:items-center sm:justify-between"><span>TechSəs / Voice-first IT support</span><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-mint" /> Built for AssemblyAI Hackathon</span></footer>
        </main>
      </div>
      {showToast && <div className="toast"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-ink"><Check className="h-4 w-4" /></div><div><p className="text-sm font-bold">Ticket summary created</p><p className="mt-0.5 text-xs text-mute">Saved to your workspace.</p></div><button onClick={() => setShowToast(false)} className="ml-3 text-mute hover:text-paper" aria-label="Close notification"><X className="h-4 w-4" /></button></div>}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, count }: { icon: typeof Activity; label: string; active?: boolean; count?: string }) {
  return <button className={cn("nav-item", active && "active")}><Icon className="h-4 w-4" /><span>{label}</span>{count && <span className="ml-auto text-[10px] text-mute">{count}</span>}</button>;
}
