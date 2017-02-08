module.exports = function Logger(namespace) {

  return function log(...args) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`%c${namespace}:`, "color: #5fba7d", ...args)
    }
  }

}