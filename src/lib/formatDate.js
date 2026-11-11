// Parse the date parts directly so a YYYY-MM-DD string does not shift a day
// backward in timezones behind UTC.
export const formatDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim())
  if (!match) return String(value).trim()

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
