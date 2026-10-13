export const config = {
  runtime: 'edge', // Runs on Vercel's global Edge network
};

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const searchParams = url.searchParams;

  // Extract identifier from clean path (/article/slug-or-id) or query params (?slug=... or ?id=...)
  let identifier = null;
  if (pathParts[0] === 'article' && pathParts[1]) {
    identifier = decodeURIComponent(pathParts[1]);
  } else {
    identifier = searchParams.get('slug') || searchParams.get('id');
  }

  const baseUrl = 'https://boonnewsng.blog';
  const firebaseProjectId = 'primeintelmedia-e2fe3';

  // 1. Fetch static template file explicitly to work seamlessly with cleanUrls: false
  const htmlResponse = await fetch(`${baseUrl}/reader.html`);
  let html = await htmlResponse.text();

  // Return base template if no identifier is present in URL
  if (!identifier) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  try {
    let fields = null;

    // 2. Try querying Firestore REST API by 'slug' field first using runQuery
    const runQueryUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: 'newsPosts' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'slug' },
            op: 'EQUAL',
            value: { stringValue: identifier }
          }
        },
        limit: 1
      }
    };

    const queryRes = await fetch(runQueryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload)
    });

    if (queryRes.ok) {
      const queryResults = await queryRes.json();
      if (queryResults && queryResults[0]?.document?.fields) {
        fields = queryResults[0].document.fields;
      }
    }

    // 3. Fallback: If slug query yields nothing, try direct document ID lookup
    if (!fields) {
      const directUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/newsPosts/${identifier}`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const directData = await directRes.json();
        fields = directData.fields || null;
      }
    }

    // Handle missing articles (Prevent Soft 404 errors in Google Search Console)
    if (!fields) {
      html = html.replace(/<\/head>/i, '<meta name="robots" content="noindex, follow">\n</head>');
      return new Response(html, {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    // Helper to safely sanitize strings for HTML tag attributes
    const escapeAttr = (str = '') =>
      str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Map dynamic Title
    const rawTitle = fields.title?.stringValue || 'Boon News | Read Article';
    const title = escapeAttr(rawTitle);
    const pageTitle = escapeAttr(`${rawTitle} | Boon News`);
    
    // Map dynamic Summary
    let rawSummary = fields.summary?.stringValue || 
                     fields.excerpt?.stringValue || 
                     fields.description?.stringValue || '';

    if (!rawSummary && fields.content?.stringValue) {
      rawSummary = fields.content.stringValue
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/\s+/g, ' ')   // Collapse whitespace
        .trim()
        .substring(0, 155);
    }

    if (!rawSummary) {
      rawSummary = 'Read full news articles, analysis, and breaking updates on Boon News.';
    }
    const summary = escapeAttr(rawSummary);

    // Map Image, Author, and Exact Clean Canonical URL
    const image = escapeAttr(fields.imageUrl?.stringValue || fields.image?.stringValue || `${baseUrl}/boon-news-og-banner.jpg`);
    const canonicalIdentifier = fields.slug?.stringValue || identifier;
    const currentUrl = `${baseUrl}/article/${canonicalIdentifier}`;

    // Precise Regex replacement function for Head Meta Tags
    const replaceOrAppend = (htmlText, pattern, newTag) => {
      if (pattern.test(htmlText)) {
        return htmlText.replace(pattern, newTag);
      }
      return htmlText.replace(/<\/head>/i, `${newTag}\n</head>`);
    };

    // Update Titles
    html = html.replace(/<title[^>]*>.*?<\/title>/i, `<title>${pageTitle}</title>`);
    html = replaceOrAppend(html, /<meta[^>]*name=["']title["'][^>]*>/i, `<meta name="title" content="${pageTitle}" />`);

    // Update Canonical Link
    html = replaceOrAppend(html, /<link[^>]*rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${currentUrl}" />`);

    // Update Descriptions
    html = replaceOrAppend(html, /<meta[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${summary}" />`);
    html = replaceOrAppend(html, /<meta[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${summary}" />`);
    html = replaceOrAppend(html, /<meta[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${summary}" />`);

    // Update Open Graph Tags
    html = replaceOrAppend(html, /<meta[^>]*property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}" />`);
    html = replaceOrAppend(html, /<meta[^>]*property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${image}" />`);
    html = replaceOrAppend(html, /<meta[^>]*property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${currentUrl}" />`);

    // Update Twitter Tags
    html = replaceOrAppend(html, /<meta[^>]*name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
    html = replaceOrAppend(html, /<meta[^>]*name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${image}" />`);
    html = replaceOrAppend(html, /<meta[^>]*name=["']twitter:url["'][^>]*>/i, `<meta name="twitter:url" content="${currentUrl}" />`);

    // Facebook App ID
    html = replaceOrAppend(html, /<meta[^>]*property=["']fb:app_id["'][^>]*>/i, `<meta property="fb:app_id" content="1767963851059615" />`);

    // Update Structured Data Schema (JSON-LD)
    const updatedSchema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": rawTitle,
      "image": [image],
      "description": rawSummary,
      "author": {
        "@type": "Person",
        "name": fields.author?.stringValue || 'Boon News Editorial'
      },
      "publisher": {
        "@type": "Organization",
        "name": "Boon News",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/boon-news-og-banner.jpg`
        }
      }
    });

    if (/<script type="application\/ld\+json" id="articleSchema">.*?<\/script>/s.test(html)) {
      html = html.replace(
        /<script type="application\/ld\+json" id="articleSchema">.*?<\/script>/s,
        `<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>`
      );
    } else {
      html = html.replace(/<\/head>/i, `<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>\n</head>`);
    }

  } catch (err) {
    console.error('Error fetching Firestore metadata:', err);
  }

  // Return server-rendered HTML with edge caching
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
    },
  });
}
