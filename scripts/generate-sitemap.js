cat << 'EOF' > ~/boonnews/scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load Service Account JSON Key
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!getApps().length && fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const BASE_URL = 'https://boonnews.vercel.app';

async function generateSitemap() {
  try {
    console.log('Fetching news posts from Firestore...');

    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/about.html', priority: '0.8', changefreq: 'monthly' },
      { url: '/contact.html', priority: '0.8', changefreq: 'monthly' },
      { url: '/advert.html', priority: '0.8', changefreq: 'monthly' }
    ];

    let urls = staticPages.map(
      (page) => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    );

    // Pull published posts from Firestore "newsPosts" collection
    const snapshot = await db.collection('newsPosts').get();
    snapshot.forEach((doc) => {
      urls.push(`  <url>
    <loc>${BASE_URL}/reader?id=${doc.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write file to BOTH root directory and public directory
    fs.writeFileSync(path.join(__dirname, '../sitemap.xml'), xmlContent, 'utf8');
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xmlContent, 'utf8');

    console.log(`✅ sitemap.xml created successfully with ${urls.length} URLs!`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

generateSitemap();
EOF

