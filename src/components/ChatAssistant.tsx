import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Brain,
  Mic,
  MicOff,
  BellRing,
  Volume2,
  VolumeX,
  Send,
  Calendar,
  Clock,
  Flame,
  AlertTriangle,
  Lightbulb,
  Bot,
  Plus,
} from "lucide-react";
import { ChatMessage, Task, ChatSession } from "../types";
import { MESSY_SAMPLES, MessySample } from "../data";

interface ChatAssistantProps {
  isDark: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  sendMessage: (text: string) => void;
  chatMessages: ChatMessage[];
  setChatMessages: any;
  chatSessions: ChatSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  isListening: boolean;
  toggleSpeechRecognition: () => void;
  enableVoiceAssistant: boolean;
  setEnableVoiceAssistant: (b: boolean) => void;
  setActiveTab: (tab: "chat" | "calendar" | "notifications") => void;
  baseTime: string;
  baseDate: string;
}

export default function ChatAssistant({
  isDark,
  inputText,
  setInputText,
  isLoading,
  sendMessage,
  chatMessages,
  setChatMessages,
  chatSessions,
  activeSessionId,
  setActiveSessionId,
  createNewChat,
  deleteChat,
  isListening,
  toggleSpeechRecognition,
  enableVoiceAssistant,
  setEnableVoiceAssistant,
  setActiveTab,
  baseTime,
  baseDate,
}: ChatAssistantProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to lowest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatMessages, isLoading]);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
  };

  const handleLoadSampleToInput = (sample: MessySample) => {
    setInputText(sample.text);
    // Instant floating tip message
    const notification = document.getElementById("preset-toast");
    if (notification) {
      notification.classList.remove("opacity-0");
      notification.classList.add("opacity-100");
      setTimeout(() => {
        notification.classList.remove("opacity-100");
        notification.classList.add("opacity-0");
      }, 3000);
    }
  };

  return (
    <div className="flex flex-1 w-full min-h-0 relative gap-6">
      {/* Toast Reminder for Preset loaded */}
      <div
        id="preset-toast"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white font-mono text-xs px-4 py-2.5 rounded-xl shadow-lg border border-rose-500 opacity-0 transition-opacity duration-300 pointer-events-none"
      >
        💡 Preset loaded! Edit or press "Plan Workday" to orchestrate.
      </div>

      {/* Main Conversational Window Wrapper */}
      <div
        className={`flex-1 rounded-2xl border flex flex-col overflow-hidden shadow-sm transition-colors duration-200 ${
          isDark
            ? "bg-slate-900/60 border-slate-805 text-white"
            : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Chat Active Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between transition-colors duration-200 ${
            isDark ? "border-slate-800 bg-slate-900" : "border-slate-150 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center text-rose-500 ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-rose-50 border-rose-100"
              }`}
            >
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2
                className={`text-sm font-bold tracking-tight font-display flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Executive Shadow AI
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-500 uppercase tracking-widest font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Online
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Workday Planning Assistant & Orchestrator
              </p>
            </div>
          </div>

          {/* Settings / Synthesizer controller */}
          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className={`flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-mono px-2 py-1 rounded-lg border transition duration-200 ${
                isDark
                  ? "bg-rose-950/20 text-rose-400 border-rose-900/50 hover:bg-rose-900/40"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              }`}
              title="Start a new conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
            <label
              className={`flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-mono px-2 py-1 rounded-lg border transition duration-200 ${
                enableVoiceAssistant
                  ? isDark
                    ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/50"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isDark
                  ? "bg-slate-950 border-slate-800 text-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={enableVoiceAssistant}
                onChange={(e) => setEnableVoiceAssistant(e.target.checked)}
                className="hidden"
              />
              {enableVoiceAssistant ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>Voice Feedback</span>
            </label>
          </div>
        </div>

        {/* Message Feeds Block */}
        <div
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin ${
            isDark ? "scrollbar-thumb-slate-800" : "scrollbar-thumb-slate-200"
          }`}
        >
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold font-mono shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-slate-900 border-slate-800 text-rose-400"
                      : "bg-rose-600 border-rose-500 text-white"
                  }`}
                >
                  {msg.sender === "user" ? "ME" : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body Bubble */}
                <div className="space-y-1.5 flex flex-col">
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed transition-colors duration-200 ${
                      msg.sender === "user"
                        ? isDark
                          ? "bg-rose-650 text-white rounded-tr-none"
                          : "bg-rose-600 text-white rounded-tr-none"
                        : isDark
                        ? "bg-slate-950/80 border border-slate-805 text-slate-200 rounded-tl-none"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {/* Preserve multiline breaks */}
                    <div className="whitespace-pre-line font-sans">{msg.text}</div>
                  </div>
                  <span
                    className={`text-[9px] font-mono self-end ${
                      msg.sender === "user" ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Live Typing Thinking status bubble */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3.5 mr-auto max-w-[85%]"
              >
                <div className="w-8 h-8 rounded-full bg-rose-600 border border-rose-500 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed transition-colors duration-200 rounded-tl-none border ${
                      isDark
                        ? "bg-slate-950/80 border-slate-805 text-slate-250"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-500 animate-spin" />
                      <span className="font-mono font-bold text-slate-400">
                        Executive Shadow is thinking and analyzing...
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Text Form Area */}
        <div
          className={`p-4 border-t transition-colors duration-200 ${
            isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-150 bg-slate-50/50"
          }`}
        >
          {/* Quick pills for sample loads */}
          <div className="mb-3">
            <span className="block text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider font-extrabold">
              💨 Load Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {MESSY_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSampleToInput(sample)}
                  className={`text-[10px] font-mono px-3 py-1 border rounded-lg transition duration-150 flex items-center gap-1.5 ${
                    isDark
                      ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white"
                      : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                  title={sample.description}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sample.category === "Email"
                        ? "bg-cyan-500"
                        : sample.category === "Syllabus"
                        ? "bg-amber-500"
                        : sample.category === "Launch"
                        ? "bg-purple-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 items-end relative">
            <div className="relative flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type or paste messy notes/emails, dictations, or click the voice button..."
                rows={2}
                className={`w-full border rounded-xl pl-4 pr-32 py-3 text-sm focus:outline-none focus:border-rose-500 transition duration-200 font-mono leading-relaxed ring-0 resize-y min-h-[60px] max-h-[500px] ${
                  isDark
                    ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500"
                    : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                }`}
                disabled={isLoading}
              />

              {/* Float Audio mic controls */}
              <div className="absolute right-3.5 bottom-3 flex items-center gap-1.5 z-10">
                {inputText && (
                  <button
                    onClick={() => setInputText("")}
                    className={`text-[9px] font-mono px-2 py-1 border rounded-md transition ${
                      isDark
                        ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                    }`}
                    title="Clear content"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-1.5 rounded-lg border transition duration-200 flex items-center gap-1 text-[9px] font-mono font-bold ${
                    isListening
                      ? "bg-rose-600 border-rose-500 text-white animate-pulse shadow-xs"
                      : isDark
                      ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                  title={isListening ? "Recording... Click to lock" : "Click to speak"}
                >
                  {isListening ? (
                    <>
                      <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                      <Mic className="w-3 h-3 text-white" />
                      <span>ON</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 text-rose-500" />
                      <span>MIC</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className={`p-3.5 rounded-xl font-bold transition flex items-center justify-center shrink-0 active:scale-95 duration-150 cursor-pointer ${
                isLoading || !inputText.trim()
                  ? isDark
                    ? "bg-slate-950 border border-slate-850 text-slate-600"
                    : "bg-slate-100 border border-slate-200 text-slate-400"
                  : "bg-rose-600 text-white hover:bg-rose-500 shadow-md hover:shadow-lg"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2.5 px-1">
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Press <kbd className="px-1 rounded bg-slate-200/50 text-[9px]">Enter</kbd> to launch workday reasoning
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              Workday Base: {baseDate} @ {baseTime}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
