import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'
import { posts } from '../src/blogs/index.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputRoot = path.join(root, 'dist', 'blog')
const siteUrl = 'https://gmongaras.me'

const launchBrowser = async () => {
  const attempts = [{ channel: 'chrome' }, { channel: 'msedge' }, {}]

  for (const options of attempts) {
    try {
      return await chromium.launch({ headless: true, ...options })
    } catch {
      // Try the next installed browser.
    }
  }

  throw new Error('Could not launch Chromium. Install Chrome or run: npx playwright install chromium')
}

const generatePages = async () => {
  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+|_[a-z0-9]+)*$/.test(post.slug)) {
      throw new Error(`Unsafe blog slug: ${post.slug}`)
    }
  }

  const server = await preview({
    root,
    preview: { host: '127.0.0.1', port: 0, strictPort: false },
  })
  let browser

  try {
    const address = server.httpServer.address()
    if (!address || typeof address === 'string') throw new Error('Could not determine Vite preview address.')
    const origin = `http://127.0.0.1:${address.port}`
    browser = await launchBrowser()
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

    for (const post of posts) {
      const articlePath = `/blog/${post.slug}/`
      await page.goto(`${origin}/#blog/${post.slug}`, { waitUntil: 'load', timeout: 120000 })
      await page.waitForFunction(
        (title) => document.querySelector('.pdf-article h1')?.textContent?.trim() === title,
        post.title,
        { timeout: 120000 },
      )
      await page.evaluate((route) => history.replaceState(null, '', route), articlePath)

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      if (canonical !== `${siteUrl}${articlePath}`) {
        throw new Error(`Unexpected canonical URL for ${post.slug}: ${canonical}`)
      }

      const html = await page.content()
      if (!html.includes(post.title) || !html.includes('class="blog-markdown')) {
        throw new Error(`Rendered article content is missing for ${post.slug}.`)
      }

      const outputPath = path.join(outputRoot, post.slug, 'index.html')
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, html)

      await page.goto(`${origin}${articlePath}`, { waitUntil: 'load', timeout: 120000 })
      await page.waitForFunction(
        (title) => document.querySelector('.pdf-article h1')?.textContent?.trim() === title,
        post.title,
        { timeout: 120000 },
      )
      const directCanonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      if (directCanonical !== `${siteUrl}${articlePath}`) {
        throw new Error(`Direct article route failed for ${post.slug}: ${directCanonical}`)
      }

      console.log(`Pre-rendered ${articlePath}`)
    }
  } finally {
    await browser?.close()
    await server.close()
  }
}

generatePages().catch((error) => {
  console.error(`Could not pre-render blog pages: ${error.message}`)
  process.exitCode = 1
})