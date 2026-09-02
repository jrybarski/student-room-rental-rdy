const express = require("express");
const router = express.Router();
const Rating = require("../models/rating.model");
const authMiddleware = require("../middleware/auth.middleware");

// DODAJ OCENĘ (tylko zalogowany student)
router.post("/", authMiddleware, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Tylko student może oceniać" });
  }

  const ratingData = {
    from_user_id: req.user.id,
    to_user_id: req.body.to_user_id,
    apartment_id: req.body.apartment_id,
    cleanliness: req.body.cleanliness,
    conflict_free: req.body.conflict_free,
    sociability: req.body.sociability,
    comment: req.body.comment || null,
  };

  // Walidacja
  if (!ratingData.to_user_id || !ratingData.apartment_id) {
    return res.status(400).json({ error: "Brak wymaganych pól" });
  }

  if (ratingData.from_user_id === parseInt(ratingData.to_user_id)) {
    return res.status(400).json({ error: "Nie możesz ocenić sam siebie" });
  }

  Rating.create(ratingData, (err, rating) => {
    if (err) {
      if (err.alreadyRated) {
        return res.status(400).json({ error: err.message, alreadyRated: true });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      message: "Ocena dodana!", 
      rating 
    });
  });
});

// POBIERZ OCENY DLA MIESZKANIA
router.get("/apartment/:id", (req, res) => {
  Rating.findByApartment(req.params.id, (err, ratings) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(ratings);
  });
});

// ŚREDNIA OCENA UŻYTKOWNIKA
router.get("/user/:id", (req, res) => {
  Rating.findAverageByUser(req.params.id, (err, avg) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      avg || {
        avg_cleanliness: 0,
        avg_conflict_free: 0,
        avg_sociability: 0,
        ratings_count: 0,
      }
    );
  });
});

// WSZYSTKIE OCENY UŻYTKOWNIKA
router.get("/user/:id/all", (req, res) => {
  Rating.findByUser(req.params.id, (err, ratings) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(ratings);
  });
});

// POBIERZ WSPÓŁLOKATORÓW DO OCENY (dla zalogowanego studenta)
router.get("/roommates", authMiddleware, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Tylko student" });
  }

  Rating.getRoommatesForRating(req.user.id, (err, roommates) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(roommates);
  });
});

module.exports = router;
