import { fetch as nodeFetch } from 'node-fetch';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, imageBase64 } = req.body || {};
    if (!prompt || !imageBase64) return res.status(400).json({ error: 'Missing prompt or imageBase64' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: missing GEMINI_API_KEY' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }
      ]
    };

    const r = await nodeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await r.json();

    if (!r.ok) {
      // Return Gemini's error message but do not expose internal server details
      return res.status(r.status).json({ error: json.error?.message || 'Generative API error', details: json });
    }

    // Return Gemini response directly
    return res.status(200).json(json);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
