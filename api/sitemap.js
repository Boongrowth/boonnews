import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBfoxEnVep0wX5V_KVS-cd8o5sUMvrFY4c",
    authDomain: "primeintelmedia-e2fe3.firebaseapp.com",
    databaseURL: "https://primeintelmedia-e2fe3-default-rtdb.firebaseio.com",
    projectId: "primeintelmedia-e2fe3",
    storageBucket: "primeintelmedia-e2fe3.firebasestorage.app",
    messagingSenderId: "228866357632",
    appId: "1:228866357632:web:72dc9942f1cd41d857a965",
    measurementId: "G-G0HRRV932S"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const BASE_URL = 'https://boonnewsng.blog';

// Helper to escape special XML characters safely
function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

// Safe Firestore date extractor
function parseDate(createdAt, fallback) {
    try {
        if (!createdAt) return fallback;
        if (typeof createdAt.toMillis === 'function') {
            return new Date(createdAt.toMillis()).toISOString().split('T')[0];
        }
        if (typeof createdAt.toDate === 'function') {
            return createdAt.toDate().toISOString().split('T')[0];
        }
        if (createdAt instanceof Date) {
            return createdAt.toISOString().split('T')[0];
        }
        if (typeof createdAt === 'number' || typeof createdAt === 'string') {
            return new Date(createdAt).toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn("Date parsing fallback used:", e);
    }
    return fallback;
}

export default async function handler(req, res) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Static core and compliance pages
        const staticPages = [
            { url: '/', priority: '1.0', changefreq: 'always', lastmod: today },
            { url: '/index.html', priority: '0.9', changefreq: 'daily', lastmod: today },
            { url: '/about.html', priority: '0.5', changefreq: 'monthly', lastmod: today },
            { url: '/contact.html', priority: '0.5', changefreq: 'monthly', lastmod: today },
            { url: '/advert.html', priority: '0.5', changefreq: 'monthly', lastmod: today },
            { url: '/privacy.html', priority: '0.3', changefreq: 'monthly', lastmod: today },
            { url: '/terms.html', priority: '0.3', changefreq: 'monthly', lastmod: today }
        ];

        // Fetch published news posts from Firestore
        const postsRef = collection(db, "newsPosts");
        const q = query(postsRef, orderBy("createdAt", "desc"), limit(5000));
        const querySnapshot = await getDocs(q);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
        xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

        xml += `  <!-- Main Homepage & Compliance Pages -->\n`;
        staticPages.forEach((page) => {
            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(BASE_URL + page.url)}</loc>\n`;
            xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += `  </url>\n`;
        });

        xml += `\n  <!-- Dynamic Article Entries -->\n`;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const lastMod = parseDate(data.createdAt, today);
            const articleUrl = `${BASE_URL}/reader.html?id=${docSnap.id}`;

            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(articleUrl)}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        });

        xml += `</urlset>`;

        // Set XML Header and Cache Control
        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
        return res.status(200).send(xml);

    } catch (error) {
        console.error("Sitemap generation error:", error);
        return res.status(500).json({ error: "Failed to generate sitemap", details: error.message });
    }
}
