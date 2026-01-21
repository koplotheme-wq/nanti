import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const author = env.AUTHOR || "AngelaImut";

    const headersResponse = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: headersResponse });
    }

    const url = new URL(request.url);
    let q = url.searchParams.get('q') || url.searchParams.get('query');
    let id = url.searchParams.get('id') || url.searchParams.get('token');

    if (request.method === "POST") {
      try {
        const body = await request.json();
        q = body.q || body.query || q;
        id = body.id || body.token || id;
      } catch (e) {}
    }

    if (!q) {
      return new Response(JSON.stringify({
        status: false,
        author: author,
        message: "Mana pertanyaannya? Cora nungguin nih!",
      }), { status: 400, headers: headersResponse });
    }

    // Kalau ID kosong, kita buatin token baru biar obrolan gak kecampur
    const sessionToken = id || `cora-${Math.random().toString(36).substring(2, 15)}`;

    try {
      const SYSTEM_PROMPT = `
        Lu adalah Cora. Temen ngobrol santai, gaul, empatik.
        Bahasa lu-gw, jangan kaku. Jawab natural kayak manusia.
      `;

      const payload = {
        authorId: '46211af4-89d2-47c2-93c4-62ac2282a524',
        licenseKey: '',
        generateChat: {
          chatId: sessionToken, // Token session masuk sini
          quantizationKey: 'vllm-mistralai/Mistral-Nemo-Instruct-2407',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: q }
          ],
          temperature: 0.7,
          topP: 0.9,
          topK: 30,
          nPredict: 512,
          repetitionPenalty: 1.1,
          contextSize: 4096,
          mlock: true
        }
      };

      const response = await axios.post('https://www.hammerai.com/api/cloud/chat', payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const reply = response.data;

      // Inisialisasi library pendukung (internal only)
      const $ = cheerio.load('<body></body>');

      return new Response(JSON.stringify({
        status: true,
        author: author,
        token: sessionToken, // Token ini yang lo simpan buat chat selanjutnya
        query: q,
        result: reply,
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`
      }), { status: 200, headers: headersResponse });

    } catch (e) {
      return new Response(JSON.stringify({
        status: false,
        author: author,
        message: "Waduh, koneksi ke Cora putus!",
        error: e.message
      }), { status: 500, headers: headersResponse });
    }
  }
};
