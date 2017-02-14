#!/usr/bin/python

import requests

files = {'file': open('./app/img/logo-48.png', 'rb')}
r = requests.post('http://localhost:8080', files=files)
print(r.request.headers)