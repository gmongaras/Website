# Gabriel Mongaras — Portfolio

Time to totally not vibecode a website >w<

A single-page portfolio and technical blog built with React, Vite and Tailwind,
deployed to GitHub Pages at [gmongaras.me](https://gmongaras.me). Articles are
written in Markdown with LaTeX and can be exported as real, text-based PDFs
straight from the browser.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # outputs to dist/
npm run preview  # serve dist/ locally
```

`predev` and `prebuild` regenerate `src/blogImageDimensions.js`, so both
commands work from a clean checkout without any extra steps.

## Layout

```
src/
  App.jsx                 Hash routing and the home page composition
  data.js                 Profile, education, skills, experience, publications
  projects.js             Project cards
  youtubeData.js          Generated — see scripts/GetYoutueData.py
  blogImageDimensions.js  Generated — see scripts/generateImageDimensions.js
  blogs/                  One .md article plus a .js file of metadata each
  components/
    Header.jsx            Sticky nav, blog hover menu, mobile sheet
    SEO.jsx               Per-view meta tags, Open Graph and JSON-LD
    sections/             The home page sections, one file each
    blog/                 Article view, table of contents, markdown renderers
    ui/                   Cards, buttons, lazy images, horizontal card rows
  lib/                    Markdown, hash parsing and date helpers
  pdf/                    Vector PDF exporter for articles
  GraphBackground.jsx     Animated node graph behind the hero
scripts/                  Content generators (see below)
```

## Editing content

| What | Where |
| --- | --- |
| Name, links, summary, contact details | `src/data.js` |
| Education, skills, experience, publications, articles | `src/data.js` |
| Project cards | `src/projects.js` |
| Blog posts | `src/blogs/` |

### Adding a blog post

1. Write the article as `src/blogs/<name>.md`.
2. Add `src/blogs/<name>.js` exporting the metadata alongside the body:

   ```js
   import body from './<name>.md?raw'

   export const post = {
     slug: 'my-post',              // used in the URL: /#blog/my-post
     title: 'My Post',
     date: '2026-01-31',
     tags: ['Machine Learning'],
     excerpt: 'One line for the card and meta description.',
     body,
   }
   ```

   `subtitle`, `authors` and `affiliations` are optional and render in the
   article header when present.
3. Register it in `src/blogs/index.js`. The first entry is the newest, and the
   first three show up in the header's Blogs menu.
4. Put images under `public/blogs/images/<name>/` and reference them as
   `/blogs/images/<name>/1.webp`. Run `npm run generate-image-dimensions` so
   their size is known ahead of load and nothing shifts on the page.
5. Run `npm run generate-sitemap`.

### Article syntax

Standard Markdown, plus:

- **Maths** — `$inline$` and `$$display$$`, rendered by KaTeX.
- **Figures** — `![alt](/blogs/images/foo/1.webp "caption")`. The caption
  supports links, `*emphasis*`, `` `code` `` and maths.
- **YouTube** — a fenced block with the `youtube` language and a URL or bare
  video id as its only line.
- Legacy `{{code(lang)}}…{{code}}` and `{{youtube(url)}}` blocks from older
  articles are rewritten to fenced blocks before rendering.

Level-2 and level-3 headings automatically become the table of contents, and
each gets an anchor so `/#blog/<slug>/<heading-id>` links to a section.

## PDF export

Every article has a **PDF** button. Rather than screenshotting the page, the
exporter clones the article off-screen at the printable page width, lets the
browser lay it out, then replays that layout as PDF text, vector rectangles and
embedded images — so the result stays selectable, searchable and sharp at any
zoom. The KaTeX fonts the article actually uses are embedded on demand.
`src/pdf/pagination.js` decides the page breaks, keeping paragraphs, figures and
equations whole and never leaving a heading stranded at the foot of a page.

`Ctrl+P` uses the browser's own print pipeline against the same `.pdf-paper`
styles in `src/index.css`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run generate-image-dimensions` | Scans `public/blogs/images` and writes `src/blogImageDimensions.js` |
| `npm run generate-sitemap` | Writes `public/sitemap.xml` from the registered posts |
| `npm run generate-og-image` | Regenerates `public/og-image.png` (Python) |

`scripts/GetYoutubeURLs.py` and `scripts/GetYoutueData.py` refresh
`src/youtubeData.js`, which powers the Media section. `scripts/projects.ipynb`
was used to bootstrap `src/projects.js`.

## Theming

The palette lives in CSS variables in `src/index.css`:

```css
:root {
  --bg: #000000;
  --accent: #6A1B9A;
  --accent-rgb: 106, 27, 154;
}
```

`--accent-rgb` has to match `--accent`; the gradients, the hero graph and the
glow effects all build colours from it. `tailwind.config.js` carries a separate
`accent` colour used by the `bg-accent/*` and `border-accent/*` utilities.

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and publishes
`dist/` to GitHub Pages. In **Settings → Pages**, set the source to
**GitHub Actions**. The custom domain is committed in `CNAME`, which is why
`vite.config.js` keeps `base: '/'` — serving from
`<user>.github.io/<repo>/` instead requires changing that to `/<repo>/`.

See [SEO_SETUP.md](SEO_SETUP.md) for the search-console and structured-data
checklist.
