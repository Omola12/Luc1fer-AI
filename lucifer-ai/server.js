import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet()); // Security headers
app.use(cors());   // Allow frontend cross-origin requests
app.use(express.json({ limit: "10mb" }));

// Rate limiting (prevent abuse)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // Limit each IP to 30 requests per minute
});
app.use("/api/", limiter);

app.use(express.static(path.join(__dirname, "public")));

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { messages = [], temperature = 0.7, max_tokens = 2048, stream = false } = req.body;

  // Basic validation
  if (!Array.isArray(messages) || messages.length === 0 || !messages[messages.length - 1]?.content) {
    return res.status(400).json({ error: "Invalid messages array or missing user message" });
  }

  // Prepend specialized coding system prompt (only once at the start)
  const fullMessages = messages[0]?.role === "system"
    ? messages
    : [
        {
          role: "system",
          content:
            "You are CODEMASTER, an expert coding AI assistant. You help with programming in any language (Python, JavaScript, Java, C++, etc.). " +
            "Provide clear explanations, follow best practices, include comments, handle edge cases, and suggest optimizations. " +
            "If debugging, explain the issue and fix step-by-step. Always format code properly with markdown.",
        },
        ...messages,
      ];

  try {
    if (stream) {
      // Streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const streamResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: fullMessages,
        temperature,
        max_tokens,
        stream: true,
      });

      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${content}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      // Non-streaming response
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: fullMessages,
        temperature,
        max_tokens,
      });

      const reply = completion.choices[0]?.message?.content || "Sorry, no response generated.";
      res.json({ reply });
    }
  } catch (err) {
    console.error("Groq API Error:", err);
    res.status(500).json({ error: "AI service error. Please try again later." });
  }
});

// Fallback for SPA routing (if using React/Vite frontend)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});});

// Feedback submission
app.post("/api/feedback", (req, res) => {
  const { message } = req.body;
  // Here you could send to WhatsApp using your service
  console.log("Feedback submitted:", message);
  res.json({ success: true });
});

app.listen(3000, () => console.log("Lucifer AI running on http://localhost:3000"));
let messages = [
  { role: "user", content: "Write a quicksort in Python" },
  { role: "assistant", content: "Previous AI reply here..." },
  { role: "user", content: "Now make it async in JS" }  // New different question
];

fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({ messages, temperature: 0.8 })
});
