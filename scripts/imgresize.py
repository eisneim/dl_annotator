import os
from os.path import join, splitext, exists
import cv2
import numpy as np
import json

def checkImage(file, maxw, maxh):
  img = cv2.imread(file)
  zoomfactor = 1
  height, width, cc = img.shape
  ratio = width / height
  setedRatio = maxw / maxh
  # if image size is too big, resize it to fit window size and display
  destw = desth = 0
  if ratio >= setedRatio and width > maxw:
    destw = maxw
    desth = maxw / ratio
    # print("landscape: {}x{} => {}x{}".format(width, height, destw, desth))
  elif ratio < setedRatio and height > maxh:
    desth = maxh
    destw = maxh * ratio
    # print("portrait: {}x{} => {}x{}".format(width, height, destw, desth))
  else:
    # no resize required
    return (False, zoomfactor)
  zoomfactor = destw / width
  return (cv2.resize(img, (int(destw), int(desth))), zoomfactor)


def updateFile(img, file, jfile, annotion, zoom):
  height, width, channel = img.shape
  # orWidth = annotion["fullWidth"]
  # orHeight = annotion["fullHeight"]
  annotion["fullWidth"] = width
  annotion["fullHeight"] = height
  for node in annotion["nodes"]:
    for point in node["points"]:
      point["x"] = point["x"] * zoom
      point["y"] = point["y"] * zoom
  # dump file
  print("resize update: {}".format(jfile))
  with open(jfile, "w") as fout:
    fout.write(json.dumps(annotion))
  cv2.imwrite(file, img)


def resizeImages(root, files, maxw, maxh):
  for file in files:
    base, ext = splitext(file)
    jsonFile = join(root, base + ".json")
    # opencv doesn't support ".gif"
    if ext.lower() not in [".jpg", ".png"]:
      continue

    if not exists(join(root, file)):
      print("missing image: {}".format(file))
      return (False, 1)

    if not exists(jsonFile):
      print("missing json: {}".format(base + ".json"))
      continue

    with open(jsonFile) as fin:
      annotion = json.load(fin)

    img, zoom = checkImage(join(root, file), maxw, maxh)
    if type(img) == bool:
      # print("not resize required")
      continue
    updateFile(img, join(root, file), jsonFile, annotion, zoom)




