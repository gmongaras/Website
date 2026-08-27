// Font handling for the vector PDF exporter.
//
// Body text is drawn with jsPDF's built-in Helvetica/Courier, and the article
// clone is laid out in the metric-compatible Arial/Courier New so the browser's
// line breaking matches the PDF's own metrics. Maths is different: KaTeX has its
// own glyph set, so the TTFs it ships are embedded on demand.

import KaTeX_AMS_Regular from 'katex/dist/fonts/KaTeX_AMS-Regular.ttf?url'
import KaTeX_Caligraphic_Bold from 'katex/dist/fonts/KaTeX_Caligraphic-Bold.ttf?url'
import KaTeX_Caligraphic_Regular from 'katex/dist/fonts/KaTeX_Caligraphic-Regular.ttf?url'
import KaTeX_Fraktur_Bold from 'katex/dist/fonts/KaTeX_Fraktur-Bold.ttf?url'
import KaTeX_Fraktur_Regular from 'katex/dist/fonts/KaTeX_Fraktur-Regular.ttf?url'
import KaTeX_Main_Bold from 'katex/dist/fonts/KaTeX_Main-Bold.ttf?url'
import KaTeX_Main_BoldItalic from 'katex/dist/fonts/KaTeX_Main-BoldItalic.ttf?url'
import KaTeX_Main_Italic from 'katex/dist/fonts/KaTeX_Main-Italic.ttf?url'
import KaTeX_Main_Regular from 'katex/dist/fonts/KaTeX_Main-Regular.ttf?url'
import KaTeX_Math_BoldItalic from 'katex/dist/fonts/KaTeX_Math-BoldItalic.ttf?url'
import KaTeX_Math_Italic from 'katex/dist/fonts/KaTeX_Math-Italic.ttf?url'
import KaTeX_SansSerif_Bold from 'katex/dist/fonts/KaTeX_SansSerif-Bold.ttf?url'
import KaTeX_SansSerif_Italic from 'katex/dist/fonts/KaTeX_SansSerif-Italic.ttf?url'
import KaTeX_SansSerif_Regular from 'katex/dist/fonts/KaTeX_SansSerif-Regular.ttf?url'
import KaTeX_Script_Regular from 'katex/dist/fonts/KaTeX_Script-Regular.ttf?url'
import KaTeX_Size1_Regular from 'katex/dist/fonts/KaTeX_Size1-Regular.ttf?url'
import KaTeX_Size2_Regular from 'katex/dist/fonts/KaTeX_Size2-Regular.ttf?url'
import KaTeX_Size3_Regular from 'katex/dist/fonts/KaTeX_Size3-Regular.ttf?url'
import KaTeX_Size4_Regular from 'katex/dist/fonts/KaTeX_Size4-Regular.ttf?url'
import KaTeX_Typewriter_Regular from 'katex/dist/fonts/KaTeX_Typewriter-Regular.ttf?url'

// family -> variant -> [file name, asset url]. Variants fall back to the
// closest available face, mirroring what the browser does when synthesising.
const KATEX_FACES = {
  KaTeX_AMS: { regular: KaTeX_AMS_Regular },
  KaTeX_Caligraphic: { regular: KaTeX_Caligraphic_Regular, bold: KaTeX_Caligraphic_Bold },
  KaTeX_Fraktur: { regular: KaTeX_Fraktur_Regular, bold: KaTeX_Fraktur_Bold },
  KaTeX_Main: {
    regular: KaTeX_Main_Regular,
    bold: KaTeX_Main_Bold,
    italic: KaTeX_Main_Italic,
    bolditalic: KaTeX_Main_BoldItalic,
  },
  KaTeX_Math: { italic: KaTeX_Math_Italic, bolditalic: KaTeX_Math_BoldItalic },
  KaTeX_SansSerif: {
    regular: KaTeX_SansSerif_Regular,
    bold: KaTeX_SansSerif_Bold,
    italic: KaTeX_SansSerif_Italic,
  },
  KaTeX_Script: { regular: KaTeX_Script_Regular },
  KaTeX_Size1: { regular: KaTeX_Size1_Regular },
  KaTeX_Size2: { regular: KaTeX_Size2_Regular },
  KaTeX_Size3: { regular: KaTeX_Size3_Regular },
  KaTeX_Size4: { regular: KaTeX_Size4_Regular },
  KaTeX_Typewriter: { regular: KaTeX_Typewriter_Regular },
}

const VARIANT_FALLBACKS = {
  regular: ['regular', 'bold', 'italic', 'bolditalic'],
  bold: ['bold', 'regular', 'bolditalic', 'italic'],
  italic: ['italic', 'bolditalic', 'regular', 'bold'],
  bolditalic: ['bolditalic', 'italic', 'bold', 'regular'],
}

export const variantOf = (weight, style) => {
  const bold = Number(weight) >= 600 || weight === 'bold' || weight === 'bolder'
  const italic = style === 'italic' || style === 'oblique'
  if (bold && italic) return 'bolditalic'
  if (bold) return 'bold'
  if (italic) return 'italic'
  return 'regular'
}

// jsPDF already folds these into WinAnsi for the built-in fonts, so they can be
// passed through untouched.
const WIN_ANSI_UNICODE = new Set([
  0x192, 0x2c6, 0x2dc, 0x152, 0x153, 0x160, 0x161, 0x178, 0x17d, 0x17e,
  0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e,
  0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039, 0x203a, 0x20ac, 0x2122,
])

// Anything else outside Latin-1 has no glyph in the built-in fonts, so it is
// replaced with the closest readable equivalent.
const SUBSTITUTIONS = {
  '\u00a0': ' ', '\u200b': '', '\u2212': '-', '\u2044': '/',
  '\u2248': '~', '\u2264': '<=', '\u2265': '>=', '\u2260': '!=',
  '\u2261': '=', '\u221e': 'inf', '\u221a': 'sqrt', '\u2211': 'sum', '\u220f': 'prod',
  '\u2192': '->', '\u2190': '<-', '\u2194': '<->', '\u21d2': '=>', '\u21d4': '<=>',
  '\u2208': 'in', '\u2209': 'not in', '\u2286': 'subset of', '\u2282': 'subset of',
  '\u00b7': '\u00b7', '\u2032': "'", '\u2033': '"', '\u2010': '-', '\u2011': '-',
  '\u03b1': 'alpha', '\u03b2': 'beta', '\u03b3': 'gamma', '\u03b4': 'delta',
  '\u03b5': 'epsilon', '\u03b8': 'theta', '\u03bb': 'lambda', '\u03bc': 'mu',
  '\u03c0': 'pi', '\u03c3': 'sigma', '\u03c4': 'tau', '\u03c6': 'phi', '\u03c9': 'omega',
  '\u0394': 'Delta', '\u0398': 'Theta', '\u039b': 'Lambda', '\u03a3': 'Sigma',
  '\u03a6': 'Phi', '\u03a9': 'Omega',
}

export const toWinAnsi = (text) => {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (code < 0x100 || WIN_ANSI_UNICODE.has(code)) {
      out += ch
    } else {
      out += SUBSTITUTIONS[ch] ?? '?'
    }
  }
  return out
}

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

// Registers every KaTeX face the article actually uses. Returns a lookup from
// "family|variant" to the jsPDF font name, so unused faces are never fetched.
export const embedKatexFonts = async (pdf, requestedFaces) => {
  const registered = new Map()

  const jobs = [...requestedFaces].map(async (key) => {
    const [family, variant] = key.split('|')
    const faces = KATEX_FACES[family]
    if (!faces) return

    const resolved = (VARIANT_FALLBACKS[variant] || ['regular']).find((v) => faces[v])
    if (!resolved) return

    const url = faces[resolved]
    const fileName = `${family}-${resolved}.ttf`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not load ${fileName}`)

    return { key, fileName, family, base64: toBase64(await response.arrayBuffer()) }
  })

  for (const result of await Promise.all(jobs)) {
    if (!result) continue
    pdf.addFileToVFS(result.fileName, result.base64)
    pdf.addFont(result.fileName, result.fileName, 'normal')
    registered.set(result.key, result.fileName)
  }

  return registered
}

export const isKatexFamily = (family) => Object.prototype.hasOwnProperty.call(KATEX_FACES, family)
