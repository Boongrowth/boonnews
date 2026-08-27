export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('id');
  const baseUrl = 'https://boonnews.vercel.app';
  const firebaseProjectId = 'primeintelmedia-e2fe3';

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

  // Fallback structural HTML if reader.html fails to load
  if (!html) {
    html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body><div id="app"></div></body></html>`;
  }

  // If no article ID is present, return the template as-is
  if (!articleId) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  try {
    // 2. Query Firestore via REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/newsPosts/${articleId}`;
    const res = await fetch(firestoreUrl);

    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};

      const title = fields.title?.stringValue || 'BoonNews | Read Article';
      const rawSummary = fields.summary?.stringValue || 
                         fields.content?.stringValue?.replace(/<[^>]*>?/gm, '').substring(0, 155) || 
                         'Read full news articles, analysis, and breaking updates on BoonNews.';
      const summary = rawSummary.replace(/"/g, '&quot;');
      const image = fields.imageUrl?.stringValue || `${baseUrl}/boon-news-og-banner.jpg`;
      const author = fields.author?.stringValue || 'BoonNews Editorial';
      const currentUrl = `${baseUrl}/reader?id=${articleId}`;

      // 3. Robust attribute replacements (works regardless of HTML attribute order)
      html = html
        .replace(/<title[^>]*>.*?<\/title>/i, `<title>${title} | BoonNews</title>`)
        .replace(/(<meta[^>]*id="metaTitleTag"[^>]*content=")[^"]*(")/i, `$1${title} | BoonNews$2`)
        .replace(/(<meta[^>]*id="metaDescription"[^>]*content=")[^"]*(")/i, `$1${summary}$2`)
        .replace(/(<link[^>]*id="metaCanonical"[^>]*href=")[^"]*(")/i, `$1${currentUrl}$2`)
        .replace(/(<meta[^>]*id="ogTitle"[^>]*content=")[^"]*(")/i, `$1${title}$2`)
        .replace(/(<meta[^>]*id="ogDescription"[^>]*content=")[^"]*(")/i, `$1${summary}$2`)
        .replace(/(<meta[^>]*id="ogImage"[^>]*content=")[^"]*(")/i, `$1${image}$2`)
        .replace(/(<meta[^>]*id="ogUrl"[^>]*content=")[^"]*(")/i, `$1${currentUrl}$2`)
        .replace(/(<meta[^>]*id="twitterTitle"[^>]*content=")[^"]*(")/i, `$1${title}$2`)
        .replace(/(<meta[^>]*id="twitterDescription"[^>]*content=")[^"]*(")/i, `$1${summary}$2`)
        .replace(/(<meta[^>]*id="twitterImage"[^>]*content=")[^"]*(")/i, `$1${image}$2`)
        .replace(/(<meta[^>]*id="twitterUrl"[^>]*content=")[^"]*(")/i, `$1${currentUrl}$2`);

      // 4. Safe JSON-LD Schema Construction
      const updatedSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "image": [image],
        "description": rawSummary,
        "author": {
          "@type": "Person",
          "name": author
        },
        "publisher": {
          "@type": "Organization",
          "name": "BoonNews",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/boon-news-og-banner.jpg`
          }
        }
      });

      // Inject Schema and Facebook App ID safely into <head>
      const metaInjection = `<meta property="fb:app_id" content="1767963851059615" />\n<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>`;
      
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${metaInjection}\n</head>`);
      } else {
        html = metaInjection + html;
      }
    }
  } catch (err) {
    console.error('Error processing Edge request:', err);
  }

  // 5. Serve response with cache headers
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
    },
  });
}
