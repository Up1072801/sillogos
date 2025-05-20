#!/bin/bash
set -e

# Run database migrations
cd /app/backend
npx prisma migrate deploy

# Χρήση της PORT που παρέχει το Render ή 80 ως προεπιλογή
PORT=${PORT:-80}

# Δημιουργία της παραμετροποίησης nginx με την σωστή θύρα
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${PORT};
    
    # Εξυπηρέτηση των στατικών αρχείων του React
    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
        index index.html index.htm;
    }
    
    # Προώθηση των API αιτημάτων στον backend server
    location /api/ {
        proxy_pass http://127.0.0.1:10000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint - εκτεθειμένο απευθείας
    location /health {
        proxy_pass http://127.0.0.1:10000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Εκκίνηση supervisor με το σωστό μονοπάτι
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf