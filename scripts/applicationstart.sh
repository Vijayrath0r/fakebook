#!/bin/bash

cd /home/ec2-user/fakebook
pm2 kill
pm2 start index.js
