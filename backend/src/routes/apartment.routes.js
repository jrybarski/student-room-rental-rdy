const express = require("express");
const router = express.Router();
const Apartment = require("../models/apartment.model");
const authMiddleware = require("../middleware/auth.middleware");
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Konfiguracja multer dla zdjęć mieszkań
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/apartments");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `apt-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(ok ? null : new Error("Dozwolone tylko pliki graficzne"), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB na zdjęcie
});

// POPULARNE MIASTA
router.get("/cities/popular", (req, res) => {
  const sql = `SELECT city, COUNT(*) as count FROM apartments WHERE is_rented = 0 GROUP BY city ORDER BY count DESC LIMIT 10`;
  db.all(sql, [], (err, cities) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(cities);
  });
});

// WYSZUKAJ MIASTA (autocomplete)
router.get("/cities/search", (req, res) => {
  const query = req.query.q || '';
  const sql = `SELECT DISTINCT city, COUNT(*) as count FROM apartments WHERE city LIKE ? AND is_rented = 0 GROUP BY city ORDER BY count DESC LIMIT 10`;
  db.all(sql, [`%${query}%`], (err, cities) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(cities);
  });
});

// DODAJ OGŁOSZENIE — obsługuje zarówno JSON jak i form-data (z opcjonalnymi zdjęciami)
router.post("/", authMiddleware, upload.array("images", 5), (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Tylko właściciel może dodawać pokoje" });
  }

  // req.body działa teraz zarówno dla JSON jak i form-data
  const { title, address, city, price, area, has_balcony, pets_allowed, has_parking, description } = req.body;

  if (!title || !address || !city || !price) {
    return res.status(400).json({ error: "Pola title, address, city, price są wymagane" });
  }

  const apartmentData = {
    owner_id: req.user.id,
    title,
    address,
    city,
    price: parseFloat(price),
    area: area ? parseFloat(area) : null,
    has_balcony: has_balcony === true || has_balcony === 'true' || has_balcony === '1' ? 1 : 0,
    pets_allowed: pets_allowed === true || pets_allowed === 'true' || pets_allowed === '1' ? 1 : 0,
    has_parking: has_parking === true || has_parking === 'true' || has_parking === '1' ? 1 : 0,
    description: description || null,
  };

  Apartment.create(apartmentData, (err, apartment) => {
    if (err) return res.status(500).json({ error: err.message });

    // Jeśli wysłano zdjęcia — zapisz je do bazy
    if (req.files && req.files.length > 0) {
      const roomId = apartment.id;
      const stmt = db.prepare(`INSERT INTO apartment_images (apartment_id, filename, original_name) VALUES (?, ?, ?)`);
      req.files.forEach((file) => {
        stmt.run([roomId, `apartments/${file.filename}`, file.originalname]);
      });
      stmt.finalize();
    }

    res.status(201).json({ message: "Pokój dodany!", apartment });
  });
});

// POBIERZ WSZYSTKIE OGŁOSZENIA (z filtrami)
router.get("/", (req, res) => {
  const {
    city, minPrice, maxPrice, minArea, maxArea, hasBalcony, petsAllowed, hasParking,
    residentMinAge, residentMaxAge, residentGender, residentStatus
  } = req.query;

  let sql = `
    SELECT DISTINCT a.*, u.name as owner_name,
      (SELECT filename FROM apartment_images WHERE apartment_id = a.id LIMIT 1) as image
    FROM apartments a
    JOIN users u ON a.owner_id = u.id
  `;

  const conditions = ["a.is_rented = 0"];
  const params = [];

  if (residentMinAge || residentMaxAge || residentGender || residentStatus) {
    sql = `
      SELECT DISTINCT a.*, u.name as owner_name,
        (SELECT filename FROM apartment_images WHERE apartment_id = a.id LIMIT 1) as image
      FROM apartments a
      JOIN users u ON a.owner_id = u.id
      LEFT JOIN residents r ON r.apartment_id = a.id
      LEFT JOIN users ru ON r.user_id = ru.id
    `;
    if (residentMinAge) { conditions.push("(ru.age IS NULL OR ru.age >= ?)"); params.push(parseInt(residentMinAge)); }
    if (residentMaxAge) { conditions.push("(ru.age IS NULL OR ru.age <= ?)"); params.push(parseInt(residentMaxAge)); }
    if (residentGender) {
      const genders = residentGender.split(',');
      if (genders.length > 0 && genders.length < 3) {
        conditions.push(`(ru.gender IS NULL OR ru.gender IN (${genders.map(() => '?').join(',')}))`);
        params.push(...genders);
      }
    }
    if (residentStatus) {
      const statuses = residentStatus.split(',');
      if (statuses.length > 0 && statuses.length < 3) {
        conditions.push(`(ru.status IS NULL OR ru.status IN (${statuses.map(() => '?').join(',')}))`);
        params.push(...statuses);
      }
    }
  }

  if (city) { conditions.push("LOWER(a.city) LIKE LOWER(?)"); params.push(`%${city}%`); }
  if (minPrice) { conditions.push("a.price >= ?"); params.push(parseFloat(minPrice)); }
  if (maxPrice) { conditions.push("a.price <= ?"); params.push(parseFloat(maxPrice)); }
  if (minArea) { conditions.push("a.area >= ?"); params.push(parseFloat(minArea)); }
  if (maxArea) { conditions.push("a.area <= ?"); params.push(parseFloat(maxArea)); }
  if (hasBalcony === 'true' || hasBalcony === '1') conditions.push("a.has_balcony = 1");
  if (petsAllowed === 'true' || petsAllowed === '1') conditions.push("a.pets_allowed = 1");
  if (hasParking === 'true' || hasParking === '1') conditions.push("a.has_parking = 1");

  sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY a.created_at DESC";

  db.all(sql, params, (err, apartments) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(apartments);
  });
});

// POBIERZ POJEDYNCZE OGŁOSZENIE
router.get("/:id", (req, res) => {
  Apartment.findById(req.params.id, (err, apartment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!apartment) return res.status(404).json({ error: "Nie znaleziono" });
    res.json(apartment);
  });
});

// POBIERZ TYLKO MOJE POKOJE (dla właściciela)
router.get("/my/list", authMiddleware, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Tylko właściciel" });
  }
  Apartment.findByOwner(req.user.id, (err, apartments) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(apartments);
  });
});

// USUŃ OGŁOSZENIE
router.delete("/:id", authMiddleware, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Tylko właściciel" });
  }
  db.get("SELECT * FROM apartments WHERE id = ? AND owner_id = ?", [req.params.id, req.user.id], (err, apt) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!apt) return res.status(403).json({ error: "To nie Twoje ogłoszenie" });
    db.run("DELETE FROM apartments WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Ogłoszenie usunięte" });
    });
  });
});

module.exports = router;
