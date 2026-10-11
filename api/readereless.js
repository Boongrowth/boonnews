export const config = {
  runtime: 'edge', // Runs on Vercel's global Edge network
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('id');
  const baseUrl = 'https://boonnews.vercel.app';
  
  const firebaseProjectId = 'primeintelmedia-e2fe3';

  // 1. Fetch static reader.html template
  const htmlResponse = await fetch(`${baseUrl}/reader.html`);
  let html = await htmlResponse.text();

  // Return base template if no article ID is present in URL
  if (!articleId) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  try {
    // 2. Fetch the article document from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/newsPosts/${articleId}`;
    const res = await fetch(firestoreUrl);

    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};

      // Helper to safely sanitize strings for HTML tag attributes
      const escapeAttr = (str = '') =>
        str
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      // Map dynamic Title
      const rawTitle = fields.title?.stringValue || 'BoonNews | Read Article';
      const title = escapeAttr(rawTitle);
      const pageTitle = escapeAttr(`${rawTitle} | BoonNews`);
      
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
        rawSummary = 'Read full news articles, analysis, and breaking updates on BoonNews.';
      }
      const summary = escapeAttr(rawSummary);

      // Map Image, Author, and Canonical URL
      const image = escapeAttr(fields.imageUrl?.stringValue || fields.image?.stringValue || `${baseUrl}/boon-news-og-banner.jpg`);
      const author = escapeAttr(fields.author?.stringValue || 'BoonNews Editorial');
      const currentUrl = escapeAttr(`${baseUrl}/reader?id=${articleId}`);

      // Helper: Replaces tag if present in template; appends to <head> if missing
      const setOrInjectTag = (htmlText, pattern, newTag) => {
        if (pattern.test(htmlText)) {
          return htmlText.replace(pattern, newTag);
        }
        return htmlText.replace(/<\/head>/i, `${newTag}\n</head>`);
      };

      // 3. Update standard Page Titles & Canonical Tags
      html = html.replace(/<title[^>]*>.*?<\/title>/i, `<title>${pageTitle}</title>`);
      html = setOrInjectTag(html, /<meta[^>]*id="metaTitleTag"[^>]*>/i, `<meta id="metaTitleTag" name="title" content="${pageTitle}" />`);
      html = setOrInjectTag(html, /<link[^>]*id="metaCanonical"[^>]*>/i, `<link id="metaCanonical" rel="canonical" href="${currentUrl}" />`);

      // 4. Update Description Tags (Standard, OG, Twitter)
      html = setOrInjectTag(html, /<meta[^>]*id="metaDescription"[^>]*>/i, `<meta id="metaDescription" name="description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${summary}" />`);

      // 5. Update Remaining Open Graph Tags
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${currentUrl}" />`);

      // 6. Update Remaining Twitter Tags
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:url["'][^>]*>/i, `<meta name="twitter:url" content="${currentUrl}" />`);

      // 7. Inject Facebook App ID
      html = setOrInjectTag(html, /<meta[^>]*property=["']fb:app_id["'][^>]*>/i, `<meta property="fb:app_id" content="1767963851059615" />`);

      // 8. Inject Updated Schema (JSON-LD)
      const updatedSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": rawTitle,
        "image": [fields.imageUrl?.stringValue || fields.image?.stringValue || `${baseUrl}/boon-news-og-banner.jpg`],
        "description": rawSummary,
        "author": {
          "@type": "Person",
          "name": fields.author?.stringValue || 'BoonNews Editorial'
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

  // 9. Return server-rendered HTML with edge caching headers
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
    },
  });
}
