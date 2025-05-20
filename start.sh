#!/bin/bash
set -e

# Run database migrations
cd /app/backend
npx prisma migrate deploy

# Δημιουργία της παραμετροποίησης nginx με σταθερή θύρα 80
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
        index index.html index.htm;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:10000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        proxy_pass http://127.0.0.1:10000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Εκκίνηση supervisor
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf