// Resolves once the browser has painted, which is the point at which freshly
// mounted content can be measured.
export const nextPaint = () => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve))
})

// Scrolls to the element a location hash points at. Hashes are user-supplied,
// so anything that is not a usable selector is simply ignored.
export const scrollToHash = (hash) => {
  if (!hash || hash === '#') return

  try {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  } catch {
    // Not a valid selector; there is nothing on the page to scroll to.
  }
}
