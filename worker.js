export default {
  async fetch(request, env) {
 
    /* CORS preflight */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
 
    if (request.method !== "POST") {
      return err("Only POST allowed", 405);
    }
 
    try {
      const formData = await request.formData();
      const file     = formData.get("file");
      const folder   = formData.get("folder") || "uploads";
 
      if (!file) return err("No file in request", 400);
 
      const ext    = file.name.split(".").pop().toLowerCase();
      const key    = folder + "/" + Date.now() + "." + ext;
      const buffer = await file.arrayBuffer();
 
      /* Upload directly to R2 via binding — no API keys needed */
      await env.BUCKET.put(key, buffer, {
        httpMetadata: { contentType: file.type || "application/octet-stream" }
      });
 
      /* Build public URL using R2 public domain */
      const publicUrl = env.PUBLIC_URL + "/" + key;
 
      return new Response(JSON.stringify({ url: publicUrl, key }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
 
    } catch (e) {
      return err("Worker error: " + e.message, 500);
    }
  }
};
 
function err(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
