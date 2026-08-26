import fs from 'node:fs'
import path from 'node:path'

const imageRoot = path.resolve('public/blogs/images')
const outputPath = path.resolve('src/blogImageDimensions.js')
const dimensions = {}

function readDimensions(filePath) {
  const data = fs.readFileSync(filePath)

  if (data.readUInt32BE(0) === 0x89504e47) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
  }

  if (data.toString('ascii', 0, 6).match(/^GIF8/)) {
    return { width: data.readUInt16LE(6), height: data.readUInt16LE(8) }
  }

  if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    const format = data.toString('ascii', 12, 16)
    if (format === 'VP8X') {
      return {
        width: 1 + data.readUIntLE(24, 3),
        height: 1 + data.readUIntLE(27, 3),
      }
    }
    if (format === 'VP8 ' && data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a) {
      return {
        width: data.readUInt16LE(26) & 0x3fff,
        height: data.readUInt16LE(28) & 0x3fff,
      }
    }
    if (format === 'VP8L' && data[21] === 0x2f) {
      return {
        width: 1 + ((data[22] | (data[23] << 8)) & 0x3fff),
        height: 1 + (((data[23] >> 6) | (data[24] << 2) | (data[25] << 10)) & 0x3fff),
      }
    }
  }

  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = data[offset + 1]
      const length = data.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5) }
      }
      offset += 2 + length
    }
  }

  throw new Error(`Unsupported image format: ${filePath}`)
}

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      visit(entryPath)
      continue
    }

    if (!/\.(gif|png|jpe?g|webp)$/i.test(entry.name)) continue

    const relativePath = `/${path.relative(path.resolve('public'), entryPath).replaceAll('\\', '/')}`
    const { width, height } = readDimensions(entryPath)
    dimensions[relativePath] = { width, height }
  }
}

visit(imageRoot)

fs.writeFileSync(
  outputPath,
  `export const blogImageDimensions = ${JSON.stringify(dimensions, null, 2)}\n`,
)
