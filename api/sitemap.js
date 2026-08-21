import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'sitemap.xml');
    
    // Fallback if sitemap is inside public/
    const altPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    let xmlContent = '';
    if (fs.existsSync(filePath)) {
      xmlContent = fs.readFileSync(filePath, 'utf8');
    } else if (fs.existsSync(altPath)) {
      xmlContent = fs.readFileSync(altPath, 'utf8');
    } else {
      return res.status(404).send('Sitemap file not found on server.');
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, must-revalidate');
    return res.status(200).send(xmlContent);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
