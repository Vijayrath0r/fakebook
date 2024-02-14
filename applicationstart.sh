#!/bin/bash
service nginx start
cd /home/ec2-user/fakebook
pm2 kill
pm2 start src/index.js pm2
