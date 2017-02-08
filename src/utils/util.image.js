export function getImgFromSrc(src) {
  if (!src) throw "Image src is required"
  return new Promise((resolve, reject) => {
    let $img = document.createElement("img")
    $img.onload = () => resolve($img)
    $img.onerror = e => reject(e)
    $img.src = src
  })
}