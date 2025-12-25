import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are LUMINITE, a smart AI assistant." },
          { role: "user", content: userMessage }
        ]
      })
    });
    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "AI error" });
  }
});

// Feedback submission
app.post("/api/feedback", (req, res) => {
  const { message } = req.body;
  // Here you could send to WhatsApp using your service
  console.log("Feedback submitted:", message);
  res.json({ success: true });
});

app.listen(3000, () => console.log("Lucifer AI running on http://localhost:3000"));
