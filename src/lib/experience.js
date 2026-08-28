// Turns the human-written date ranges on the experience entries into a single
// "X years Y months" total, so the heading stays correct without being updated
// by hand every month.

const MONTH_AND_YEAR = /(\w{3})\s+(\d{4})/
const DATE_RANGE = /(\w{3})\s+(\d{4})\s*—\s*(\w{3})\s+(\d{4})/

const monthIndex = (month, year) => new Date(`${month} 1, ${year}`)

const monthsBetween = (start, end) =>
  (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

const pluralise = (count, unit) => `${count} ${unit}${count === 1 ? '' : 's'}`

const monthsInRange = (dateRange, now) => {
  if (dateRange.includes('Present')) {
    const start = dateRange.match(MONTH_AND_YEAR)
    return start ? monthsBetween(monthIndex(start[1], start[2]), now) : 0
  }

  const range = dateRange.match(DATE_RANGE)
  if (!range) return 0
  return monthsBetween(monthIndex(range[1], range[2]), monthIndex(range[3], range[4]))
}

export const formatTotalExperience = (jobs, now = new Date()) => {
  const totalMonths = jobs.reduce((total, job) => total + monthsInRange(job.date, now), 0)
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0) return pluralise(months, 'month')
  if (months === 0) return pluralise(years, 'year')
  return `${pluralise(years, 'year')} ${pluralise(months, 'month')}`
}
