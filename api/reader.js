export const config = {
  runtime: 'edge', // Runs on Vercel's global Edge network
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('id');
  const baseUrl = 'https://boonnews.vercel.app';
  
  // REPLACE THIS with your actual Firebase Project ID from your Firebase Console
  const firebaseProjectId = 'primeintelmedia-e2fe3';

  // 1. Fetch your static reader.html template
  const htmlResponse = await fetch(`${baseUrl}/reader.html`);
  let html = await htmlResponse.text();

  // If no article ID is in the URL, return standard page
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

      // Map Firestore fields (matching your loadArticleDetails fallback logic)
      const title = fields.title?.stringValue || 'BoonNews | Read Article';
      const summary = fields.summary?.stringValue || 
                      fields.content?.stringValue?.replace(/<[^>]*>?/gm, '').substring(0, 155) || 
                      'Read full news articles, analysis, and breaking updates on BoonNews.';
      const image = fields.imageUrl?.stringValue || `${baseUrl}/boon-news-og-banner.jpg`;
      const author = fields.author?.stringValue || 'BoonNews Editorial';
      const currentUrl = `${baseUrl}/reader?id=${articleId}`;

      // 3. Inject real-time article data into <meta> tags on the server
      html = html
        .replace(/<title id="metaTitle">.*?<\/title>/, `<title>${title} | BoonNews</title>`)
        .replace(/id="metaTitleTag" content=".*?"/, `id="metaTitleTag" content="${title} | BoonNews"`)
        .replace(/id="metaDescription" content=".*?"/, `id="metaDescription" content="${summary}"`)
        .replace(/id="metaCanonical" href=".*?"/, `id="metaCanonical" href="${currentUrl}"`)
        .replace(/id="ogTitle" content=".*?"/, `id="ogTitle" content="${title}"`)
        .replace(/id="ogDescription" content=".*?"/, `id="ogDescription" content="${summary}"`)
        .replace(/id="ogImage" content=".*?"/, `id="ogImage" content="${image}"`)
        .replace(/id="ogUrl" content=".*?"/, `id="ogUrl" content="${currentUrl}"`)
        .replace(/id="twitterTitle" content=".*?"/, `id="twitterTitle" content="${title}"`)
        .replace(/id="twitterDescription" content=".*?"/, `id="twitterDescription" content="${summary}"`)
        .replace(/id="twitterImage" content=".*?"/, `id="twitterImage" content="${image}"`)
        .replace(/id="twitterUrl" content=".*?"/, `id="twitterUrl" content="${currentUrl}"`)
        .replace(/<\/head>/, `<meta property="fb:app_id" content="1767963851059615" /></head>`);

      // 4. Update JSON-LD Schema
      const updatedSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "image": [image],
        "description": summary,
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

      html = html.replace(
        /<script type="application\/ld\+json" id="articleSchema">.*?<\/script>/s,
        `<script type="application/ld+json" id="articleSchema">${updatedSchema}</script>`
      );
    }
  } catch (err) {
    console.error('Error fetching Firestore metadata:', err);
  }

  // 5. Return server-rendered HTML with cache headers to save Vercel Edge requests
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
    },
  });
}
