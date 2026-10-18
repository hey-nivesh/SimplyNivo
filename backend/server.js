const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const z = require('zod');
require('dotenv').config();

const app = express();

// Security & Headers
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting (Prevent API key exhaustion)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api/', apiLimiter);

// Multer in-memory storage for audio processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max audio
});

// Clients Initializers
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Health Check Endpoint (Render Keep-Alive & Diagnostic)
app.get('/health', async (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      geminiConfigured: !!geminiApiKey,
      supabaseConfigured: !!supabase
    }
  });
});

// Request Input Schema Validation (Supporting both situation & text keys)
const SimplifySchema = z.object({
  situation: z.string().optional(),
  text: z.string().optional(),
  tone: z.enum(['simplest', 'executive', 'empathetic']).optional().default('simplest'),
  userId: z.string().uuid().optional(),
  category: z.string().optional()
});

/**
 * Strips markdown code fences if Gemini returns ```json ... ```
 */
function cleanJsonResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

// API Endpoint: Text & Situation Simplification
app.post('/api/simplify', async (req, res) => {
  try {
    const parseResult = SimplifySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors });
    }

    const { tone, userId, category } = parseResult.data;
    const situation = (parseResult.data.situation || parseResult.data.text || '').trim();

    if (!situation || situation.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Situation description is too short (minimum 3 characters required).'
      });
    }

    if (!genAI) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI API key is not configured on backend environment.'
      });
    }

    // Attempt Gemini 2.5 Flash, with fallback to 1.5 Flash if model name differs
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const prompt = `
You are SimplyNivo — an elite personal conversation companion and master of clear articulation.

User Situation: "${situation}"
Target Tone: ${tone}
Category Context: ${category || 'general'}

RULES:
1. Eliminate all corporate buzzwords, passive phrases, and vague jargon.
2. Reframe the core point into plain, 5th-grade reading level conversational speech.
3. Structure response into exact JSON output format:
{
  "corePoint": "One direct sentence explaining what is happening.",
  "spokenPhrasing": "Exact 2-3 sentences the user should say out loud to explain this to anyone clearly.",
  "talkingPoints": ["Point 1", "Point 2"]
}
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const responseText = result.response.text();
    const cleanedText = cleanJsonResponse(responseText);
    const parsedOutput = JSON.parse(cleanedText);

    // Standardize combined text for client views
    const pointsFormatted = Array.isArray(parsedOutput.talkingPoints)
      ? parsedOutput.talkingPoints.map((pt) => `• ${pt}`).join('\n')
      : '';
    const combinedOutput = `${parsedOutput.corePoint}\n\n"${parsedOutput.spokenPhrasing}"\n${pointsFormatted}`;

    // Save transaction to Supabase if userId is provided and Supabase is configured
    if (userId && supabase) {
      supabase.from('conversations').insert({
        user_id: userId,
        original_situation: situation,
        simplified_phrasing: parsedOutput.spokenPhrasing,
        category: tone
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Insert Warning]:', error.message);
      }).catch((err) => {
        console.warn('[Supabase Network Warning]:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      data: parsedOutput,
      simplified: combinedOutput,
      output: combinedOutput,
      corePoint: parsedOutput.corePoint,
      outLoudPhrasing: parsedOutput.spokenPhrasing,
      bulletPoints: parsedOutput.talkingPoints || []
    });

  } catch (error) {
    console.error('API Error /api/simplify:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process situation with Gemini AI engine.',
      details: error.message
    });
  }
});

// API Endpoint: Multipart Audio Upload & Audio-Assisted Simplification
app.post('/api/simplify-audio', upload.single('audio'), async (req, res) => {
  try {
    const tone = req.body.tone || 'simplest';
    const situation = (req.body.situation || req.body.text || 'Voice conversation audio note').trim();

    if (!genAI) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI API key is not configured.'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const parts = [
      {
        text: `You are SimplyNivo. Simplify this spoken situation into zero buzzwords with ${tone} tone. Return JSON: {"corePoint": "...", "spokenPhrasing": "...", "talkingPoints": ["...", "..."]}`
      }
    ];

    if (req.file && req.file.buffer) {
      parts.push({
        inlineData: {
          mimeType: req.file.mimetype || 'audio/m4a',
          data: req.file.buffer.toString('base64')
        }
      });
    } else {
      parts.push({ text: `Transcribed text / Context: ${situation}` });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsedOutput = JSON.parse(cleanJsonResponse(result.response.text()));
    const pointsFormatted = (parsedOutput.talkingPoints || []).map((pt) => `• ${pt}`).join('\n');
    const combinedOutput = `${parsedOutput.corePoint}\n\n"${parsedOutput.spokenPhrasing}"\n${pointsFormatted}`;

    return res.status(200).json({
      success: true,
      data: parsedOutput,
      simplified: combinedOutput,
      output: combinedOutput
    });
  } catch (error) {
    console.error('API Error /api/simplify-audio:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process audio recording with Gemini AI.'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SimplyNivo Enterprise Backend running on port ${PORT}`);
});
