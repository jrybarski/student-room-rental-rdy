const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/auth.middleware");
const db = require("../config/db");

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Dozwolone tylko pliki graficzne"), ok);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

const isValidUsername = (u) => /^[a-z0-9_]{3,20}$/.test(u);

// Rejestracja
router.post("/register", (req, res) => {
  const { email, password, username, name, role, age, gender, status, phone, bio } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: "Email, hasło i login są wymagane" });
  }
  const isValidPhone = (p) => !p || /^[\d\s\+\-\(\)]{7,20}$/.test(p);
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: "Login: tylko małe litery, cyfry i _ (3–20 znaków)" });
  }

  if (!isValidPhone(phone)) return res.status(400).json({ error: "Nieprawidłowy format numeru telefonu" });

  User.findByEmail(email, (err, existingEmail) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existingEmail) return res.status(400).json({ error: "Email już zajęty" });

    User.findByUsername(username, (err, existingUsername) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existingUsername) return res.status(400).json({ error: "Login jest już zajęty" });

      User.create({ email, password, username, name, role, age, gender, status, phone, bio }, (err, newUser) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Użytkownik utworzony", user: newUser });
      });
    });
  });
});

router.get("/test", (req, res) => res.json({ message: "Auth route działa!" }));

router.get("/me", authMiddleware, (req, res) => {
  User.findById(req.user.id, (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Użytkownik nie znaleziony" });
    res.json({ user });
  });
});

// Logowanie
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email i hasło są wymagane" });

  User.findByEmail(email, (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role },
        process.env.JWT_SECRET || "tajnykluczdozmiany",
        { expiresIn: "24h" }
      );

      res.json({
        message: "Zalogowano!",
        token,
        user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role, age: user.age, gender: user.gender, status: user.status, phone: user.phone, avatar: user.avatar, bio: user.bio },
      });
    });
  });
});

// Zmiana hasła
router.put("/change-password", authMiddleware, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ error: "Wszystkie pola są wymagane" });
  if (newPassword !== confirmPassword) return res.status(400).json({ error: "Nowe hasła nie są identyczne" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Nowe hasło musi mieć minimum 6 znaków" });
  if (currentPassword === newPassword) return res.status(400).json({ error: "Nowe hasło musi być inne niż obecne" });

  User.findByIdWithPassword(req.user.id, (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Użytkownik nie znaleziony" });

    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(401).json({ error: "Obecne hasło jest nieprawidłowe" });

      User.updatePassword(req.user.id, newPassword, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Hasło zostało zmienione pomyślnie" });
      });
    });
  });
});

// Pobierz profil po USERNAME — /api/auth/profile/:username
router.get("/profile/:username", (req, res) => {
  db.get(
    `SELECT id, username, name, role, age, gender, status, avatar, bio, created_at FROM users WHERE username = ?`,
    [req.params.username],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "Użytkownik nie znaleziony" });
      res.json(user);
    }
  );
});

// Aktualizuj profil
router.put("/profile", authMiddleware, (req, res) => {
  const { name, age, gender, status, bio } = req.body;
  User.findById(req.user.id, (err, currentUser) => {
    if (err) return res.status(500).json({ error: err.message });
    const updateData = {
      name: name || currentUser.name, age: age || currentUser.age,
      gender: gender || currentUser.gender, status: status || currentUser.status,
      bio: bio || currentUser.bio, avatar: currentUser.avatar,
    };
    User.updateProfile(req.user.id, updateData, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Profil zaktualizowany" });
    });
  });
});

// Upload avatara
router.post("/avatar", authMiddleware, avatarUpload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nie wybrano pliku" });
  const avatarPath = `avatars/${req.file.filename}`;
  User.updateAvatar(req.user.id, avatarPath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Avatar zaktualizowany", avatar: avatarPath });
  });
});

module.exports = router;
