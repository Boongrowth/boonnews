// /api/sitemap.js

export default async function handler(req, res) {
  const BASE_URL = "https://boonnewsng.blog";
  const FIREBASE_PROJECT_ID = "primeintelmedia-e2fe3";

  try {
    // 1. Fetch news posts using Firestore REST API directly
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/newsPosts?pageSize=300`;
    const response = await fetch(firestoreUrl);
    
    let articles = [];
    if (response.ok) {
      const data = await response.json();
      articles = data.documents || [];
    } else {
      console.error("Firestore REST fetch error:", await response.text());
    }

    const currentDate = new Date().toISOString();

    // 2. Static homepage & essential compliance pages
    const staticPages = [
      { url: `${BASE_URL}/`, priority: "1.0", changefreq: "always", lastmod: currentDate },
      { url: `${BASE_URL}/index.html`, priority: "0.9", changefreq: "daily", lastmod: currentDate },
      { url: `${BASE_URL}/about.html`, priority: "0.5", changefreq: "monthly", lastmod: currentDate },
      { url: `${BASE_URL}/contact.html`, priority: "0.5", changefreq: "monthly", lastmod: currentDate },
      { url: `${BASE_URL}/advert.html`, priority: "0.5", changefreq: "monthly", lastmod: currentDate },
      { url: `${BASE_URL}/privacy.html`, priority: "0.3", changefreq: "monthly", lastmod: currentDate },
      { url: `${BASE_URL}/terms.html`, priority: "0.3", changefreq: "monthly", lastmod: currentDate }
    ];

    // 3. Build XML entries for static pages
    let urlsXml = staticPages
      .map(
        (page) => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
      )
      .join("");

    // 4. Build XML entries for dynamic Firestore newsPosts
    articles.forEach((doc) => {
      // Extract document ID from path "projects/.../documents/newsPosts/{id}"
      const id = doc.name.split("/").pop();
      const fields = doc.fields || {};

      // Parse timestamp from REST field types or fallback to current date
      let lastMod = currentDate;
      if (fields.updatedAt?.timestampValue) {
        lastMod = new Date(fields.updatedAt.timestampValue).toISOString();
      } else if (fields.createdAt?.timestampValue) {
        lastMod = new Date(fields.createdAt.timestampValue).toISOString();
      }

      // Format reader URL
      const articleUrl = `${BASE_URL}/reader.html?id=${id}`;

      urlsXml += `
  <url>
    <loc>${escapeXml(articleUrl)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // 5. Construct full XML output
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`.trim();

    // 6. Return XML response with headers
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.status(200).send(xmlContent);

  } catch (error) {
    console.error("Error generating sitemap:", error);
    return res.status(500).send("Error generating sitemap");
  }
}

// Helper to escape special characters for valid XML
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
