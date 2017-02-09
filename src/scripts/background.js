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
      chrome.tabs.sendMessage(tabs[0].id, info, function(response) {
        console.log("tab contentscript:", response)
      })
    })
  },
}

chrome.contextMenus.create(menuItem)

let msgHandlers = {
  SAVE_FILE: (msg, sender, reply) => {
    let { filename, url } = msg
    chrome.downloads.download({
      url, filename,
      // saveAs: true,
    }, downloadId => reply({
      downloadId, success: true,
    }))
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

