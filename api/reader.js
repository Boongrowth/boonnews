export const config = {
  runtime: 'edge', // Runs on Vercel's global Edge network
};

export default async function handler(request) {
  const { searchParams, origin, href } = new URL(request.url);
  const articleId = searchParams.get('id');
  
  // Use custom domain primary URL, or fallback to request origin dynamically
  const baseUrl = origin.includes('vercel.app') ? 'https://boonnewsng.blog' : origin;
  const firebaseProjectId = 'primeintelmedia-e2fe3';

  // 1. Fetch static reader.html template safely directly from asset origin
  let html = '';
  try {
    const templateUrl = new URL('/reader.html', request.url);
    const htmlResponse = await fetch(templateUrl.toString(), {
      headers: { 'x-v0-raw': 'true' } // Prevents rewrite loops on Vercel Edge
    });
    
    if (!htmlResponse.ok) {
      throw new Error(`Failed to load template: ${htmlResponse.status}`);
    }
    html = await htmlResponse.text();
  } catch (templateErr) {
    console.error('Error fetching reader.html template:', templateErr);
    return new Response('Error loading article template', { status: 500 });
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

      const escapeAttr = (str = '') =>
        str
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      const rawTitle = fields.title?.stringValue || 'BoonNews | Read Article';
      const title = escapeAttr(rawTitle);
      const pageTitle = escapeAttr(`${rawTitle} | BoonNews`);
      
      let rawSummary = fields.summary?.stringValue || 
                       fields.excerpt?.stringValue || 
                       fields.description?.stringValue || '';

      if (!rawSummary && fields.content?.stringValue) {
        rawSummary = fields.content.stringValue
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 155);
      }

      if (!rawSummary) {
        rawSummary = 'Read full news articles, analysis, and breaking updates on BoonNews.';
      }
      const summary = escapeAttr(rawSummary);

      const image = escapeAttr(fields.imageUrl?.stringValue || fields.image?.stringValue || `${baseUrl}/boon-news-og-banner.jpg`);
      const author = escapeAttr(fields.author?.stringValue || 'BoonNews Editorial');
      
      // Clean permanent URL matching client JS
      const currentUrl = escapeAttr(`${baseUrl}/reader?id=${articleId}`);

      const setOrInjectTag = (htmlText, pattern, newTag) => {
        if (pattern.test(htmlText)) {
          return htmlText.replace(pattern, newTag);
        }
        return htmlText.replace(/<\/head>/i, `${newTag}\n</head>`);
      };

      // 3. Update Titles & Canonical Links
      html = html.replace(/<title[^>]*>.*?<\/title>/i, `<title>${pageTitle}</title>`);
      html = setOrInjectTag(html, /<link[^>]*rel=["']canonical["'][^>]*>/i, `<link id="metaCanonical" rel="canonical" href="${currentUrl}" />`);

      // 4. Update Descriptions
      html = setOrInjectTag(html, /<meta[^>]*name=["']description["'][^>]*>/i, `<meta id="metaDescription" name="description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${summary}" />`);
      html = setOrInjectTag(html, /<meta[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${summary}" />`);

      // 5. Update Titles & URLs
      html = setOrInjectTag(html, /<meta[^>]*property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${currentUrl}" />`);

      // 6. Update Twitter Meta
      html = setOrInjectTag(html, /<meta[^>]*name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
      html = setOrInjectTag(html, /<meta[^>]*name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${image}" />`);
      html = setOrInjectTag(html, /<meta[^>]*name=["']twitter:url["'][^>]*>/i, `<meta name="twitter:url" content="${currentUrl}" />`);

      // 7. Inject Facebook App ID
      html = setOrInjectTag(html, /<meta[^>]*property=["']fb:app_id["'][^>]*>/i, `<meta property="fb:app_id" content="1767963851059615" />`);

      // 8. Inject Schema (JSON-LD)
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

      const schemaRegex = /<script[^>]*id=["']articleSchema["'][^>]*>[\s\S]*?<\/script>/i;
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
      'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600'
    },
  });
}
