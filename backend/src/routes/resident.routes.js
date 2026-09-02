const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/apartment/:apartment_id", (req, res) => {
  const sql = `SELECT u.id as user_id, u.username, u.name, u.email, u.avatar, r.id FROM residents r JOIN users u ON r.user_id = u.id WHERE r.apartment_id = ?`;
  db.all(sql, [req.params.apartment_id], (err, residents) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(residents);
  });
});

router.get("/my-apartment", authMiddleware, (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: "Tylko student" });

  db.get(
    `SELECT a.id, a.title, a.address, a.city, a.price, a.area, a.has_balcony, a.pets_allowed, a.has_parking FROM residents r JOIN apartments a ON r.apartment_id = a.id WHERE r.user_id = ?`,
    [req.user.id],
    (err, apartment) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!apartment) return res.json({ apartment: null, roommates: [] });

      db.all(
        `SELECT u.id, u.username, u.name, u.avatar, CASE WHEN rat.id IS NOT NULL THEN 1 ELSE 0 END as already_rated FROM residents r JOIN users u ON r.user_id = u.id LEFT JOIN ratings rat ON rat.from_user_id = ? AND rat.to_user_id = u.id WHERE r.apartment_id = ? AND r.user_id != ?`,
        [req.user.id, apartment.id, req.user.id],
        (err, roommates) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ apartment, roommates });
        }
      );
    }
  );
});

router.delete("/leave", authMiddleware, (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: "Tylko student może opuścić mieszkanie" });

  db.get(`SELECT r.id, r.apartment_id FROM residents r WHERE r.user_id = ?`, [req.user.id], (err, resident) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!resident) return res.status(404).json({ error: "Nie jesteś mieszkańcem żadnego mieszkania" });

    const apartmentId = resident.apartment_id;

    db.run(`DELETE FROM residents WHERE user_id = ?`, [req.user.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run(`DELETE FROM residence_requests WHERE student_id = ? AND apartment_id = ?`, [req.user.id, apartmentId]);

      db.get(`SELECT COUNT(*) as count FROM residents WHERE apartment_id = ?`, [apartmentId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count === 0) db.run(`UPDATE apartments SET is_rented = 0 WHERE id = ?`, [apartmentId]);
        res.json({ message: "Opuściłeś mieszkanie pomyślnie." });
      });
    });
  });
});

module.exports = router;
