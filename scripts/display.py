#!/usr/bin/env python3
import argparse
import os
import json
from os.path import join, splitext, isdir, exists
import cv2
import numpy as np


def getFiles(folder):
  files = []
  # should better use filter and map, but python2 and 3 is differient
  for entry in os.scandir(folder):
    if entry.is_file():
      files.append(entry)
  return files


def displayImg(root_folder, file, fname):
  jfilename = fname + ".json"
  jpath = join(root_folder, jfilename)
  if not exists(jpath):
    print("{} not exits".format(json))
    return
  with open(jpath, "r") as jfile:
    annotion = json.load(jfile)
  # create mat to draw on
  img = cv2.imread(file.path)
  # draw all ndoes
  for node in annotion["nodes"]:
    if node["type"] == "RECT":
      pp = node["points"]
      p1 = (int(pp[0]["x"]), int(pp[0]["y"]))
      p2 = (int(pp[2]["x"]), int(pp[2]["y"]))
      print("rect: {} {}".format(p1, p2))
      cv2.rectangle(img, p1, p2, (0, 255, 0), 2)
    elif node["type"] == "POLYGON":
      for idx, p in enumerate(node["points"]):
        nextP = node["points"][idx + 1] if idx < 3 else node["points"][0]
        cv2.line(img, (int(p["x"]), int(p["y"])), (int(nextP["x"]), int(nextP["y"])), (255, 100, 0), 2)

  cv2.imshow("image", img)


if __name__ == "__main__":
  des = """
  display an image and it's annotion
  """
  parser = argparse.ArgumentParser(description=des)
  parser.add_argument("--folder", required=True, dest="folder", type=str,
    help="source folder path")
  args = parser.parse_args()

  # create a window to display image
  # cv2.namedWindow("image", flags=cv2.WINDOW_AUTOSIZE)
  cv2.namedWindow("image")

  files = getFiles(args.folder)
  for idx, file in enumerate(files):
    base, ext = splitext(file.name)
    if ext.lower() in [".jpg", ".png", ".gif"]:
      displayImg(args.folder, file, base)
      cv2.waitKey(0)

  cv2.destroyAllWindows()

