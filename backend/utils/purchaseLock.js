let isLocked = false

const acquireLock = () => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (!isLocked) {
        isLocked = true
        clearInterval(interval)
        resolve()
      }
    }, 50)
  })
}

const releaseLock = () => {
  isLocked = false
}

module.exports = { acquireLock, releaseLock }
