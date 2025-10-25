#!/usr/bin/env node

/**
 * Automated Sitemap Generator
 * Generates sitemap.xml based on blog posts and static pages
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import blog posts
import { posts } from '../src/blogs/index.js'

const SITE_URL = 'https://gmongaras.me'
const CURRENT_DATE = new Date().toISOString().split('T')[0]

function generateSitemap() {
  const urls = []
  
  // Add homepage
  urls.push({
    loc: `${SITE_URL}/`,
    lastmod: CURRENT_DATE,
    changefreq: 'weekly',
    priority: '1.0'
  })
  
  // Add blog posts
  posts.forEach(post => {
    urls.push({
      loc: `${SITE_URL}/#blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.8'
    })
  })
  
  // Generate XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  
  // Write to public directory
  const outputPath = path.join(__dirname, '../public/sitemap.xml')
  fs.writeFileSync(outputPath, sitemapXml)
  
  console.log(`✅ Sitemap generated successfully at ${outputPath}`)
  console.log(`📊 Generated ${urls.length} URLs`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap()
}

export { generateSitemap }
