let namespace = "Popup"
function log(...args) {
  console.log(`%c${namespace}:`, "color: #5fba7d", ...args)
}

let defaultConfig = {
  idCount: 0,
  localSaveMethod: "JSON", // JSON
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

let $form = document.getElementById("mainForm")
let $msg = document.getElementById("message")
let $createClassBtn = document.getElementById("createClassBtn")
let $newClassName = document.getElementById("newClassName")
let $confirmBox = document.getElementById("confirmBox")

let timerID
function notify(...args){
  if (timerID !== undefined) clearTimeout(timerID)

  let msg = args.join(" ")
  $msg.innerText = msg
  $msg.style.visibility = "visible"
  timerID = setTimeout(() => {
    $msg.innerText = ""
    $msg.style.visibility = "hidden"
  }, 4000)
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

function _confirm(msg, cb){
  $confirmBox.style.visibility = "visible"
  $confirmBox.firstElementChild.innerText = msg
  let $cancel = $confirmBox.firstElementChild.nextElementSibling
  let $confirm = $cancel.nextElementSibling
  $cancel.onclick = () => {
    $confirmBox.style.visibility = "hidden"
  }
  $confirm.onclick = () => {
    cb()
    $confirmBox.style.visibility = "hidden"
  }
}

function removeClass(name, elm) {
  let msg = "are you sure you want to delete " + name + "? prvious annoted data might be currupted!"
  _confirm(msg, () => {
    chrome.storage.sync.get("classes", data => {
      let idx = data.classes.indexOf(name)
      log("remove:", name, idx)
      data.classes.splice(idx, 1)
      chrome.storage.sync.set({ classes: data.classes.slice() })
      elm.remove()
    })
  })
}

function createClassText(name) {
  let $span = document.createElement("span")
  $span.className="dla_classText"
  $span.innerText = name
  $span.addEventListener("click", () => {
    removeClass(name, $span)
  })
  return $span
}

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
        if (config.defaultClass === idx)
          $opt.selected = true

        $opt.value = cc
        $opt.innerText = cc
        $defaultClass.appendChild($opt)
        $classes.appendChild(createClassText(cc))
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
    notify("default class saved as: ", target.value)
  } else if (target === elm.saveFile) {
    chrome.storage.sync.set({ localSaveMethod: "FILENAME" })
    notify("local save method saved as: ", "filename")
  } else if (target === elm.saveJSON) {
    chrome.storage.sync.set({ localSaveMethod: "JSON" })
    notify("local save method saved as: ", "JSON")
  } else if (target === elm.server) {
    chrome.storage.sync.set({ server: target.value })
    notify("Server address updated!")
  }
})

$createClassBtn.addEventListener("click", () => {
  chrome.storage.sync.get("classes", data => {
    let name = $newClassName.value
    if (!name) return notify("name should not be empty")
    if (data.classes.indexOf(name) > -1) {
      return notify(name, "already exits")
    }
    let regx = /[\.\$\!\@\#\%\^\&\*\\\<\>\?\/\~\`\[\]\{\}]/
    if (regx.test(name))
      return notify("name should not contain special charactors: .$!@#%^&*<>?/~\\[]{}`")

    let newClasses = data.classes.slice()
    newClasses.push(name)
    chrome.storage.sync.set({ classes: newClasses })

    document.getElementById("classes")
      .appendChild(createClassText(name))
  })

})

initConfig()
  .then(setFormInitialValue)
  .then()

