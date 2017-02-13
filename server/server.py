#!/usr/bin/env python
# Simple HTTP Server With Upload.

import os
from BaseHTTPServer import BaseHTTPRequestHandler
from urlparse import urlparse
# import urllib # parse url
import cgi
import shutil # file operation
import mimetypes
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

  def do_POST_(self):
    # parse the form data posed
    form = cgi.FieldStorage(
      fp=self.rfile,
      headers=self.headers,
      environ={"REQUEST_METHOD":"POST",
        "CONTENT_TYPE": self.headers["Content-Type"]
      })
    # begin the response
    self.send_response(200)
    self.end_headers()
    self.wfile.write("user-agent: {}\n".format(str(self.headers["user-agent"])))
    self.wfile.write("form data:\n")

    for field in form.keys():
      print("field:", field)
      field_item = form[field]
      if field_item.filename:
        # the field contains an upload file
        file_data = field_item.file.read()
        file_len = len(file_data)
        del file_data
        self.wfile.write("\tUpload {} as '{}'({} bytes)\n".format(field, field_item.filename, file_len))
      else:
        # regular form value
        self.wfile.write("\t{}={}\n".format(field, form[field].value))
      return

  def do_POST(self):
    r, info = self.deal_post_data()
    print(r, info, "by: ", self.client_address)
    ff = StringIO()
    if r:
      ff.write(json.dump({ "success": True }))
    else:
      ff.write('{ "success": false }')

    content_len = ff.tell()
    self.send_response(200)
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", str(content_len))
    self.end_headers()
    self.wfile.write(ff.getvalue())
    if ff:
      # self.copyfile(ff, self.wfile)
      ff.close()

  def deal_post_data(self):
    # print(self.headers)
    # "plisttext: ('plisttext:', '; boundary=----WebKitFormBoundary4iT4p9doJdh5a5A1')
    boundary = self.headers.plisttext.split("=")[1]
    print("boundary {}".format(boundary))

    remainbytes = int(self.headers["content-length"])
    print("Remain Bytes {}".format(remainbytes))



    return [False, "--"]

  def translate_path(self, path):
    pass


  def copyfile(self, source, outputfile):
    pass


if __name__ == "__main__":
  from BaseHTTPServer import HTTPServer
  server = HTTPServer(("localhost", 8080), SimpleHandler)
  print("Server started at 8080")
  server.serve_forever()

