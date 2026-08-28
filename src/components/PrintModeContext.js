import { createContext } from 'react'

// Lazy-mounted media stays out of the DOM until scrolled to, which would leave
// holes in a printed or exported article. Turning this on flips every renderer
// into an eager mode first.
export const PrintModeContext = createContext(false)
