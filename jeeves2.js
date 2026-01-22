import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const author = env.AUTHOR || "AngelaImut";

    // Header wajib biar nggak kena blokir CORS
    const headersResponse = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle permintaan OPTIONS (Preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: headersResponse });
    }

    const url = new URL(request.url);
    let q = url.searchParams.get('q') || url.searchParams.get('prompt');
    let id = url.searchParams.get('id'); // Opsional, untuk tracking session di sisi client

    // Support ambil pesan dari POST body
    if (request.method === "POST") {
      try {
        const body = await request.json();
        q = body.q || body.prompt || q;
        id = body.id || id;
      } catch (e) {}
    }

    if (!q) {
      return new Response(JSON.stringify({
        status: false,
        author: author,
        message: "Mau nanya apa ke Jeeves? Contoh: ?q=Halo",
      }), { status: 400, headers: headersResponse });
    }

    try {
      // Endpoint Jeeves AI
      const targetUrl = `https://labs.shannzx.xyz/api/v1/jeeves?prompt=${encodeURIComponent(q)}`;
      
      const response = await axios.get(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });

      const data = response.data;

      // Inisialisasi library internal (tetap di mesin)
      const $ = cheerio.load('<html></html>');

      return new Response(JSON.stringify({
        status: true,
        author: author,
        query: q,
        result: {
          answer: data.data?.answer || "Jeeves nggak ngasih jawaban nih.",
          messageId: data.data?.messageId || id || null
        },
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`
      }), { status: 200, headers: headersResponse });

    } catch (e) {
      return new Response(JSON.stringify({
        status: false,
        author: author,
        message: "Gagal terhubung ke Jeeves AI!",
        error: e.message
      }), { status: 500, headers: headersResponse });
    }
  }
};
