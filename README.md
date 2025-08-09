# TikTok Clone Backend - Deployment & Development Guide

## 1. Cấu trúc dự án
- Node.js (TypeScript) backend
- MongoDB (chạy bằng Docker)
- Docker Compose để đồng bộ backend & database
- CI/CD với GitHub Actions, Artifact Registry (Google Cloud)
- Nginx reverse proxy + SSL (Certbot)

## 2. Chạy local bằng Docker Compose

### Xoá container & image MongoDB cũ (nếu có)
```sh
docker rm -f mongodb
docker rmi mongo
```

### Build & chạy toàn bộ hệ thống
```sh
docker compose up -d --build
```

- Backend truy cập MongoDB qua URI: `mongodb://mongodb:27017/tiktok_clone`
- Sửa file `.env` cho đúng biến môi trường (ví dụ: `MONGODB_URI`)

### Xem log
```sh
docker compose logs -f backend
```

## 3. Deploy production (Google Cloud Compute Engine)

### 3.1. Build & push image backend lên Artifact Registry
- Được tự động hoá qua GitHub Actions (`.github/workflows/deploy-gce.yml`)
- Image backend sẽ được pull về VM và chạy bằng Docker Compose

### 3.2. Cài đặt trên VM (lần đầu)
```sh
# Cài Docker, Docker Compose
sudo apt update && sudo apt install -y docker.io docker-compose

# Clone code về VM
# Cấu hình file .env (bằng GitHub Secrets hoặc thủ công)
```

### 3.3. Chạy ứng dụng trên VM
```sh
docker compose pull
# Hoặc build lại nếu cần:
docker compose up -d --build
```

### 3.4. Nginx reverse proxy + SSL
- Cài Nginx, Certbot trên VM
- Cấu hình Nginx proxy tới backend (port 5000)
- Cấp SSL miễn phí qua Certbot

## 4. Một số lệnh hữu ích

- Xem log backend: `docker compose logs -f backend`
- Xem log MongoDB: `docker compose logs -f mongodb`
- Dừng toàn bộ: `docker compose down`
- Xoá volume data MongoDB: `docker volume rm backend_mongo_data`

## 5. CI/CD
- Tự động build, push image backend lên Artifact Registry khi push lên branch main
- Tự động deploy lên VM qua SSH

## 6. Liên hệ
- Nếu gặp lỗi, kiểm tra log backend, log MongoDB, log Nginx
- Đảm bảo file `.env` đúng, các port không bị trùng

---

> **Lưu ý:**
> - Thay `<your-backend-image>` trong `docker-compose.yml` bằng tên image backend thực tế (ví dụ: `us-west1-docker.pkg.dev/<project-id>/<repo>/tiktok-backend:latest`)
> - Đảm bảo các secrets, credentials không bị lộ ra ngoài.
