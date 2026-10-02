export const config = {
  runtime: 'edge', // Runs on Vercel's global Edge network
};

export default async function handler(request) {
  const { searchParams, origin } = new URL(request.url);
  const articleId = searchParams.get('id');

  // Determine external canonical base URL
  const baseUrl = origin.includes('vercel.app') ? 'https://boonnewsng.blog' : origin;
  const firebaseProjectId = 'primeintelmedia-e2fe3';

  // 1. Fetch reader.html template without triggering route loops
  let html = '';
  try {
    const templateUrl = new URL('/reader.html', request.url);
    const htmlResponse = await fetch(templateUrl);
    
    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch template: ${htmlResponse.status}`);
    }
    html = await htmlResponse.text();
  } catch (err) {
    console.error('Error fetching reader.html template:', err);
    return new Response('Error loading template', { status: 500 });
  }

  // Return base template if no article ID is present
  if (!articleId) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  try {
    // 2. Fetch article document from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/newsPosts/${articleId}`;
    const res = await fetch(firestoreUrl);

    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};

      const cleanAttr = (str = '') =>
        str
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .trim();

      const rawTitle = fields.title?.stringValue || 'Boon News | Read Article';
      const title = cleanAttr(rawTitle);
      const pageTitle = cleanAttr(`${rawTitle} | Boon News`);

      // Updated Summary Extraction Strategy (Checks `summary` -> generates from `content`)
      let rawSummary = fields.summary?.stringValue || '';

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
      const summary = cleanAttr(rawSummary);

      // Absolute image URL formatting
      let rawImageUrl = fields.imageUrl?.stringValue || fields.image?.stringValue;
      if (rawImageUrl && !rawImageUrl.startsWith('http')) {
        rawImageUrl = `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`;
      }
      const image = cleanAttr(
        rawImageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'
      );
      const author = cleanAttr(fields.author?.stringValue || 'Boon News Desk');
      const currentUrl = cleanAttr(`${baseUrl}/reader?id=${articleId}`);

      // Helper: Dot-all regex match (/is) to support multiline tags in reader.html
      const setOrInjectTag = (htmlText, pattern, newTag) => {
        if (pattern.test(htmlText)) {
          return htmlText.replace(pattern, newTag);
        }
        return htmlText.replace(/<\/head>/i, `${newTag}\n</head>`);
      };

      // 3. Update Titles & Canonical Tags
      html = html.replace(/<title[^>]*>.*?<\/title>/is, `<title>${pageTitle}</title>`);
      html = setOrInjectTag(
        html,
        /<link[^>]*(?:id=["']metaCanonical["']|rel=["']canonical["'])[^>]*>/is,
        `<link id="metaCanonical" rel="canonical" href="${currentUrl}" />`
      );

      // 4. Update Descriptions (Standard, OG, Twitter)
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']metaDesc["']|name=["']description["'])[^>]*>/is,
        `<meta id="metaDesc" name="description" content="${summary}" />`
      );
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']ogDesc["']|property=["']og:description["'])[^>]*>/is,
        `<meta id="ogDesc" property="og:description" content="${summary}" />`
      );
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']twDesc["']|name=["']twitter:description["'])[^>]*>/is,
        `<meta id="twDesc" name="twitter:description" content="${summary}" />`
      );

      // 5. Update Open Graph Meta
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']ogTitle["']|property=["']og:title["'])[^>]*>/is,
        `<meta id="ogTitle" property="og:title" content="${title}" />`
      );
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']ogImage["']|property=["']og:image["'])[^>]*>/is,
        `<meta id="ogImage" property="og:image" content="${image}" />`
      );
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']ogUrl["']|property=["']og:url["'])[^>]*>/is,
        `<meta id="ogUrl" property="og:url" content="${currentUrl}" />`
      );

      // 6. Update Twitter Meta
      html = setOrInjectTag(
        html,
        /<meta[^>]*name=["']twitter:card["'][^>]*>/is,
        `<meta name="twitter:card" content="summary_large_image" />`
      );
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']twTitle["']|name=["']twitter:title["'])[^>]*>/is,
        `<meta id="twTitle" name="twitter:title" content="${title}" />`
      );
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']twImage["']|name=["']twitter:image["'])[^>]*>/is,
        `<meta id="twImage" name="twitter:image" content="${image}" />`
      );
      html = setOrInjectTag(
        html,
        /<meta[^>]*(?:id=["']twUrl["']|name=["']twitter:url["'])[^>]*>/is,
        `<meta id="twUrl" name="twitter:url" content="${currentUrl}" />`
      );

      // 7. Inject Facebook App ID
      html = setOrInjectTag(
        html,
        /<meta[^>]*property=["']fb:app_id["'][^>]*>/is,
        `<meta property="fb:app_id" content="1767963851059615" />`
      );

      // 8. Inject Structured Data (Schema JSON-LD)
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
          name: 'Boon News',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/assets/images/logo.png`,
          },
        },
      });

      const schemaRegex = /<script[^>]*id=["']articleSchema["'][^>]*>.*?<\/script>/is;
      if (schemaRegex.test(html)) {
        html = html.replace(
          schemaRegex,
          `<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>`
        );
      } else {
        html = html.replace(
          /<\/head>/i,
          `<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>\n</head>`
        );
      }
    }
  } catch (err) {
    console.error('Error fetching Firestore metadata:', err);
  }

  // 9. Return server-rendered HTML with edge caching headers
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}
