FROM node:18 AS build

WORKDIR /app

# Αντιγραφή των package.json και package-lock.json
COPY package*.json ./

# Εγκατάσταση των dependencies
RUN npm install

# Αντιγραφή όλων των αρχείων του project
COPY public/ public/
COPY src/ src/

# Δημιουργία environment μεταβλητής για το API URL
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build της εφαρμογής
RUN npm run build

# Δεύτερο stage με nginx για production
FROM nginx:alpine

# Αντιγραφή των build αρχείων
COPY --from=build /app/build /usr/share/nginx/html

# Αντιγραφή custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]