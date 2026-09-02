const express = require("express");
const router = express.Router();
const db = require("../config/db");

// POBIERZ LOKATORÓW DLA MIESZKANIA
router.get("/apartment/:apartment_id", (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email 
    FROM residents r
    JOIN users u ON r.user_id = u.id
    WHERE r.apartment_id = ?
  `;

  db.all(sql, [req.params.apartment_id], (err, residents) => {
    if (err) {
      console.error("Błąd pobierania lokatorów:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(residents);
  });
});

module.exports = router;
