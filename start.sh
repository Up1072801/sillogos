#!/bin/sh

# Set a default port if not provided
PORT=${PORT:-80}

# Δημιουργία nginx.conf με τη σωστή θύρα
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
}
EOF

# Εκκίνηση supervisor για να διαχειριστεί τις υπηρεσίες
supervisord -c /etc/supervisor.d/supervisord.ini