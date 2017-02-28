import argparse
import os
from os.path import join, splitext, exists, isabs
import json
import shutil
from PIL import Image
import time
# import numpy as np
CLASSES = ["billboard", "banner", "ad-screen", "standing-lcd"]
IDCOUNT = 0
PAIRS = []


def convert(width, height, node):
  if node["class"] not in CLASSES:
    return False
  idx = CLASSES.index(node["class"])
  pp = node["points"]
  x1 = pp[0]["x"]
  y1 = pp[0]["y"]
  x2 = pp[2]["x"]
  y2 = pp[2]["y"]
  x = min(x1, x2) / width
  y = min(y1, y2) / height
  w = abs(x1 - x2) / width
  h = abs(y1 - y2) / height

  return "{idx} {x:.6f} {y:.6f} {w:.6f} {h:.6f}".format(idx=idx, x=x, y=y, w=w, h=h)


def iterateFiles(dirname, imgsPath, labelsPath):
  global IDCOUNT
  global PAIRS
  files = []
  with os.scandir(dirname) as it:
    for entry in it:
      if not entry.name.startswith(".") and entry.is_file():
        files.append(entry)

  for idx, file in enumerate(files):
    base, ext = splitext(file.name)

    if ext.lower() in [".jpg", ".png"]:
      id = IDCOUNT
      try:
        img = Image.open(file.path)
      except:
        print("!!!error open image {}, ignored".format(file.name))
        continue

      jsonPath = join(dirname, base + ".json")
      if not exists(jsonPath):
        print("missing json file: {}".format(base + ".json"))
        continue
      with open(jsonPath, "r") as jfile:
        annotation = json.load(jfile)

      outTxt = join(labelsPath, "{}.txt".format(id))
      writedNode = 0
      with open(outTxt, "w") as fout:
        for node in annotation["nodes"]:
          if node["type"] != "RECT":
            continue
          line = convert(img.width, img.height, node)
          if line:
            writedNode += 1
            fout.write(line + "\n")
          else:
            print("{} => class: '{}' is not in class list, has been ignored"
              .format(file.name, node["class"]))
      # if no data is write, remove txt file
      if writedNode == 0:
        os.unlink(outTxt)
        continue

      # move image to imgsPath
      # make sure it's corresponding json file exits
      if not exists(jsonPath):
        print(">> missing json file: {}".format(file.name))
        continue
      # os.rename(file.path, join(imgsPath, ))
      newImgPath = join(imgsPath, "{}{}".format(id, ext))
      shutil.copy2(file.path, newImgPath)
      IDCOUNT += 1
      # save pairs
      PAIRS.append((newImgPath, jsonPath))


if __name__ == "__main__":
  des = "convert fsd image annotation to yolo darknet format"
  parser = argparse.ArgumentParser(description=des)
  parser.add_argument("--dest", dest="dest", type=str, default="./fsdyolo",
    help="destination folder")
  parser.add_argument("dirs", metavar="DIR", type=str, nargs="+",
    help="src folders contains images and it's json annotation")

  args = parser.parse_args()
  cw = os.getcwd()
  #convoert to absolute path
  if not os.path.isabs(args.dest):
    args.dest = os.path.normpath(join(cw, args.dest))

  print("parse images from: {} =====> {}".format(args.dirs, args.dest))
  startTime = time.time()

  imgsPath = join(args.dest, "images")
  labelsPath = join(args.dest, "labels")

  if not exists(imgsPath): os.makedirs(imgsPath)
  if not exists(labelsPath): os.makedirs(labelsPath)

  for dirname in args.dirs:
    iterateFiles(dirname, imgsPath, labelsPath)

  print("------ generating train and test list --------")
  trainfile = open(join(args.dest, "train.txt"), "w")
  testfile = open(join(args.dest, "test.txt"), "w")
  for idx, pair  in enumerate(PAIRS):
    if idx % 8 == 0:
      testfile.write(pair[0] + "\n")
    else:
      trainfile.write(pair[0] + "\n")

  print(">>> done parsing {} images!({:.2f}s) ".format(IDCOUNT, time.time() - startTime))
