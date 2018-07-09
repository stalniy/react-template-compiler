jest.spyOn(console, 'warn')
jest.spyOn(console, 'error')

afterEach(() => {
  console.warn.mockReset()
  console.error.mockReset()
})

function checkForMessageIn(fn) {
  return (received) => {
    const pass = fn.mock.calls.some(args => args.some(arg => arg.indexOf(received)))

    return {
      pass,
      message: () => pass
        ? `Expected message "${received}" not to have been warned`
        : `Expected message "${received}" to have been warned`
    }
  }
}

expect.extend({
  toHaveBeenWarned: checkForMessageIn(console.error),
  toHaveBeenTipped: checkForMessageIn(console.warn)
})
