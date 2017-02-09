console.log('--this is backgroundjs ', Date.now())
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
      chrome.tabs.sendMessage(tabs[0].id, info, function(response) {
        info.type = "OPEN_MODAL"
        console.log("tab contentscript:", response)
      })
    })
  },
}

chrome.contextMenus.create(menuItem)