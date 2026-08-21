const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load Service Account JSON Key
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const BASE_URL = 'https://boonnews.vercel.app';

async function generateSitemap() {
  try {
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
    ];

    // Fetch Articles from Firestore
    // (Change 'articles' if your Firestore collection is named differently)
    const snapshot = await db.collection('articles').get();
    const dynamicPages = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      
      dynamicPages.push({
        url: `/post.html?id=${slug}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: data.updatedAt ? new Date(data.updatedAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    });

    const allPages = [...staticPages, ...dynamicPages];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml.trim());
    console.log('✅ sitemap.xml created successfully inside public/!');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

generateSitemap();
