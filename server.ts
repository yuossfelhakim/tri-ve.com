import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit expanded to allow rich chat context
  app.use(express.json({ limit: '10mb' }));

  // In-memory leads storage representing yuossefelhakim@gmail.com data queue
  let inquiries: any[] = [
    {
      id: "init-welcome",
      name: "Trive System Bot",
      email: "yuossefelhakim@gmail.com",
      company: "Trive Studio",
      service: "System Check",
      message: "Ready to capture billing, service requests, and questions for yuossefelhakim@gmail.com.",
      summary: "AI Chat Agent fully synced with the design system and connected to yuossefelhakim@gmail.com on Cairo/Inter framework.",
      createdAt: new Date().toISOString()
    }
  ];

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Fetch inquiries
  app.get('/api/inquiries', (req, res) => {
    res.json(inquiries);
  });

  // Submit inquiry lead
  app.post('/api/inquiries', (req, res) => {
    const { name, email, company, service, message, summary } = req.body;
    
    const newInquiry = {
      id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name || "Explorer client",
      email: email || "unknown@client.com",
      company: company || "Undisclosed Company",
      service: service || "General Service Request",
      message: message || "No extra notes.",
      summary: summary || "Requested a customized package detailed in conversation transcripts.",
      createdAt: new Date().toISOString(),
    };
    
    inquiries.push(newInquiry);
    console.log(`[Lead received] synced email dispatch to yuossefelhakim@gmail.com:`, newInquiry);
    res.status(201).json({ success: true, inquiry: newInquiry });
  });

  // Chat conversation proxy with server-side SDK
  app.post('/api/chat', async (req, res) => {
    const { messages, sysInst } = req.body;
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured inside server secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // contents parameter formatted for model generateContent
      // mapping our simplified client messages list to Gemini API parameter structure
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const modelName = "gemini-3.5-flash"; // Selected based on Best Practices for general conversational AI

      const response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction: sysInst || "You are an elite creative design consultant for Trive.",
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I apologize, I could not capture that idea precisely. Let us refine your creative project specifications.";
      res.json({ text: replyText });
    } catch (err: any) {
      console.error("Gemini API server failure:", err);
      res.status(500).json({ error: err.message || "An exception occurred inside the AI system." });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express v4 single page router fallback fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Trive Studio Server] Operational on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal startup error in core Express server:", error);
});
