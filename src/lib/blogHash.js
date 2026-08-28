// The site is served as a single static page, so the blog route lives in the
// hash: "#blog/<slug>" optionally followed by a heading anchor.
//
// The anchor is normally a path segment ("#blog/slug/section"), but links
// copied out of older builds use a second hash ("#blog/slug#section"), so both
// spellings are accepted.

export const parseBlogHash = (hash) => {
  if (!hash.startsWith('#blog/')) return null

  const [pathPart, ...hashParts] = hash.slice('#blog/'.length).split('#')
  const [slug, ...sectionParts] = pathPart.split('/')
  const section = sectionParts.join('/') || hashParts.join('#') || null

  return { slug, section }
}
