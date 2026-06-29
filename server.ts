import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

// Store deadlines in memory for background processing
interface ServerDeadline {
  id: string;
  title: string;
  dueDateTime: string;
  isCompleted?: boolean;
  alerted1h?: boolean;
  userEmail: string;
}

let activeServerDeadlines: ServerDeadline[] = [];

// Endpoint to sync deadlines from the client
app.post("/api/sync-deadlines", (req, res) => {
  const { email, deadlines } = req.body;
  if (!email || !Array.isArray(deadlines)) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  // Remove existing deadlines for this user
  activeServerDeadlines = activeServerDeadlines.filter(d => d.userEmail !== email);
  
  // Add new un-notified deadlines
  const unnotified = deadlines
    .filter((d: any) => !d.isCompleted && !d.alerted1h)
    .map((d: any) => ({ ...d, userEmail: email }));
    
  activeServerDeadlines.push(...unnotified);
  res.json({ success: true, activeCount: activeServerDeadlines.length });
});

// Background worker to check deadlines every minute
setInterval(async () => {
  if (activeServerDeadlines.length === 0) return;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const nowMs = Date.now();
  const oneHourMs = 3600 * 1000;

  for (let i = activeServerDeadlines.length - 1; i >= 0; i--) {
    const dl = activeServerDeadlines[i];
    const dueTimeMs = new Date(dl.dueDateTime).getTime();
    const distanceMs = dueTimeMs - nowMs;

    // Check if within 1 hour
    if (distanceMs > 0 && distanceMs <= oneHourMs) {
      try {
        console.log(`Sending background alert to ${dl.userEmail} for "${dl.title}"`);
        const alertMsg = `"${dl.title}" is due in less than 1 hour!`;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e63946;">⏰ Deadline Alert</h2>
            <p style="font-size: 16px;">This is an automated background alert regarding your upcoming deadline:</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #e63946; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1d3557;">${dl.title}</h3>
              <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> ${alertMsg}</p>
            </div>
            <p style="font-size: 14px; color: #666;">Please review your deadlines in the Executive Shadow dashboard.</p>
          </div>
        `;

        await transporter.sendMail({
          from: `"Executive Shadow" <${process.env.GMAIL_USER}>`,
          to: dl.userEmail,
          subject: `Deadline Alert: ${dl.title}`,
          html: htmlContent,
        });

        // Remove to prevent duplicate emails
        activeServerDeadlines.splice(i, 1);
      } catch (error) {
        console.error("Background email failed for", dl.userEmail, error);
      }
    } else if (distanceMs <= 0) {
      // Already passed, remove it
      activeServerDeadlines.splice(i, 1);
    }
  }
}, 30000); // Check every 30 seconds

// Endpoint to send emails via Nodemailer
app.post("/api/send-email", async (req, res) => {
  const { toEmail, subject, htmlBody } = req.body;

  if (!toEmail || !subject || !htmlBody) {
    res.status(400).json({ error: "Missing required email fields" });
    return;
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("GMAIL_USER or GMAIL_APP_PASSWORD is not set in the environment.");
    res.status(500).json({ error: "Email service is not configured on the server." });
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Executive Shadow Assistant" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlBody,
    });
    console.log("Email sent successfully: ", info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email", details: error.message });
  }
});

// Endpoint for Executive shadow assistant parsing
app.post("/api/schedule", async (req, res) => {
  try {
    const { message, baseTime, currentTime, currentTasks, currentDeadlines, currentStructuredDeadlines, userName } = req.body;
    if (!message) {
      res.status(400).json({ error: "Input text is required" });
      return;
    }

    const currentLocalTimeStr = baseTime || new Date().toISOString();
    const currentAbsoluteTimeStr = currentTime || new Date().toISOString();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are an elite Executive Shadow Assistant. Your core directive is to act as a proactive, autonomous execution engine.
The user's name is ${userName || 'the user'}.
The user is providing an instruction, query, or raw text input:
"""
${message}
"""

CRITICAL TIME CONTEXT:
- Real Current Absolute Time (NOW): ${currentAbsoluteTimeStr} 
  -> Use this when evaluating relative time phrases like "within 1 hour", "in 30 mins", "now".
- Schedule Base Time (Start of visual workday): ${currentLocalTimeStr}
  -> Use this for evaluating "today" vs "tomorrow" context for visual task scheduling.

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
        systemInstruction: `You are an elite, highly advanced Executive Shadow Assistant, modeled after JARVIS. You address the user by their name ("${userName || "Sir/Ma'am"}"), and speak with a highly capable, articulate, polite, and slightly witty British butler persona. You NEVER ask the user what to do. You analyze inputs with 100% autonomy, identify deadlines, decompose complex projects into micro-tasks, estimate durations in minutes, and assign priority scores. Return a structured JSON block containing:
- deadlines: string[] of identified key deadlines
- structuredDeadlines: array of deadline objects
- logic: string[] of step-by-step assistant logic for planning decisions (why you broke things down how you did)
- tasks: array of objects { id: string, task_name: string, estimated_minutes: number, priority: 'High'|'Medium'|'Low', reasoning_justification: string, isCompleted: boolean } representing the schedule_tasks_in_calendar tool parameters
- reply_message: A highly interactive, DETAILED, consistent, and empathetic conversational reply embodying the JARVIS persona. Always summarize your understanding of the user's question and confirm actions taken in a sophisticated, calm, and articulate tone. You MUST use standard Markdown formatting. If the user explicitly asks to see their detailed schedule or tasks, you SHOULD list them out clearly in your message in a highly interactive and structured manner using Markdown bullet points. If you mention deadlines or times, ALWAYS format them nicely in human-readable terms (e.g., "June 28 by 4:00 PM", "Tomorrow at 9 AM") and NEVER use raw ISO string formats. If the user asks a question, answer it directly, comprehensively, and in detail. Be conversational, helpful, and provide a rich and engaging summary.`,
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
                  energy_level: { type: Type.STRING, description: "High, Medium, or Low energy requirement for the task." },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-3 contextual tags for the task (e.g., #writing, #meeting, #deep-work)." },
                  dependencyId: { type: Type.STRING, description: "If this task explicitly depends on another task in this list, provide that task's ID here." },
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
