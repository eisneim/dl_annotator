#!/usr/bin/env python3
import argparse
import os
import json
from os.path import join, splitext, isdir, exists
import cv2
import numpy as np

__WINNAME = "image"
__MAXW = 600
__MAXH = 600
__RATIO = __MAXW / __MAXH
ix, iy = -1, -1
isDrawing = False


def getFiles(folder):
  files = []
  # should better use filter and map, but python2 and 3 is differient
  for entry in os.scandir(folder):
    if entry.is_file():
      files.append(entry)
  return files


def getImg(img, zoomfactor=1):
  imgh, imgw, imgc = np.shape(img)
  ratio = imgw / imgh
  # if image size is too big, resize it to fit window size and display
  destw = desth = 0
  if ratio >= __RATIO and imgw > __MAXW:
    destw = __MAXW
    desth = __MAXW / ratio
    print("landscape oriantation: {}x{} => {}x{}".format(imgw,imgh,destw, desth))
    putText(img, "landscape", (img.shape[1] - 40, 20))
  elif ratio < __RATIO and imgh > __MAXH:
    desth = __MAXH
    destw = __MAXH * ratio
    print("portrait oriantation: {}x{} => {}x{}".format(imgw,imgh,destw, desth))
    putText(img, "portrait", (img.shape[1] - 40, 20))
  else:
    # no resize required
    return (img, zoomfactor)
  zoomfactor = destw / imgw
  return (cv2.resize(img, (int(destw), int(desth))), zoomfactor)


def emptyCallback(event, x, y, flags, param):
  pass


def updateFile(img, file, jfile, annotion, offset):
  height, width, channel = img.shape
  # orWidth = annotion["fullWidth"]
  # orHeight = annotion["fullHeight"]
  annotion["fullWidth"] = width
  annotion["fullHeight"] = height
  for node in annotion["nodes"]:
    for point in node["points"]:
      point["x"] -= offset[0]
      point["y"] -= offset[1]
  # dump file
  print("update json file:{}".format(jfile))
  with open(jfile, "w") as fout:
    fout.write(json.dumps(annotion))
  print("update img file")
  cv2.imwrite(file.path, img)


def crop(img, p1, p2, zoomfactor):
  startIdxH = min(p1[1], p2[1]) / zoomfactor
  endIdxH = max(p1[1], p2[1]) / zoomfactor
  startIdxW = min(p1[0], p2[0]) / zoomfactor
  endIdxW = max(p1[0], p2[0]) / zoomfactor
  offset = (int(startIdxW), int(startIdxH))

  return (img[int(startIdxH):int(endIdxH), int(startIdxW):int(endIdxW), :], offset)

def startCropEventListener(img, file, jfile, zoomfactor, originalImg, annotion):
  mat = [0]
  # help info
  msg = 'drag to crop, press "enter" to confirm, press "space" to skip'
  putText(img, msg, (10, img.shape[0] - 30))

  rect = [None, None]
  def cropCallback(event, x, y, flags, param):
    global ix, iy, isDrawing
    if event == cv2.EVENT_LBUTTONDOWN:
      isDrawing = True
      ix, iy = x, y
      cv2.circle(img, (x, y), 3, (0, 50, 255), -1)

    elif event == cv2.EVENT_MOUSEMOVE:
      if isDrawing:
        mat[0] = np.zeros(img.shape, np.uint8)
        cv2.rectangle(mat[0], (ix, iy), (x, y), (0, 50, 255), 2)

    elif event == cv2.EVENT_LBUTTONUP:
      isDrawing = False
      rect[0] = (ix, iy)
      rect[1] = (x, y)
      # cv2.rectangle(img, (ix, iy), (x, y), (0, 50, 255), 2)

  cv2.setMouseCallback(__WINNAME, cropCallback)
  while(1):
    destImg = img + mat[0]
    cv2.imshow(__WINNAME, destImg)
    key = cv2.waitKey(20)
    if key & 0xFF == 32: # spacebar
      break
    elif key & 0xFF == 13:
      # should check for rect tange
      if not rect[0] or not rect[1]:
        continue # not crop region created!
      print("now do the crop: {}".format(file.name))
      img, offset = crop(originalImg, rect[0], rect[1], zoomfactor)
      originalImg = img
      zoomfactor = 1
      mat[0] = np.zeros(img.shape, np.uint8)
      # should update json file
      updateFile(img, file, jfile, annotion, offset)
      drawAnnotation(img, annotion, zoomfactor)
      # break
    elif key & 0xFF == 8: # backspace
      # delete this image and json file
      os.unlink(file.path)
      os.unlink(jfile)
      break
  # remove callback
  cv2.setMouseCallback(__WINNAME, emptyCallback)

def putText(img, text, coord):
  font = cv2.FONT_HERSHEY_SIMPLEX
  cv2.putText(img, text, coord, font, 0.4, (0, 0, 255))

def drawAnnotation(img, annotion, zoomfactor):
  # draw all ndoes
  for node in annotion["nodes"]:
    if node["type"] == "RECT":
      pp = node["points"]
      p1 = (int(pp[0]["x"] * zoomfactor), int(pp[0]["y"] * zoomfactor))
      p2 = (int(pp[2]["x"] * zoomfactor), int(pp[2]["y"] * zoomfactor))
      # print("rect: {} {}".format(p1, p2))
      cv2.rectangle(img, p1, p2, (0, 255, 0), 2)

    elif node["type"] == "POLYGON":
      for idx, p in enumerate(node["points"]):
        nextP = node["points"][idx + 1] if idx < 3 else node["points"][0]
        cv2.line(img, (int(p["x"] * zoomfactor), int(p["y"]* zoomfactor)),
          (int(nextP["x"]* zoomfactor), int(nextP["y"]* zoomfactor)), (255, 100, 0), 2)


def displayImg(root_folder, file, fname):
  jfilename = fname + ".json"
  jpath = join(root_folder, jfilename)
  if not exists(jpath):
    print("{} not exits".format(json))
    return
  with open(jpath, "r") as jfile:
    annotion = json.load(jfile)
  # create mat to draw on
  originalImg = cv2.imread(file.path)
  print("original: {}x{}".format(originalImg.shape[1], originalImg.shape[0]))
  img, zoomfactor = getImg(originalImg)
  if zoomfactor < 1:
    # put notify text
    text = "{}x{} => {}x{} zoom:{:.3f}".format(
      originalImg.shape[1], originalImg.shape[0],
      img.shape[1], img.shape[0], zoomfactor)
    putText(img, text, (10, 40))

  drawAnnotation(img, annotion, zoomfactor)

  # event listener for croping
  if zoomfactor < 1:
    startCropEventListener(img, file, jpath, zoomfactor, originalImg, annotion)
    return True
  else:
    cv2.imshow(__WINNAME, img)
    return False

if __name__ == "__main__":
  des = """
  display an image and it's annotion
  """
  parser = argparse.ArgumentParser(description=des)
  parser.add_argument("--folder", required=True, dest="folder", type=str,
    help="source folder path")
  parser.add_argument("--start", dest="startIdx", type=int, default=0,
    help="starting index, so we can skip previously checked files")

  args = parser.parse_args()

  # create a window to display image
  # cv2.namedWindow("image", flags=cv2.WINDOW_AUTOSIZE)
  # cv2.namedWindow("image", flags=cv2.WINDOW_NORMAL)
  # cv2.namedWindow("image", flags=cv2.WINDOW_OPENGL)
  cv2.namedWindow(__WINNAME)

  files = getFiles(args.folder)
  for idx, file in enumerate(files):
    if idx < args.startIdx:
      continue

    base, ext = splitext(file.name)
    # ".gif" not supported
    if ext.lower() in [".jpg", ".png"]:
      print("idx: {} file: {}".format(idx, file.name))
      isCropNeeded = displayImg(args.folder, file, base)
      # waitKey has already been handled
      if isCropNeeded:
        continue
      key = cv2.waitKey(0)
      # enter:13 backspace: 8 left: 124 space: 32 c:99
      # print("pressed key: {}".format(key))
      if key == 8:
        # delete this image and json file
        os.unlink(file.path)
        os.unlink(join(args.folder, base + ".json"))

      elif key & 0xFF == 27: #exit
        print("------- exit ---------")
        break

  cv2.destroyAllWindows()

