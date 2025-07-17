// Test time formatting utility
const formatDuration = (seconds) => {
  if (seconds < 1) {
    // Convert to milliseconds and round to nearest integer
    const milliseconds = Math.round(seconds * 1000)
    return `${milliseconds}ms`
  } else {
    // Show seconds with 3 decimal places for millisecond precision
    return `${seconds.toFixed(3)}s`
  }
}

// Test cases
const testCases = [
  0.001,    // 1ms
  0.05,     // 50ms
  0.123,    // 123ms
  0.250,    // 250ms
  0.500,    // 500ms
  0.999,    // 999ms
  1.000,    // 1.000s
  1.001,    // 1.001s
  1.123,    // 1.123s
  1.500,    // 1.500s
  2.345,    // 2.345s
  10.567,   // 10.567s
  60.123,   // 60.123s
]

console.log('Time Formatting Test Results:')
console.log('=============================')
testCases.forEach(seconds => {
  const formatted = formatDuration(seconds)
  console.log(`${seconds}s → ${formatted}`)
})