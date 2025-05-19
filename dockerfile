# 1️⃣ Χρήση επίσημου Node.js image για το build
FROM node:18 AS build

# 2️⃣ Ορισμός του working directory
WORKDIR /app

# 3️⃣ Αντιγραφή package.json και εγκατάσταση dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 4️⃣ Αντιγραφή του υπόλοιπου κώδικα και δημιουργία production build
COPY public/ public/
COPY src/ src/
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# 5️⃣ Χρήση ενός ελαφριού Nginx image για να σερβίρει το site
FROM nginx:alpine

# 6️⃣ Αντιγραφή του built React app στον Nginx
COPY --from=build /app/build /usr/share/nginx/html

# 7️⃣ Αντιγραφή custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 8️⃣ Εξαγωγή του Port 80
EXPOSE 80

# 9️⃣ Εκκίνηση του Nginx server
CMD ["nginx", "-g", "daemon off;"]
