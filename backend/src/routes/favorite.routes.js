const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/auth.middleware");

// Dodaj do ulubionych
router.post("/:apartment_id", authMiddleware, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Tylko student może dodawać do ulubionych" });
  }

  const sql = `INSERT OR IGNORE INTO favorites (user_id, apartment_id) VALUES (?, ?)`;
  db.run(sql, [req.user.id, req.params.apartment_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Dodano do ulubionych", id: this.lastID });
  });
});

// Usuń z ulubionych
router.delete("/:apartment_id", authMiddleware, (req, res) => {
  const sql = `DELETE FROM favorites WHERE user_id = ? AND apartment_id = ?`;
  db.run(sql, [req.user.id, req.params.apartment_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Usunięto z ulubionych" });
  });
});

// Pobierz ulubione użytkownika
router.get("/", authMiddleware, (req, res) => {
  const sql = `
    SELECT a.*, u.name as owner_name,
      (SELECT filename FROM apartment_images WHERE apartment_id = a.id LIMIT 1) as image
    FROM favorites f
    JOIN apartments a ON f.apartment_id = a.id
    JOIN users u ON a.owner_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Sprawdź czy pokój jest w ulubionych
router.get("/check/:apartment_id", authMiddleware, (req, res) => {
  const sql = `SELECT id FROM favorites WHERE user_id = ? AND apartment_id = ?`;
  db.get(sql, [req.user.id, req.params.apartment_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ isFavorite: !!row });
  });
});

module.exports = router;
