import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { posts } from '../src/blogs/index.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pdfDir = path.join(root, 'public', 'blogs', 'pdfs')
const manifestPath = path.join(pdfDir, '.manifest.json')

const hashFile = (filePath) => {
  const hash = createHash('sha256')
  hash.update(path.relative(root, filePath).replaceAll('\\', '/'))
  hash.update(readFileSync(filePath))
  return hash.digest('hex')
}

const hashValues = (values) => {
  const hash = createHash('sha256')
  for (const value of values) hash.update(String(value))
  return hash.digest('hex')
}

const walkFiles = (target) => {
  if (!existsSync(target)) return []
  if (statSync(target).isFile()) return [target]

  const files = []
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const entryPath = path.join(target, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(entryPath))
    else files.push(entryPath)
  }
  return files
}

const pipelineHash = () => {
  const targets = [
    'src/pdf',
    'src/components/blog',
    'src/components/ui/LazyImage.jsx',
    'src/components/PrintModeContext.js',
    'src/lib/markdown.js',
    'src/lib/dom.js',
    'src/index.css',
    'src/blogImageDimensions.js',
    'src/App.jsx',
    'scripts/generateArticlePdfs.js',
  ]

  const files = targets
    .flatMap((relative) => walkFiles(path.join(root, relative)))
    .filter((file) => /\.(js|jsx|css)$/.test(file))
    .sort()

  return hashValues(files.map(hashFile))
}

const referencedPublicFiles = (markdown) => {
  const files = []
  const pattern = /\((\/[^)\s]+)(?:\s+"[^"]*")?\)/g

  for (const match of markdown.matchAll(pattern)) {
    const urlPath = match[1]
    if (!urlPath.startsWith('/') || urlPath.startsWith('//')) continue
    const diskPath = path.join(root, 'public', urlPath.replace(/^\//, ''))
    if (existsSync(diskPath) && statSync(diskPath).isFile()) files.push(diskPath)
  }

  return files
}

const discoverPosts = () => {
  const blogsDir = path.join(root, 'src', 'blogs')
  const indexSource = readFileSync(path.join(blogsDir, 'index.js'), 'utf8')
  const listed = new Map(posts.map((post) => [post.slug, post]))
  const discovered = []

  for (const match of indexSource.matchAll(/(?:['"]([^'"]+)['"]|([A-Za-z0-9_-]+)):\s*\(\)\s*=>\s*import\('\.\/([^']+)'\)/g)) {
    const slug = match[1] || match[2]
    const listedPost = listed.get(slug)
    if (!listedPost) continue

    const jsPath = path.join(blogsDir, match[3].endsWith('.js') ? match[3] : `${match[3]}.js`)
    const mdPath = jsPath.replace(/\.js$/, '.md')
    discovered.push({
      slug,
      title: listedPost.title,
      jsPath,
      mdPath: existsSync(mdPath) ? mdPath : null,
    })
  }

  return discovered
}

const postHash = (post) => {
  const files = [post.jsPath]
  if (post.mdPath) {
    files.push(post.mdPath)
    files.push(...referencedPublicFiles(readFileSync(post.mdPath, 'utf8')))
  }

  return hashValues(files.filter((file) => existsSync(file)).sort().map(hashFile))
}

const readManifest = () => {
  if (!existsSync(manifestPath)) return { pipeline: '', posts: {} }
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    return { pipeline: '', posts: {} }
  }
}

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

const compilePost = async (page, origin, post) => {
  await page.goto(`${origin}/?compilePdf=1&post=${encodeURIComponent(post.slug)}#blog/${post.slug}`, {
    waitUntil: 'load',
    timeout: 180000,
  })

  await page.waitForFunction(
    (slug) => {
      const result = window.__compiledPdf
      if (!result || result.slug !== slug) return false
      return result.status === 'ready' || result.status === 'error'
    },
    post.slug,
    { timeout: 180000 },
  )

  const result = await page.evaluate(() => window.__compiledPdf)
  if (result.status !== 'ready' || !result.dataUrl) {
    throw new Error(result.message || `PDF compilation failed for ${post.slug}`)
  }

  const comma = result.dataUrl.indexOf(',')
  return Buffer.from(result.dataUrl.slice(comma + 1), 'base64')
}

mkdirSync(pdfDir, { recursive: true })

const currentPipeline = pipelineHash()
const manifest = readManifest()
const discovered = discoverPosts()
const stale = currentPipeline !== manifest.pipeline
const pending = discovered.filter((post) => {
  const pdfPath = path.join(pdfDir, `${post.slug}.pdf`)
  const previous = manifest.posts?.[post.slug]
  return stale || !previous || previous.hash !== postHash(post) || !existsSync(pdfPath)
})

const keep = new Set(discovered.map((post) => `${post.slug}.pdf`))
for (const name of readdirSync(pdfDir)) {
  if (name.startsWith('.') || keep.has(name)) continue
  unlinkSync(path.join(pdfDir, name))
  console.log(`Removed stale ${name}`)
}

if (!pending.length) {
  console.log('Article PDFs are up to date')
  process.exit(0)
}

console.log(`Compiling ${pending.length} article PDF${pending.length === 1 ? '' : 's'}`)

const server = await createServer({
  root,
  server: { host: '127.0.0.1', port: 0, strictPort: false },
})
await server.listen()

const address = server.httpServer.address()
const origin = `http://127.0.0.1:${address.port}`
const browser = await launchBrowser()
const nextPosts = { ...(!stale && manifest.posts ? manifest.posts : {}) }

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

  for (const post of pending) {
    console.log(`  ${post.slug}`)
    const pdf = await compilePost(page, origin, post)
    writeFileSync(path.join(pdfDir, `${post.slug}.pdf`), pdf)
    nextPosts[post.slug] = { hash: postHash(post) }
  }

  writeFileSync(manifestPath, `${JSON.stringify({ pipeline: currentPipeline, posts: nextPosts }, null, 2)}\n`)
} finally {
  await browser.close()
  await server.close()
}
