import os
from os.path import join, splitext

def enumerateFiles(root, files):
  for file in files:
    fname, ext = splitext(file)