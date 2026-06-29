export type Priority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  priority: Priority;
  energy_level?: "High" | "Medium" | "Low";
  tags?: string[];
  dependencyId?: string;
  // Dynamic schedule fields computed client-side based on duration, sequence and work start times
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  isCompleted?: boolean;
}

export interface AssistantLogicChunk {
  text: string;
  status: "completed" | "active" | "pending";
}

export interface ParsingResult {
  deadlines: string[];
  logic: string[];
  tasks: Task[];
}

export interface StructuredDeadline {
  id: string;
  title: string;
  dueDateTime: string;
  priority: Priority;
  notified?: boolean;
  isCompleted?: boolean;
  alerted24h?: boolean;
  alerted12h?: boolean;
  alerted6h?: boolean;
  alerted1h?: boolean;
  syncedToCalendar?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  bulletTasks?: Task[];
  deadlines?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}
