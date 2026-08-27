export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('id');
  const baseUrl = 'https://boonnews.vercel.app';
  const firebaseProjectId = 'primeintelmedia-e2fe3';
  const defaultBanner = `${baseUrl}/boon-news-og-banner.jpg`;

  // 1. Fetch static template safely
  let html = '';
  try {
    const htmlResponse = await fetch(`${baseUrl}/reader.html`, { cache: 'no-store' });
    if (htmlResponse.ok) {
      html = await htmlResponse.text();
    }
  } catch (e) {
    console.error('Failed to fetch static template:', e);
  }

  // Fallback minimal HTML structure if reader.html fails to load
  if (!html) {
    html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body><div id="app"></div></body></html>`;
  }

  // If no article ID is present, return static template
  if (!articleId) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  try {
    // 2. Query Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/newsPosts/${articleId}`;
    const res = await fetch(firestoreUrl);

    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};

      const rawTitle = fields.title?.stringValue || 'BoonNews | Breaking Updates';
      const title = rawTitle.replace(/"/g, '&quot;');
      
      const rawSummary = fields.summary?.stringValue || 
                         fields.content?.stringValue?.replace(/<[^>]*>?/gm, '').substring(0, 155) || 
                         'Read full news articles, analysis, and breaking updates on BoonNews.';
      const summary = rawSummary.replace(/"/g, '&quot;');

      let image = fields.imageUrl?.stringValue || defaultBanner;
      if (!image.startsWith('http')) {
        image = defaultBanner;
      }

      const author = fields.author?.stringValue || 'BoonNews Editorial';
      const currentUrl = `${baseUrl}/reader?id=${articleId}`;

      // 3. Build complete Meta Tags & OpenGraph Block
      const metaInjection = `
  <title>${title} | BoonNews</title>
  <meta name="description" content="${summary}">
  <link rel="canonical" href="${currentUrl}">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${currentUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${summary}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="BoonNews">
  <meta property="fb:app_id" content="1767963851059615">

  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${currentUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${summary}">
  <meta name="twitter:image" content="${image}">

  <!-- Structured JSON-LD Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${rawTitle.replace(/"/g, '\\"')}",
    "image": ["${image}"],
    "description": "${rawSummary.replace(/"/g, '\\"')}",
    "author": {
      "@type": "Person",
      "name": "${author.replace(/"/g, '\\"')}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "BoonNews",
      "logo": {
        "@type": "ImageObject",
        "url": "${defaultBanner}"
      }
    }
  }
  </script>`;

      // Strip existing <title> tag to prevent duplication
      html = html.replace(/<title[^>]*>.*?<\/title>/i, '');

      // Inject clean meta tags into <head>
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${metaInjection}\n</head>`);
      } else {
        html = metaInjection + html;
      }
    }
  } catch (err) {
    console.error('Error processing Edge request:', err);
  }

  // 4. Return server-rendered HTML response
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
    },
  });
}
