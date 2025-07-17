/**
 * Format time duration with appropriate units
 * - Below 1 second: show in milliseconds (e.g., "250ms", "999ms")
 * - Above 1 second: show in seconds with milliseconds (e.g., "1.002s", "2.345s")
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 1) {
    // Convert to milliseconds and round to nearest integer
    const milliseconds = Math.round(seconds * 1000)
    return `${milliseconds}ms`
  } else {
    // Show seconds with 3 decimal places for millisecond precision
    return `${seconds.toFixed(3)}s`
  }
}

/**
 * Format processing time for display in results
 * Same logic as formatDuration but with consistent naming
 */
export const formatProcessingTime = (seconds: number): string => {
  return formatDuration(seconds)
}

/**
 * Format time with custom precision
 * @param seconds - time in seconds
 * @param precision - number of decimal places for seconds display
 */
export const formatDurationWithPrecision = (seconds: number, precision: number = 3): string => {
  if (seconds < 1) {
    const milliseconds = Math.round(seconds * 1000)
    return `${milliseconds}ms`
  } else {
    return `${seconds.toFixed(precision)}s`
  }
}

/**
 * Format time for admin dashboard tables
 * Uses shorter format suitable for table display
 */
export const formatTableTime = (seconds: number): string => {
  if (seconds < 1) {
    const milliseconds = Math.round(seconds * 1000)
    return `${milliseconds}ms`
  } else {
    return `${seconds.toFixed(3)}s`
  }
}

/**
 * Format time for charts and graphs
 * Returns numeric value with appropriate unit suffix
 */
export const formatChartTime = (seconds: number): string => {
  if (seconds < 1) {
    const milliseconds = Math.round(seconds * 1000)
    return `${milliseconds}ms`
  } else {
    return `${seconds.toFixed(2)}s`
  }
}