FROM node:18

WORKDIR /app

# Αντιγραφή των package.json και package-lock.json (αν υπάρχει)
COPY package.json ./

# Εγκατάσταση των dependencies
RUN npm install

# Αντιγραφή όλων των αρχείων του project
COPY . .

# Δημιουργία του Prisma client
RUN npx prisma generate

# Port εκθέσης της εφαρμογής
EXPOSE 5000

CMD ["node", "server.js"]