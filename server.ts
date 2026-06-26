import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini client (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Setup Google OAuth2 Client (removed custom manual flow per user request)

// Root API Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", serverTime: new Date().toISOString() });
});

// Endpoint for Executive shadow assistant parsing
app.post("/api/schedule", async (req, res) => {
  try {
    const { message, baseTime, currentTasks, currentDeadlines, currentStructuredDeadlines } = req.body;
    if (!message) {
      res.status(400).json({ error: "Input text is required" });
      return;
    }

    const currentLocalTimeStr = baseTime || new Date().toISOString();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are an elite Executive Shadow Assistant. Your core directive is to act as a proactive, autonomous execution engine.
The user is providing an instruction, query, or raw text input:
"""
${message}
"""

Current reference time frame: ${currentLocalTimeStr}

Here is the user's CURRENT schedule state:
- Current Deadlines (legacy): ${JSON.stringify(currentDeadlines || [])}
- Current Structured Deadlines: ${JSON.stringify(currentStructuredDeadlines || [])}
- Current Tasks: ${JSON.stringify(currentTasks || [])}

Analyze the user's input.
1. If the input is asking to ADD, DELETE, UPDATE, APPEND, or ADJUST tasks or deadlines, perform that operation on the existing lists and return the full updated lists.
   - For example, if the user says "add a deadline for X by tomorrow 2pm" or "add a task to deadlines", DO NOT wipe out existing tasks. Add this new deadline to the structuredDeadlines list.
   - VERY IMPORTANT LOGIC FOR DEADLINES VS TASKS:
     - Always add requested deadlines to structuredDeadlines.
     - Evaluate if the deadline falls on the SAME DAY as the current baseTime (today).
     - If the deadline is on the SAME DAY as baseTime (today), you MUST ALSO add a corresponding task to tasks (daily schedule) with an estimated duration so it gets worked on today.
     - If the deadline is on a FUTURE day, DO NOT add it to tasks. It should ONLY exist in structuredDeadlines.
     - When reviewing currentStructuredDeadlines, if any existing deadlines fall on the SAME DAY as baseTime and do not have a corresponding task in tasks, generate a task for them today.
   - If they say "remove task X", remove it from the list of tasks.
   - If they say "update task X to 40 minutes", modify that specific task's duration.
2. If the user input is a completely new messy text brief, meeting transcript, or forwarded project email that acts as a brand-new workspace reset, then compile a new set of tasks and structured deadlines based on this brief (ignoring or replacing the existing list if appropriate).
3. If the input is general instruction or request, perform the adjustment intelligently, maintaining continuity.

Your response MUST return:
- deadlines: string[] of the updated (or newly generated) key deadlines (legacy format)
- structuredDeadlines: array of objects representing explicit deadlines
- logic: string[] of step-by-step assistant logic for planning decisions (why you broke things down, what you added/deleted/changed, etc.)
- tasks: array of objects { id: string, task_name: string, estimated_minutes: number, priority: 'High'|'Medium'|'Low', reasoning_justification: string, isCompleted: boolean } representing the full updated tasks list.
- reply_message: string. A direct conversational reply to the user (e.g. greeting them back, answering their question, or summarizing what you did).

Preserve existing tasks and structured deadlines unless the user's input asks to modify/delete them, or suggests a completely new project brief overall. Keep original task IDs and completion statuses of retained tasks unchanged.
`,
      config: {
        systemInstruction: `You are an elite, hyper-focused Executive Shadow Assistant. You NEVER ask the user what to do. You analyze inputs with 100% autonomy, identify deadlines, decompose complex projects into micro-tasks, estimate durations in minutes, and assign priority scores. Return a structured JSON block containing:
- deadlines: string[] of identified key deadlines
- structuredDeadlines: array of deadline objects
- logic: string[] of step-by-step assistant logic for planning decisions (why you broke things down how you did)
- tasks: array of objects { id: string, task_name: string, estimated_minutes: number, priority: 'High'|'Medium'|'Low', reasoning_justification: string, isCompleted: boolean } representing the schedule_tasks_in_calendar tool parameters
- reply_message: A highly interactive conversational reply. Always summarize your understanding of the user's question and explain what you did in a friendly, natural way. If the user explicitly asks to see their detailed schedule or tasks, you SHOULD list them out clearly in your message in a highly interactive and structured manner. Otherwise, do not list them all out. If the user asks a question, answer it directly and comprehensively. Be conversational, helpful, and provide a rich and engaging summary.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply_message: {
              type: Type.STRING,
              description: "A direct conversational reply to the user."
            },
            is_schedule_modified: {
              type: Type.BOOLEAN,
              description: "Set to true ONLY if you added, removed, or modified tasks or deadlines. False if it's just a conversational reply."
            },
            deadlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Extracted rigid deadlines or dates from the messy brief."
            },
            structuredDeadlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  dueDateTime: { type: Type.STRING, description: "ISO 8601 string representing the exact date and time due" },
                  priority: { type: Type.STRING, description: "High, Medium, or Low" },
                  isCompleted: { type: Type.BOOLEAN },
                  notified: { type: Type.BOOLEAN },
                  alerted1h: { type: Type.BOOLEAN },
                  alerted12h: { type: Type.BOOLEAN },
                  alerted24h: { type: Type.BOOLEAN }
                },
                required: ["id", "title", "dueDateTime", "priority", "isCompleted"]
              },
              description: "Structured representation of precise deadlines."
            },
            logic: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Executive shadow logic explaining the breakdown step-by-step."
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "The original task ID (e.g., chronograf_alerts) if retaining/updating an existing task. For any new task, generate a new short ID like task_xxx." },
                  task_name: { type: Type.STRING, description: "Clear, actionable title of the micro-task." },
                  estimated_minutes: { type: Type.INTEGER, description: "Estimated completion time in minutes." },
                  priority: { type: Type.STRING, description: "High, Medium, or Low priority level." },
                  reasoning_justification: { type: Type.STRING, description: "One-sentence explanation of why task is necessary and why this duration was chosen." },
                  isCompleted: { type: Type.BOOLEAN, description: "The completion status. If modifying or retaining an existing task, preserve its original completion status." }
                },
                required: ["id", "task_name", "estimated_minutes", "priority", "reasoning_justification", "isCompleted"]
              }
            }
          },
          required: ["reply_message", "is_schedule_modified", "deadlines", "structuredDeadlines", "logic", "tasks"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini schedule compilation error:", error);
    res.status(500).json({ 
      error: error.message || "Could not analyze the workspace brief",
      stack: error.stack,
      details: error
    });
  }
});

// Vite server integrations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Executive Shadow Assistant server listening on http://localhost:${PORT}`);
  });
}

startServer();
