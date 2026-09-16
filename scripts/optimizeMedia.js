import { copyFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const sourceRoot = path.resolve('media-src')
const outputRoot = path.resolve('public/optimized')

const source = (...parts) => path.join(sourceRoot, ...parts)
const output = (...parts) => path.join(outputRoot, ...parts)

const isStale = async (sourcePath, outputPaths) => {
  const sourceStats = await stat(sourcePath)

  for (const outputPath of outputPaths) {
    try {
      const outputStats = await stat(outputPath)
      if (outputStats.mtimeMs < sourceStats.mtimeMs) return true
    } catch {
      return true
    }
  }

  return false
}

const ensureParent = (filePath) => mkdir(path.dirname(filePath), { recursive: true })

const copyOriginal = async (...parts) => {
  const input = source(...parts)
  const destination = output(...parts)
  if (!(await isStale(input, [destination]))) return

  await ensureParent(destination)
  await copyFile(input, destination)
  console.log(`Copied ${parts.join('/')} without quality loss`)
}

const generateIcons = async () => {
  const faviconSource = source('favicon.png')
  const favicon = output('favicon.png')
  const fullSizeIcon = output('icon-full.png')
  const icon192 = output('icon-192.png')
  const icon512 = output('icon-512.png')

  if (await isStale(faviconSource, [favicon, fullSizeIcon, icon192, icon512])) {
    await ensureParent(favicon)
    await Promise.all([
      sharp(faviconSource).resize(64, 64).png({ compressionLevel: 9 }).toFile(favicon),
      sharp(faviconSource).png({ compressionLevel: 9 }).toFile(fullSizeIcon),
      sharp(faviconSource).resize(192, 192).png({ compressionLevel: 9 }).toFile(icon192),
      sharp(faviconSource).resize(512, 512).png({ compressionLevel: 9 }).toFile(icon512),
    ])
    console.log('Generated favicon and app icons')
  }
}

await Promise.all([
  copyOriginal('me.jpg'),
  copyOriginal('projects', '2mamba2furious.png'),
  copyOriginal('blogs', 'images', 'diffusion_models', '13.gif'),
  copyOriginal('blogs', 'images', 'diffusion_models', '40.gif'),
  copyOriginal('blogs', 'images', 'ai_girlfriend', '4.gif'),
  copyOriginal('blogs', 'images', 'ai_girlfriend', '5.gif'),
  copyOriginal('blogs', 'images', 'ai_girlfriend', '6.gif'),
  generateIcons(),
])
