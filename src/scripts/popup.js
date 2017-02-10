let namespace = "Popup"
function log(...args) {
  console.log(`%c${namespace}:`, "color: #5fba7d", ...args)
}

let defaultConfig = {
  idCount: 0,
  localSaveMethod: "FILENAME", // JSON
  classes: [
    "billboard",
    "ad-lampbox",
    "banner",
    "ad-screen",
    "monitor",
  ],
  defaultClass: 1,
  server: "http://localhost:8000/upload",
}

function initConfig() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("localSaveMethod", data => {
      if (data.localSaveMethod) return resolve(true)
      chrome.storage.sync.set(defaultConfig, () => {
        resolve(true)
      })
    })
  })
}

let $form = document.getElementById("mainForm")

// ant that's why we should use tow-way data-binding or React like render methods
// it's really cumbersome to map data to html element
function setFormInitialValue() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(Object.keys(defaultConfig), config => {
      log("currentConfig:", config, Object.keys(defaultConfig))
      let $defaultClass = $form.elements.defaultClass
      let $classes = document.getElementById("classes")
      // set <options>
      config.classes.forEach((cc, idx) => {
        let $opt = document.createElement("option")
        let $span = document.createElement("span")
        $span.className="dla_classText"

        if (config.defaultClass === idx)
          $opt.selected = true

        $opt.value = cc
        $opt.innerText = $span.innerText = cc
        $defaultClass.appendChild($opt)
        $classes.appendChild($span)
      })
      // set server address
      let $server = $form.elements.server
      $server.value = config.server
      // localSaveMethod
      if (config.localSaveMethod === "JSON") {
        $form.elements.saveJSON.checked = true
      } else {
        $form.elements.saveFile.checked = true
      }
    })
  })
}

$form.addEventListener("change", e => {
  let target = e.target
  let elm = $form.elements
  log("form chagned, target:", target)
  let saveToJSON = target === elm.saveJSON

  if (target === elm.defaultClass) {
    chrome.storage.sync.get("classes", data => {
      log("update defaultClass", target.value, data.classes)
      chrome.storage.sync.set({ defaultClass: data.classes.indexOf(target.value) })
    })
  } else if (target === elm.saveFile) {
    chrome.storage.sync.set({ localSaveMethod: "FILENAME" })
  } else if (target === elm.saveJSON) {
    chrome.storage.sync.set({ localSaveMethod: "JSON" })
  } else if (target === elm.server) {
    chrome.storage.sync.set({ server: target.value })
  }
})

initConfig()
  .then(setFormInitialValue)
  .then()

