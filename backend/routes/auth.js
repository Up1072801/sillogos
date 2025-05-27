const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // Χρήση μεταβλητής περιβάλλοντος στην παραγωγή!

// Εισαγωγή αρχικών χρηστών
async function ensureAdminExists() {
  // Έλεγχος αν υπάρχει διαχειριστής
  const adminCount = await prisma.user.count({
    where: { role: 'admin' }
  });
  
  if (adminCount === 0) {
    // Δημιουργία αρχικού διαχειριστή
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        role: 'admin'
      }
    });
    console.log('Δημιουργήθηκε ο αρχικός λογαριασμός διαχειριστή');
  }

  // Έλεγχος αν υπάρχει απλός χρήστης
  const userCount = await prisma.user.count({
    where: { 
      role: 'user',
      username: 'user'
    }
  });
  
  if (userCount === 0) {
    // Δημιουργία αρχικού απλού χρήστη
    const userPassword = await bcrypt.hash('user123', 10);
    await prisma.user.create({
      data: {
        username: 'user',
        password: userPassword,
        role: 'user'
      }
    });
    console.log('Δημιουργήθηκε ο αρχικός λογαριασμός χρήστη');
  }
}

// Εκτέλεση κατά την εκκίνηση
ensureAdminExists().catch(err => {
  console.error('Σφάλμα κατά τη δημιουργία του αρχικού διαχειριστή:', err);
});

// Middleware για έλεγχο αυθεντικοποίησης
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log("Auth Header:", authHeader);
  console.log("Token extracted:", token ? "Valid token" : "No token");
  
  if (!token) {
    return res.status(401).json({ error: 'Απαιτείται αυθεντικοποίηση' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(403).json({ error: 'Μη έγκυρο ή ληγμένο token' });
    }
    req.user = user;
    next();
  });
};

// Middleware για έλεγχο δικαιωμάτων διαχειριστή
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Απαιτούνται δικαιώματα διαχειριστή' });
  }
  next();
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Εύρεση χρήστη
    const user = await prisma.user.findUnique({
      where: { username }
    });

    // Έλεγχος ύπαρξης χρήστη
    if (!user) {
      return res.status(401).json({ error: 'Λανθασμένο όνομα χρήστη ή κωδικός πρόσβασης' });
    }

    // Επαλήθευση κωδικού
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Λανθασμένο όνομα χρήστη ή κωδικός πρόσβασης' });
    }

    // Δημιουργία JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Σφάλμα κατά τη σύνδεση:', error);
    res.status(500).json({ error: 'Σφάλμα κατά τη σύνδεση' });
  }
});

// Αλλαγή κωδικού
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    
    // Έλεγχος αν οι νέοι κωδικοί ταιριάζουν
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'Οι νέοι κωδικοί δεν ταιριάζουν' });
    }
    
    // Έλεγχος πολυπλοκότητας κωδικού
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Ο νέος κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες' });
    }

    // Εύρεση χρήστη
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Επαλήθευση τρέχοντος κωδικού
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ο τρέχων κωδικός είναι λανθασμένος' });
    }

    // Κρυπτογράφηση νέου κωδικού
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Ενημέρωση κωδικού
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Ο κωδικός άλλαξε με επιτυχία' });
  } catch (error) {
    console.error('Σφάλμα κατά την αλλαγή κωδικού:', error);
    res.status(500).json({ error: 'Σφάλμα κατά την αλλαγή κωδικού' });
  }
});

// Διαχείριση χρηστών (μόνο για διαχειριστές)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Σφάλμα κατά την ανάκτηση χρηστών:', error);
    res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση χρηστών' });
  }
});

// Δημιουργία νέου χρήστη (μόνο για διαχειριστές)
router.post('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Έλεγχος αν το username υπάρχει ήδη
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Το όνομα χρήστη υπάρχει ήδη' });
    }
    
    // Έλεγχος πολυπλοκότητας κωδικού
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες' });
    }
    
    // Κρυπτογράφηση κωδικού
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Δημιουργία χρήστη
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'user'
      }
    });
    
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    console.error('Σφάλμα κατά τη δημιουργία χρήστη:', error);
    res.status(500).json({ error: 'Σφάλμα κατά τη δημιουργία χρήστη' });
  }
});

// Επαναφορά κωδικού χρήστη (μόνο για διαχειριστές)
router.put('/users/:id/reset-password', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // Έλεγχος πολυπλοκότητας κωδικού
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες' });
    }
    
    // Έλεγχος ύπαρξης χρήστη
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Ο χρήστης δεν βρέθηκε' });
    }
    
    // Κρυπτογράφηση νέου κωδικού
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Ενημέρωση κωδικού
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });
    
    res.json({ message: 'Ο κωδικός άλλαξε με επιτυχία' });
  } catch (error) {
    console.error('Σφάλμα κατά την επαναφορά κωδικού:', error);
    res.status(500).json({ error: 'Σφάλμα κατά την επαναφορά κωδικού' });
  }
});

// Διαγραφή χρήστη (μόνο για διαχειριστές)
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Έλεγχος ύπαρξης χρήστη
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Ο χρήστης δεν βρέθηκε' });
    }
    
    // Αποτροπή διαγραφής του ίδιου του χρήστη
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Δεν μπορείτε να διαγράψετε τον εαυτό σας' });
    }
    
    // Διαγραφή χρήστη
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Ο χρήστης διαγράφηκε με επιτυχία' });
  } catch (error) {
    console.error('Σφάλμα κατά τη διαγραφή χρήστη:', error);
    res.status(500).json({ error: 'Σφάλμα κατά τη διαγραφή χρήστη' });
  }
});

module.exports = { router, authenticateToken, isAdmin };