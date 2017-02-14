export function getImgFromSrc(src) {
  if (!src) throw "Image src is required"
  return new Promise((resolve, reject) => {
    let $img = document.createElement("img")
    $img.onload = () => resolve($img)
    $img.onerror = e => reject(e)
    $img.src = src
  })
}

export function base64img(i){
  var canvas = document.createElement('canvas')
  canvas.width = i.width
  canvas.height = i.height
  var context = canvas.getContext("2d")
  context.drawImage(i, 0, 0)
  var blob = canvas.toDataURL("image/png")
  return blob.replace(/^data:image\/(png|jpg);base64,/, "")
}

export function remoteToBlob(url, callback) {
  try {
    let xhr = new XMLHttpRequest()
    xhr.responseType = 'blob'
    xhr.onload = () => {
      // let reader = new FileReader()
      // reader.onloadend = () => {
      //   callback(null, reader.result)
      // }
      // reader.readAsDataURL(xhr.response)
      callback(null, xhr.response)
    }
    xhr.open('GET', url)
    xhr.send()
  } catch (e) {
    callback(e)
  }

}