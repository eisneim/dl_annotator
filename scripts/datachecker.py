#! /usr/bin/env python3
import os
from os.path import join, getsize, splitext
import argparse
import json
import filecmp
import time


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
  repeated = 0
  filenames = {}
  for idx, file in enumerate(files):
    fname, ext = splitext(file)
    if fname not in filenames:
      filenames[fname] = []
    filenames[fname].append(file)

    # only dup check image files
    if not ext.lower() in [".jpg", ".png", ".gif"]:
      continue
    repeated += deDuplication(root, idx, file, files)

  print("repeated files: {}".format(repeated))

  removeCorruptedPair(filenames, root)
  # only travers top directory


def checkPath(folder):
  for root, dirs, files in os.walk(folder):
    print("files count: {}".format(len(files)))
    enumerateFiles(root, files)
    break


def removeCorruptedPair(filenames, root):
  for fname in filenames:
    pair = filenames[fname]
    if len(pair) < 2:
      print("corrupted pair: {}".format(pair))
      os.unlink(join(root, pair[0]))


def checkData(jsonFile):
  with open(jsonFile) as file:
    data = json.load(file)
  # make sure a rect and a polygon node exits


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

  args = parser.parse_args()
  print("parsing: {}, target class: {}".format(args.folder, args.cls))
  assert os.path.exists(args.folder)
  startTime = time.time()

  checkPath(args.folder)

  timediff = time.time() - startTime
  print("time usage: {:.2f}s".format(timediff))

