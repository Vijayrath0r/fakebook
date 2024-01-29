#!/bin/bash

cd /home/ec2-user/fakebook
pm2 kill
pm2 start src/index.js
sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000
