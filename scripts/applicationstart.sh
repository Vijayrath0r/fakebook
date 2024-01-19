#!/bin/bash

cd /home/ubuntu/fakebook
pm2 kill
pm2 start index.js
