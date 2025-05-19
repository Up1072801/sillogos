# 1️⃣ Χρήση επίσημου Node.js image
FROM node:18

# 2️⃣ Ορισμός του working directory
WORKDIR /app

# 3️⃣ Αντιγραφή package.json και εγκατάσταση dependencies για frontend
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 4️⃣ Αντιγραφή και build του frontend
COPY public/ public/
COPY src/ src/
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# 5️⃣ Εγκατάσταση και ρύθμιση του backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# 6️⃣ Αντιγραφή του backend κώδικα
COPY backend/ ./

# 7️⃣ Εγκατάσταση nginx
RUN apt-get update && apt-get install -y nginx

# 8️⃣ Ρύθμιση nginx για να δείχνει στο τοπικό backend
COPY nginx.conf.monolith /etc/nginx/conf.d/default.conf

# 9️⃣ Αντιγραφή του React build στον nginx
RUN cp -r /app/build/* /usr/share/nginx/html/

# 🔟 Εξαγωγή των ports
EXPOSE 80 5000

# 1️⃣1️⃣ Startup script
COPY start-services.sh /start-services.sh
RUN chmod +x /start-services.sh

# 1️⃣2️⃣ Εκκίνηση του nginx και του Node.js server
CMD ["/start-services.sh"]
