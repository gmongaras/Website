// Fixed-width slot for a card inside a HorizontalScrollContainer. The width has
// to match CARD_STEP_PX in that component for the arrow buttons to line up.
const ScrollRowItem = ({ children }) => (
  <div className="flex-shrink-0 w-80 flex min-w-0 max-w-80">{children}</div>
)

export default ScrollRowItem
