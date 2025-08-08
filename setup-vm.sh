#!/bin/bash
# Script tự động cài đặt Docker, MongoDB và tạo file .env cho backend
# Dùng cho Ubuntu VM trên Google Compute Engine

set -e

# Cài đặt Docker nếu chưa có
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  sudo apt-get update
  sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo \ 
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io
  sudo usermod -aG docker $USER
fi

echo "Docker installed."

# Cài đặt MongoDB nếu chưa có
if ! command -v mongod &> /dev/null; then
  echo "Installing MongoDB..."
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-org
  sudo systemctl start mongod
  sudo systemctl enable mongod
fi

echo "MongoDB installed."

echo "Setup hoàn tất!"
