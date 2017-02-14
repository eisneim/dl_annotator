#!/usr/bin/env python
# Simple HTTP Server With Upload.

import os
from BaseHTTPServer import BaseHTTPRequestHandler
from urlparse import urlparse
import urllib # parse url
# import cgi
# import shutil # file operation
# import mimetypes
import re
import json
try:
  from cStringIO import StringIO
except ImportError:
  from StringIO import StringIO


class SimpleHandler(BaseHTTPRequestHandler):
  def do_GET(self):
    parsed_path = urlparse(self.path)
    message_parts = [
      "CLIENT VALUES:",
      "client_address={}({})".format(self.client_address, self.address_string()),
      "command={}".format(self.command),
      "path={}".format(self.path),
      "real_path={}".format(parsed_path.path),
      "query={}".format(parsed_path.query),
      "request_version={}".format(self.request_version),
      "",
      "SERVER_VALUES:",
      "server_version={}".format(self.server_version),
      "sys_version={}".format(self.sys_version),
      "protocol_version={}".format(self.protocol_version),
      "",
      "HEADERS RECEIVED:",
    ]
    for name, value in sorted(self.headers.items()):
      message_parts.append("{}={}".format(name, value.rstrip()))
    message_parts.append("")
    message = "\r\n".join(message_parts)
    self.send_response(200)
    # self.send_header("Content-Type", "text/html")
    self.send_header("X-Author", "eisneim")
    self.end_headers()
    self.wfile.write(message)
    return

  def do_POST(self):
    r, info = self.deal_post_data()
    # print(r, info, "by: ", self.client_address)
    print(info)
    ff = StringIO()
    if r:
      ff.write(json.dumps({ "success": True }))
    else:
      res = { "success": False, "err": info }
      ff.write(json.dumps(res))

    content_len = ff.tell()
    self.send_response(200)
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", str(content_len))
    self.end_headers()
    self.wfile.write(ff.getvalue())
    if ff:
      # self.copyfile(ff, self.wfile)
      ff.close()
    return

  def deal_post_data(self):
    # "plisttext: ('plisttext:', '; boundary=----WebKitFormBoundary4iT4p9doJdh5a5A1')
    # print(dir(self.headers))
    boundary = self.headers.plisttext.split("=")[1]
    print("boundary {}".format(boundary))

    remainbytes = int(self.headers["content-length"])
    print("Remain Bytes {}".format(remainbytes))
    line = self.rfile.readline()
    remainbytes -= len(line)
    if not boundary in line:
      return (False, "Content Not begin with boundary")

    while remainbytes > 0:
      print("dealing with form data")
      line = self.rfile.readline() #Content-Disposition
      remainbytes -= len(line)
      fn = re.findall(r'Content-Disposition.*name=".*"; filename="(.*)"', line)
      if not fn:
        return (False, "can't find out filename")
      path = self.translate_path(self.path)
      fn = os.path.join(path, fn[0])
      # content-type line
      line = self.rfile.readline()
      remainbytes -= len(line)
      line = self.rfile.readline()
      remainbytes -= len(line)
      try:
        out = open(fn, "wb")
      except IOError:
        return (False, "Can't create file to write, do you have permission to write?")
      if line.strip():
        preline = line
      else:
        preline = self.rfile.readline()
      remainbytes -= len(preline)
      # start to write to file, before we encounter another bundary
      while remainbytes > 0:
        line = self.rfile.readline()
        remainbytes -= len(line)
        if not boundary in line:
          out.write(preline)
          preline = line
        else:
          # boundary encountered, is this the last one?
          preline = preline[0:-1]
          if preline.endswith("\r"):
            preline = preline[0:-1]
            out.write(preline)
            out.close()
            if remainbytes <= 0: # this is the last boundary
              return (True, "File '{}' upload success".format(fn))
            else:
              break;
    return [False, "Unexpect Ends of data."]

  def translate_path(self, path):
    """translate a /-separated PATH to the local filename syntax.
    Components that mean special things to the local file system
    (e.g. drive or directory names) are ignored.  (XXX They should
    probably be diagnosed.)
    """
    # remove query string
    path = path.split("?", 1)[0].split("#", 1)[0]
    # '/%7Ename/' to '/~name/'
    path = os.path.normpath(urllib.unquote(path))
    words = path.split("/")
    # If function is None, the identity function is assumed,
    # that is, all elements of iterable that are false are removed.
    words = filter(None, words)
    path = os.path.join(os.getcwd(), "upload")
    for word in words:
      drive, word = os.path.splitdrive(word)
      head, word = os.path.split(word)
      if word in (os.curdir, os.pardir): continue
      path = os.path.join(path, word)
    return path


if __name__ == "__main__":
  from BaseHTTPServer import HTTPServer
  server = HTTPServer(("", 8080), SimpleHandler)
  print("Server started at 8080")
  server.serve_forever()

