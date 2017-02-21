#! /usr/bin/env python3
import os
from os.path import join, getsize, splitext
import argparse
import json
import filecmp
import time

parsedAnnotations = []

def deDuplication(root, idx, file, files):
  # size = getsize(join(root, file))
  count = 0
  for idx2, ff in enumerate(files):
    if idx == idx2:
      continue

    if filecmp.cmp(join(root, file), join(root, ff), shallow=False):
      count += 1
      print('same file size: {}  {}'.format(file, ff))
      # bad practice to mutate a list in a enumeration of itself
      files.pop(idx2)
      # try to remove the later one
      os.unlink(join(root, ff))

  return count


def enumerateFiles(root, files):
  global parsedAnnotations
  repeated = 0
  invalidAnnotations = 0
  filenames = {}
  for idx, file in enumerate(files):
    fname, ext = splitext(file)
    if fname not in filenames:
      filenames[fname] = []
    filenames[fname].append(file)

    # only dup check image files
    if ext.lower() in [".jpg", ".png", ".gif"]:
      repeated += deDuplication(root, idx, file, files)
    elif ext.lower() == ".json":
      with open(file) as jsonFile:
        annoData = json.load(jsonFile)
      annoData["fname"] = fname
      annoData["filename"] = file

      isValid = checkAnnotation(file, annoData)
      invalidAnnotations += 0 if isValid else 1
      # save it to a global variable, so we can use it when resizing images
      if isValid:
        parsedAnnotations.append(annoData)

    # ------------------
  removeCorruptedPair(filenames, root)
  return (repeated, invalidAnnotations)
  # only travers top directory


def checkFolder(folder):
  for root, dirs, files in os.walk(folder):
    print("files count: {}".format(len(files)))
    return (root, files)


def removeCorruptedPair(filenames, root):
  for fname in filenames:
    pair = filenames[fname]
    if len(pair) < 2:
      print("corrupted pair: {}".format(pair))
      os.unlink(join(root, pair[0]))


def checkAnnotation(jsonFile, data):
  # with open(jsonFile) as file:
  #   data = json.load(file)
  if len(data["nodes"]) < 2:
    print("no sufficient nodes: {}".format(jsonFile))
    return False
  # make sure a rect and a polygon node exits
  # if len(data["nodes"]) % 2 != 0:
  #   print("{} number of nodes is not an even number".format(jsonFile))

  numRect, numPoly = 0
  for node in data["nodes"]:
    if node["type"] == "RECT":
      numRect += 1
    elif node["type"] == "POLYGON":
      numPoly += 1

  if numRect != numPoly:
    msg = "unmatch node type, rect({}) polygon({}) in {}"
    print(msg.format(numRect, numPoly, jsonFile))
    return False
  return True


if __name__ == "__main__":
  description = """
  remove duplicated image, check json data
  example:
    datachecker.py --folder "path" --class "billboard"
  """
  parser = argparse.ArgumentParser(description=description)
  parser.add_argument("--folder", required=True, type=str, dest="folder",
    help="source folder that contains same class images")
  parser.add_argument("--cls", type=str, dest="cls",
    help="class that target folder's image belongs to")
  parser.add_argument("--resize", type=bool, dest="resize", default=False, help="resize image or not")
  parser.add_argument("--maxw", type=int, dest="maxw", default=500, help="maxium width")
  parser.add_argument("--maxh", type=int, dest="maxh", default=500, help="maxium height")

  args = parser.parse_args()
  print("parsing: {}, target class: {}".format(args.folder, args.cls))
  assert os.path.exists(args.folder)
  startTime = time.time()

  root, files = checkFolder(args.folder)
  repeated, invalidAnnotations = enumerateFiles(root, files)
  print("repeated files: {}".format(repeated))

  # if there is no repeated files, we should start to resize image
  # this is an expensive operation
  if repeated == 0 and args.resize:
    print("---------------------------------")
    print("start to check image size, resize large image file.")


  timediff = time.time() - startTime
  print("time usage: {:.2f}s".format(timediff))

