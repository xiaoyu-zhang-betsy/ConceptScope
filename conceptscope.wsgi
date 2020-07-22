#!/usr/bin/python
import sys
import logging

activate_this = '/home/ubuntu/DocViewer/env/bin/activate_this.py'
with open(activate_this) as f:
    exec(f.read(), dict(__file__=activate_this))
    # execfile(activate_this, dict(__file__=activate_this))

logging.basicConfig(stream=sys.stderr)
sys.path.insert(0,"/var/www/html/DocViewer/")

from server import app as application
#application.secret_key = 'xiaoyu123'