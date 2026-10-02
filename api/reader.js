export const config = {
  runtime: 'edge', // Runs on Vercel's global Edge network
};

export default async function handler(request) {
  const { searchParams, origin } = new URL(request.url);
  const articleId = searchParams.get('id');

  // Determine external canonical base URL
  const baseUrl = origin.includes('vercel.app') ? 'https://boonnewsng.blog' : origin;
  const firebaseProjectId = 'primeintelmedia-e2fe3';

  // 1. Always fetch reader.html using `origin` directly to avoid external routing loops
  let html = '';
  try {
    const htmlResponse = await fetch(`${origin}/reader.html`);
    if (!htmlResponse.ok) throw new Error(`Failed to fetch template: ${htmlResponse.status}`);
    html = await htmlResponse.text();
  } catch (err) {
    console.error('Error fetching reader.html template:', err);
    return new Response('Error loading template', { status: 500 });
  }

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

      // Helper to safely sanitize attribute values without double-encoding entities
      const cleanAttr = (str = '') => str.replace(/"/g, '&quot;').trim();

      const rawTitle = fields.title?.stringValue || 'BoonNews | Read Article';
      const title = cleanAttr(rawTitle);
      const pageTitle = cleanAttr(`${rawTitle} | BoonNews`);

      let rawSummary =
        fields.summary?.stringValue ||
        fields.excerpt?.stringValue ||
        fields.description?.stringValue ||
        '';

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
      const summary = cleanAttr(rawSummary);

      // Ensure image URL is absolute
      let rawImageUrl = fields.imageUrl?.stringValue || fields.image?.stringValue;
      if (rawImageUrl && !rawImageUrl.startsWith('http')) {
        rawImageUrl = `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`;
      }
      const image = cleanAttr(rawImageUrl || `${baseUrl}/boon-news-og-banner.jpg`);
      const author = cleanAttr(fields.author?.stringValue || 'BoonNews Editorial');
      const currentUrl = cleanAttr(`${baseUrl}/reader?id=${articleId}`);

      // Helper: Flexible regex match to support both name/property and custom IDs
      const setOrInjectTag = (htmlText, pattern, newTag) => {
        if (pattern.test(htmlText)) {
          return htmlText.replace(pattern, newTag);
        }
        return htmlText.replace(/<\/head>/i, `${newTag}\n</head>`);
      };

      // 3. Update Page Titles & Canonical Tags
      html = html.replace(/<title[^>]*>.*?<\/title>/i, `<title>${pageTitle}</title>`);
      html = setOrInjectTag(html, /<meta[^>]*id="metaTitleTag"[^>]*>/i, `<meta id="metaTitleTag" name="title" content="${pageTitle}" />`);
      html = setOrInjectTag(html, /<link[^>]*(?:id="metaCanonical"|rel=["']canonical["'])[^>]*>/i, `<link id="metaCanonical" rel="canonical" href="${currentUrl}" />`);

      // 4. Update Description Tags (Standard, OG, Twitter)
      html = setOrInjectTag(html, /<meta[^>]*(?:id="metaDescription"|name=["']description["'])[^>]*>/i, `<meta id="metaDescription" name="description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${summary}" />`);

      // 5. Update Open Graph Tags
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:type["'][^>]*>/i, `<meta property="og:type" content="article" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:property|name)=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${currentUrl}" />`);

      // 6. Update Twitter Card & Tags
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:card["'][^>]*>/i, `<meta name="twitter:card" content="summary_large_image" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*(?:name|property)=["']twitter:url["'][^>]*>/i, `<meta name="twitter:url" content="${currentUrl}" />`);

      // 7. Inject Facebook App ID
      html = setOrInjectTag(html, /<meta[^>]*property=["']fb:app_id["'][^>]*>/i, `<meta property="fb:app_id" content="1767963851059615" />`);

      // 8. Inject Schema (JSON-LD) with Dot-All Regex Flag (/s)
      const updatedSchema = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: rawTitle,
        image: [image],
        description: rawSummary,
        author: {
          '@type': 'Person',
          name: author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'BoonNews',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/boon-news-og-banner.jpg`,
          },
        },
      });

      const schemaRegex = /<script[^>]*id=["']articleSchema["'][^>]*>.*?<\/script>/s;
      if (schemaRegex.test(html)) {
        html = html.replace(schemaRegex, `<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>`);
      } else {
        html = html.replace(/<\/head>/i, `<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>\n</head>`);
      }
    }
  } catch (err) {
    console.error('Error fetching Firestore metadata:', err);
  }

  // 9. Return server-rendered HTML
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}
