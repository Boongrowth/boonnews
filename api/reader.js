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

  // 1. Fetch static reader.html template
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

    if (fields) {
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
      
      // Map dynamic Summary (Checks summary -> excerpt -> description -> stripped HTML content)
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

      // Map Image, Author, and Canonical URL (Always use clean absolute URL)
      const image = escapeAttr(fields.imageUrl?.stringValue || fields.image?.stringValue || `${baseUrl}/boon-news-og-banner.jpg`);
      const canonicalIdentifier = fields.slug?.stringValue || identifier;
      const currentUrl = escapeAttr(`${baseUrl}/article/${canonicalIdentifier}`);

      // Helper: Replaces tag if present in template; appends to <head> if missing
      const setOrInjectTag = (htmlText, pattern, newTag) => {
        if (pattern.test(htmlText)) {
          return htmlText.replace(pattern, newTag);
        }
        return htmlText.replace(/<\/head>/i, `${newTag}\n</head>`);
      };

      // 4. Update standard Page Titles & Canonical Tags
      html = html.replace(/<title[^>]*>.*?<\/title>/i, `<title>${pageTitle}</title>`);
      html = setOrInjectTag(html, /<meta[^>]*id="metaTitleTag"[^>]*>/i, `<meta id="metaTitleTag" name="title" content="${pageTitle}" />`);
      html = setOrInjectTag(html, /<link[^>]*id="metaCanonical"[^>]*>/i, `<link id="metaCanonical" rel="canonical" href="${currentUrl}" />`);

      // 5. Update Description Tags (Standard, OG, Twitter)
      html = setOrInjectTag(html, /<meta[^>]*id="metaDescription"[^>]*>/i, `<meta id="metaDescription" name="description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${summary}" />`);

      // 6. Update Remaining Open Graph Tags
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${currentUrl}" />`);

      // 7. Update Remaining Twitter Tags
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:url["'][^>]*>/i, `<meta name="twitter:url" content="${currentUrl}" />`);

      // 8. Inject Facebook App ID
      html = setOrInjectTag(html, /<meta[^>]*property=["']fb:app_id["'][^>]*>/i, `<meta property="fb:app_id" content="1767963851059615" />`);

      // 9. Inject Updated Schema (JSON-LD)
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
    }
  } catch (err) {
    console.error('Error fetching Firestore metadata:', err);
  }

  // 10. Return server-rendered HTML with edge caching headers
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
    },
  });
}
