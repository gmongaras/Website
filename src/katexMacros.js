// Math commands shared by every article.
//
// The name is what you type after the backslash. The value is the KaTeX it
// expands to. #1, #2, ... are arguments, so `\norm#1` is used as `\norm{x}`.
//
//   \bigo     → \mathcal{O}
//   \norm{x}  → \left\| x \right\|
//
// The Ctrl+Shift+V preview reads .vscode/settings.json, not this file.
// Copy any new command into markdown.math.macros there too.

const definitions = {
  bigo: '\\mathcal{O}',
}

export const katexMacros = Object.fromEntries(
  Object.entries(definitions).map(([name, replacement]) => [`\\${name}`, replacement]),
)
