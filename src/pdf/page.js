// Page geometry shared by the exporter. The article clone is laid out at
// exactly the printable width so CSS pixels map onto millimetres directly.

export const PX_PER_MM = 96 / 25.4
export const MM_PER_PX = 25.4 / 96
export const PT_PER_PX = 72 / 96

export const PAGE = { width: 210, height: 297 }
export const MARGIN = { top: 15, right: 14, bottom: 15, left: 14 }

export const CONTENT_MM = {
  width: PAGE.width - MARGIN.left - MARGIN.right,
  height: PAGE.height - MARGIN.top - MARGIN.bottom,
}

export const CONTENT_PX = {
  width: Math.round(CONTENT_MM.width * PX_PER_MM),
  height: CONTENT_MM.height * PX_PER_MM,
}
