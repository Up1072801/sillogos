# Χρήση επίσημου Node.js image
FROM node:18

# Ορισμός του working directory μέσα στο container
WORKDIR /app

# Αντιγραφή package.json και package-lock.json
COPY package*.json ./

# Εγκατάσταση dependencies
RUN npm install --force

# Αντιγραφή όλων των αρχείων στο container
COPY . .

# Εξαγωγή port (αλλά να οριστεί στο docker-compose)
EXPOSE 3000

# Εκκίνηση του React App
CMD ["npm", "start"]
