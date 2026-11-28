# Gabriel Mongaras — Portfolio

Time to totally not vibecode a website >w<

A portfolio and technical blog built with React, Vite and Tailwind, deployed
to GitHub Pages at [gmongaras.me](https://gmongaras.me). One build serves home,
blogs, research, and projects through the URL hash. Articles are written in
Markdown with LaTeX and can be exported as real, text-based PDFs straight from
the browser.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # outputs to dist/
npm run preview  # serve dist/ locally
```

`predev` and `prebuild` copy media, write `src/blogImageDimensions.js`, and
generate article PDFs, so both commands work from a clean checkout without any
extra steps. `prebuild` also rewrites `public/sitemap.xml` from the registered
posts. The GitHub Pages workflow runs that build on every push to `main`, so
the published sitemap stays in sync even if the committed file is stale.

## Layout

```
src/
  App.jsx                 Hash routes for home, blogs, research, projects, articles
  data.js                 Profile, education, skills, experience, publications
  projects.js             Project list
  youtubeData.js          Generated — see scripts/GetYoutueData.py
  blogImageDimensions.js  Generated — see scripts/generateImageDimensions.js
  blogs/                  One .md article plus a .js file of metadata each
  components/
    Header.jsx            Sticky nav, blog hover menu, mobile sheet
    SEO.jsx               Per-view meta tags, Open Graph and JSON-LD
    sections/             One file per page section. See Pages below.
    blog/                 Article view, table of contents, markdown renderers
    ui/                   Cards, buttons, lazy images, and the media scroller
  lib/                    Markdown, hash parsing and date helpers
  katexMacros.js          Math commands shared by every article, such as \bigo
  pdf/                    Vector PDF exporter for articles
  GraphBackground.jsx     Animated node graph behind the hero
scripts/                  Content generators (see below)
```

## Pages

| Hash | What it shows |
| --- | --- |
| *(none)* | Home. The graph fills the screen, and contact info sits below it. |
| `#blogs` | Blog index |
| `#research` | Papers. `#publications` opens the same page. |
| `#projects` | Projects |
| `#reading` | Books and papers currently being read |
| `/blog/<slug>/` | An article. Append `#<heading-id>` to open a section. Legacy `#blog/<slug>` links still work. |

Production builds pre-render each article to `dist/blog/<slug>/index.html`, so
the canonical article URL serves its content and metadata in the initial HTML.

Resume links to `/Resume.pdf` and opens in a new tab. It is not a route.

Skills, education, experience, and the YouTube media section are still in the
source, with their data, and are not mounted on a page.

## Editing content

| What | Where |
| --- | --- |
| Name, links, summary, contact details | `src/data.js` (`profile`) |
| Publications | `src/data.js` (`publications`) |
| Education, skills, experience | `src/data.js` (kept; not on a page right now) |
| YouTube videos | `src/youtubeData.js` (kept; Media is not mounted) |
| Projects | `src/projects.js` |
| Reading list | `src/reading.js` |
| Blog posts | `src/blogs/` |

### Adding an arXiv paper

Pass the paper's arXiv abstract URL to the helper. It downloads the PDF into
`public/reading/papers/` using a lowercase, underscore-separated filename and
adds the title, authors, abstract link, and local PDF link to the top of
`papers` in `src/reading.js`.

```powershell
python scripts/add_paper.py https://arxiv.org/abs/2506.02070
# Direct Node/npm alternatives:
node scripts/add_paper.js https://arxiv.org/abs/2506.02070
npm run add-paper -- https://arxiv.org/abs/2506.02070
```

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

The next production build regenerates the sitemap from `src/blogs/index.js`.

### Article syntax

Standard Markdown, plus:

- **Maths** — `$inline$` and `$$display$$`, rendered by KaTeX. Shared commands
  live in `src/katexMacros.js`. `\bigo` is `\mathcal{O}`. A new command there
  also has to be copied into `markdown.math.macros` in `.vscode/settings.json`,
  which is what the editor preview reads.
- **Citations** — `\cite{vaswani2017}` renders as a clickable `[1]`.
  `\cite{vaswani2017, bahdanau2014}` renders as `[1], [2]`. Numbers follow the
  order of first use. The entries sit in a `bib` fence; the site prints them
  at the bottom as References. A line starting with `%` is a comment, and an
  indented line continues the entry above it.

  ````markdown
  ```bib
  @vaswani2017 Vaswani et al. Attention Is All You Need. 2017. https://arxiv.org/abs/1706.03762
  ```
  ````

- **Equations** — a `$$` block is numbered only when it contains `\label`.
  `\eqref{eq:cost}` (and `\ref{eq:cost}`) renders as `[1]` and scrolls to it.

  ```markdown
  $$
  \label{eq:cost}
  T(n) = \bigo(n)
  $$
  ```

- **Sections** — `\ref{plain-heading}` links to that heading and uses the
  heading text as the link. The id is the usual slug. Append `{#claim}` to pin
  a shorter one: `## A numbered claim {#claim}`, then `\ref{claim}`.
- **Side notes** — collapsed until opened:

  ```markdown
  :::note Where this comes from $\alpha + \beta$
  Optional paragraphs, math, and citations.
  :::
  ```

- **Figures** — captions use the standard image title. Add `{#fig:name}` after
  the image to number and label it; `\ref{fig:name}` links to the figure.

  ```markdown
  ![Diagram](/blogs/images/foo/1.svg "A labeled figure"){#fig:diagram}
  ```

  Captions support links, `*emphasis*`, `` `code` `` and maths. SVG images get
  a white background in both renderers.
- **Code blocks** — use a `code` environment and specify the language in square
  brackets. Both `\begin` and the misspelled `\being` opener are accepted.
  Braces such as `{python}` are also supported for compatibility.

  ```markdown
  \begin{code}[python]
  print('hello')
  \end{code}
  ```

  Omit `[python]` for plain text.
- **YouTube** — a fenced block with the `youtube` language and a URL or bare
  video id as its only line.
- Legacy `{{code(lang)}}…{{code}}` and `{{youtube(url)}}` blocks from older
  articles are rewritten to fenced blocks before rendering.

Level-2 and level-3 headings automatically become the table of contents, and
each gets an anchor so `/#blog/<slug>/<heading-id>` links to a section.

### Markdown preview

Ctrl+Shift+V uses VS Code's own renderer. `\bigo` comes from
`.vscode/settings.json`. Citations, references, and side notes come from the
local extension in `.vscode/article-markdown`. VS Code and Cursor keep
separate extension lists, so install the package in whichever editor you are
using:

```powershell
code --install-extension .vscode\article-markdown\article-markdown.vsix
```

In Cursor, the same file is installed with `cursor --install-extension` and
that path. From the Extensions view, the `...` menu → **Install from VSIX...**
selects the same file. Reload the window after installing, then open the
preview again.

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
| `npm run generate-sitemap` | Writes `public/sitemap.xml` from the registered posts. `prebuild` runs this, so every deploy does too. |
| `npm run generate-og-image` | Regenerates `public/og-image.png` (Python) |

`scripts/GetYoutubeURLs.py` and `scripts/GetYoutueData.py` refresh
`src/youtubeData.js` for the Media section, which is not currently mounted.
`scripts/projects.ipynb` was used to bootstrap `src/projects.js`.

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
