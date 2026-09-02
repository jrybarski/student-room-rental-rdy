const express = require("express");
const router = express.Router();
const ResidenceRequest = require("../models/residenceRequest.model");
const authMiddleware = require("../middleware/auth.middleware");
const db = require("../config/db"); // ← DODAJ TO!

// Student wysyła wniosek
router.post("/:apartment_id", authMiddleware, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Tylko student może wysłać wniosek" });
  }

  ResidenceRequest.create(
    req.user.id,
    req.params.apartment_id,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Wniosek wysłany!", request: result });
    }
  );
});

// Właściciel pobiera swoje wnioski
router.get("/my-pending", authMiddleware, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Tylko właściciel" });
  }

  // Pobierz mieszkania właściciela
  db.all(
    `SELECT id FROM apartments WHERE owner_id = ?`,
    [req.user.id],
    (err, apartments) => {
      if (err) return res.status(500).json({ error: err.message });

      const apartmentIds = apartments.map((a) => a.id);
      if (apartmentIds.length === 0) return res.json([]);

      const placeholders = apartmentIds.map(() => "?").join(",");
      const sql = `
      SELECT rr.id, rr.student_id, u.name as student_name, u.email, rr.apartment_id, a.title, a.city
      FROM residence_requests rr
      JOIN users u ON rr.student_id = u.id
      JOIN apartments a ON rr.apartment_id = a.id
      WHERE rr.apartment_id IN (${placeholders}) AND rr.status = 'pending'
    `;

      db.all(sql, apartmentIds, (err, requests) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(requests);
      });
    }
  );
});

// Właściciel akceptuje/odrzuca
router.post("/respond/:request_id", authMiddleware, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Tylko właściciel" });
  }

  const { action } = req.body; // 'accept' lub 'reject'

  if (action === "accept") {
    ResidenceRequest.acceptAndAssign(req.params.request_id, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "Wniosek zaakceptowany! Student jest teraz lokatorem.",
      });
    });
  } else if (action === "reject") {
    ResidenceRequest.updateStatus(req.params.request_id, "rejected", (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Wniosek odrzucony." });
    });
  } else {
    res.status(400).json({ error: "Nieprawidłowa akcja" });
  }
});
// Pobierz moje wysłane wnioski (dla studenta)
router.get("/my-requests", authMiddleware, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Tylko student" });
  }

  const sql = `
    SELECT rr.id, rr.apartment_id, rr.status, a.title, a.city, a.address
    FROM residence_requests rr
    JOIN apartments a ON rr.apartment_id = a.id
    WHERE rr.student_id = ?
  `;

  db.all(sql, [req.user.id], (err, requests) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(requests);
  });
});

router.get("/apartment/:apartment_id", (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email 
    FROM residents r
    JOIN users u ON r.user_id = u.id
    WHERE r.apartment_id = ?
  `;

  db.all(sql, [req.params.apartment_id], (err, residents) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(residents);
  });
});
module.exports = router;
