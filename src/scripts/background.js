console.log('--this is backgroundjs, chrome: ', chrome)
let menuItem = {
  id: "OPEN_MODAL",
  title: "open annotator",
  // "all", "page", "frame", "selection", "link", "editable", "image",
   // "video", "audio", "launcher", "browser_action", or "page_action"
  contexts: ["image"],
  onclick: (info, tab) => {
    console.log('context menu clicked', info)
    // send mesage to content script
    // chrome.runtime.sendMessage(info,)
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      info.type = "OPEN_MODAL"
      chrome.storage.local.get("srcUrls", data => {
        var urls = data.srcUrls || []
        // console.log("urls:", urls)
        if (urls.indexOf(info.srcUrl) > -1) {
          // notify user, they already annotated this image.
          chrome.notifications.create("REPEATED", {
            type: "image",
            title: "repeated",
            message: "you might already annotated this image",
            iconUrl: "img/logo-128.png",
            imageUrl: info.srcUrl,
            isClickable: true,
          })
        } else {
          urls.push(info.srcUrl)
        }
        // keep it lean, remove first half of it
        let len = urls.length
        console.log("urls: ", len)
        if (len > 999) {
          urls.splice(0, len - 999)
          console.log("url len", urls.length)
        }

        chrome.tabs.sendMessage(tabs[0].id, info, function(response) {
          console.log("tab contentscript:", response)
          // save it back
          chrome.storage.local.set({ srcUrls: urls })
        })
      })


    })
  },
}

chrome.contextMenus.create(menuItem)

chrome.notifications.onClicked.addListener(notiID => {
  // just remove it
  if (notiID === "REPEATED") {
    chrome.notifications.clear(notiID)
  }
})


let msgHandlers = {
  SAVE_FILE: (msg, sender, reply) => {
    let { filename, url, method, jsonString, jsonFilename } = msg
    let dataUrl = "data:text/json;charset=utf-8," + jsonString
    if (method === "JSON") {
      chrome.downloads.download({
        url: dataUrl, filename: jsonFilename,
      }, downloadId => reply({
        downloadId, success: true,
      }))
    }

    chrome.downloads.download({
      url, filename,
      // saveAs: true,
    }, downloadId => reply({
      downloadId, success: true,
    }))
  },
  UPLOAD_FILE: (msg, sender, reply) => {
    let { jsonFilename, filename, imgBlob, jsonBlob } = msg

    var formData = new FormData()
    formData.append("image", imgBlob, filename)
    formData.append("json", jsonBlob, jsonFilename)


  },
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  let fn = msgHandlers[msg.type]
  if (fn) {
    fn(msg, sender, reply)
  } else {
    console.log("unhandled message:", msg)
  }
  // asynchronously use reply
  return true
})

// ---------- shortcut key listener ----------------
chrome.commands.onCommand.addListener(command => {
  console.log("new command: ", command)
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "COMMAND", command
    })
  })
})

