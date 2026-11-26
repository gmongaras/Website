#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { XMLParser, XMLValidator } from 'fast-xml-parser'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readingPath = path.join(root, 'src', 'reading.js')
const papersDirectory = path.join(root, 'public', 'reading', 'papers')
const usage = 'Usage: node scripts/add_paper.js https://arxiv.org/abs/<paper-id>'

const getPaperId = (value) => {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`Invalid URL.\n${usage}`)
  }

  if (!['arxiv.org', 'www.arxiv.org'].includes(url.hostname.toLowerCase())) {
    throw new Error(`Expected an arxiv.org abstract URL.\n${usage}`)
  }

  const prefix = '/abs/'
  if (!url.pathname.startsWith(prefix)) {
    throw new Error(`Expected an arXiv abstract URL ending in /abs/<paper-id>.\n${usage}`)
  }

  const paperId = decodeURIComponent(url.pathname.slice(prefix.length)).replace(/\/+$/, '')
  if (!paperId || paperId.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Could not read the arXiv paper ID.\n${usage}`)
  }

  return paperId
}

const getMetadata = async (paperId) => {
  const apiUrl = new URL('https://export.arxiv.org/api/query')
  apiUrl.searchParams.set('id_list', paperId)

  const response = await fetch(apiUrl)
  if (!response.ok) throw new Error(`arXiv metadata request failed (${response.status}).`)

  const xml = await response.text()
  const validation = XMLValidator.validate(xml)
  if (validation !== true) throw new Error(`arXiv returned invalid metadata: ${validation.err.msg}`)

  const feed = new XMLParser({ removeNSPrefix: true }).parse(xml)
  const entries = Array.isArray(feed.feed?.entry) ? feed.feed.entry : [feed.feed?.entry].filter(Boolean)
  const entry = entries[0]
  if (!entry) throw new Error(`No arXiv paper found for ID "${paperId}".`)

  const title = String(entry.title || '').replace(/\s+/g, ' ').trim()
  const authorEntries = Array.isArray(entry.author) ? entry.author : [entry.author].filter(Boolean)
  const authors = authorEntries.map((author) => String(author.name || '').trim()).filter(Boolean)
  if (!title || !authors.length) throw new Error('The arXiv metadata is missing its title or authors.')

  return { title, authors }
}

const titleToFilename = (title, paperId) => {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return `${slug || paperId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.pdf`
}

const canonicalAbsUrl = (url) => {
  const paperId = url.pathname.slice('/abs/'.length).replace(/v\d+$/, '')
  return `https://arxiv.org/abs/${paperId}`
}

const formatPaper = (paper) => JSON.stringify(paper, null, 4)
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')

const addPaper = async (absUrl) => {
  const paperId = getPaperId(absUrl)
  const canonicalUrl = `https://arxiv.org/abs/${paperId.replace(/v\d+$/, '')}`
  const metadata = await getMetadata(paperId.replace(/v\d+$/, ''))
  const source = await readFile(readingPath, 'utf8')
  const readingModule = await import(`${pathToFileURL(readingPath).href}?loaded=${Date.now()}`)

  if (readingModule.papers.some((paper) => paper.href && canonicalAbsUrl(new URL(paper.href)) === canonicalUrl)) {
    throw new Error(`This paper is already listed: ${canonicalUrl}`)
  }

  const filename = titleToFilename(metadata.title, paperId)
  const pdfPath = path.join(papersDirectory, filename)
  if (existsSync(pdfPath)) throw new Error(`PDF already exists: public/reading/papers/${filename}`)

  const pdfResponse = await fetch(`https://arxiv.org/pdf/${paperId}`)
  if (!pdfResponse.ok) throw new Error(`arXiv PDF download failed (${pdfResponse.status}).`)

  const pdf = Buffer.from(await pdfResponse.arrayBuffer())
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    throw new Error('The arXiv download did not return a valid PDF.')
  }

  const paper = {
    title: metadata.title,
    author: metadata.authors.join(', '),
    href: canonicalUrl,
    links: [{ label: 'PDF', href: `/reading/papers/${filename}` }],
  }
  const exportMarker = 'export const papers = ['
  const markerIndex = source.indexOf(exportMarker)
  if (markerIndex < 0 || source.indexOf(exportMarker, markerIndex + exportMarker.length) >= 0) {
    throw new Error('Could not safely locate the papers array in src/reading.js.')
  }

  const insertionPoint = markerIndex + exportMarker.length
  const updatedSource = `${source.slice(0, insertionPoint)}\n${formatPaper(paper)},${source.slice(insertionPoint)}`

  await mkdir(papersDirectory, { recursive: true })
  await writeFile(pdfPath, pdf, { flag: 'wx' })
  try {
    await writeFile(readingPath, updatedSource)
  } catch (error) {
    await unlink(pdfPath).catch(() => {})
    throw error
  }

  console.log(`Added: ${metadata.title}`)
  console.log(`PDF: public/reading/papers/${filename}`)
}

const [absUrl, extraArgument] = process.argv.slice(2)
if (absUrl === '--help' || absUrl === '-h') {
  console.log(usage)
} else if (!absUrl || extraArgument) {
  console.error(usage)
  process.exitCode = 1
} else {
  addPaper(absUrl).catch((error) => {
    console.error(`Could not add paper: ${error.message}`)
    process.exitCode = 1
  })
}