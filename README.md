Time to totally not vibecode a website >w<

# Gabriel Mongaras — Portfolio (React + Vite + Tailwind)

Dark, elegant portfolio built with React (Vite) and Tailwind, matching your requested palette:
- **Background:** `#000000` (black)
- **Accent:** `#3B0066` (dark purple)

Your PDF resume has been placed at `public/Resume.pdf` so the **Resume (PDF)** button works out-of-the-box.

---

## Local Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # optional local preview of dist/
```

---

## Deploying on GitHub Pages

### Option A: GitHub Pages with Custom Domain (recommended if you own a domain)

1. In your repo **Settings → Pages**, set:
   - **Source:** `GitHub Actions`
2. If you have a custom domain (e.g., `gmongaras.me`), add it in **Settings → Pages** → **Custom domain**.
3. Keep `vite.config.js` as `base: '/'` for a custom domain.
4. Push the repo with the included workflow; it will build and deploy automatically.

### Option B: GitHub Pages under `<user>.github.io/<repo>`

1. Edit `vite.config.js` and change base to your repo name, e.g.:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/<your-repo-name>/',
   })
   ```
2. Commit and push. The included GitHub Actions workflow will publish to Pages.

### GitHub Actions Workflow

The file `.github/workflows/deploy.yml` is already included. It:
- Builds the site on pushes to `main`
- Uploads `dist/` as a Pages artifact
- Deploys to GitHub Pages automatically

If you use a branch other than `main`, adjust the workflow trigger.

---

## Updating Content

Edit `src/data.js` to change your profile, experience, education, skills, projects, and publications.
Links and labels are stored next to each item for convenience.

## Theming

Palette is controlled via Tailwind config and CSS variables:
- `tailwind.config.js` → `colors.accent`
- `src/index.css` → `:root { --bg: #000000; --accent: #3B0066; }`

## Accessibility & SEO

- Semantic sections and headings
- Descriptive button text and accessible labels
- Metadata in `index.html`

---

## Notes

- If you rename the PDF, also update the link in `Hero` component (`/Resume.pdf`).
- You can add a blog later by creating a `/blog` folder and using a static site generator or MDX pages inside `src`.
