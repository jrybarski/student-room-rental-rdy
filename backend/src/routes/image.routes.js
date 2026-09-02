const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth.middleware");

// Konfiguracja multer - gdzie zapisywać pliki
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    // Utwórz folder jeśli nie istnieje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unikalna nazwa: timestamp + oryginalna nazwa
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  },
});

// Filtr - tylko obrazy
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Dozwolone tylko pliki graficzne (jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});

// UPLOAD ZDJĘĆ DO MIESZKANIA (max 5 na raz)
router.post(
  "/apartment/:apartment_id",
  authMiddleware,
  upload.array("images", 5),
  (req, res) => {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Tylko właściciel może dodawać zdjęcia" });
    }

    const apartmentId = req.params.apartment_id;

    // Sprawdź czy mieszkanie należy do tego właściciela
    db.get(
      "SELECT * FROM apartments WHERE id = ? AND owner_id = ?",
      [apartmentId, req.user.id],
      (err, apartment) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!apartment) {
          // Usuń uploadowane pliki jeśli mieszkanie nie należy do użytkownika
          req.files?.forEach((f) => fs.unlinkSync(f.path));
          return res.status(403).json({ error: "To nie jest Twoje mieszkanie" });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: "Nie wybrano plików" });
        }

        // Zapisz info o zdjęciach do bazy
        const insertSql = `INSERT INTO apartment_images (apartment_id, filename, original_name) VALUES (?, ?, ?)`;
        const savedImages = [];

        req.files.forEach((file) => {
          db.run(
            insertSql,
            [apartmentId, file.filename, file.originalname],
            function (err) {
              if (!err) {
                savedImages.push({
                  id: this.lastID,
                  filename: file.filename,
                  original_name: file.originalname,
                });
              }
            }
          );
        });

        // Poczekaj chwilę i zwróć odpowiedź
        setTimeout(() => {
          res.json({
            message: `Dodano ${req.files.length} zdjęć`,
            images: savedImages,
          });
        }, 100);
      }
    );
  }
);

// POBIERZ ZDJĘCIA MIESZKANIA
router.get("/apartment/:apartment_id", (req, res) => {
  const sql = `SELECT * FROM apartment_images WHERE apartment_id = ? ORDER BY created_at`;
  db.all(sql, [req.params.apartment_id], (err, images) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(images);
  });
});

// USUŃ ZDJĘCIE (tylko właściciel)
router.delete("/:image_id", authMiddleware, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Tylko właściciel" });
  }

  // Sprawdź czy zdjęcie należy do mieszkania tego właściciela
  const sql = `
    SELECT ai.*, a.owner_id 
    FROM apartment_images ai
    JOIN apartments a ON ai.apartment_id = a.id
    WHERE ai.id = ?
  `;

  db.get(sql, [req.params.image_id], (err, image) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!image) return res.status(404).json({ error: "Zdjęcie nie znalezione" });
    if (image.owner_id !== req.user.id) {
      return res.status(403).json({ error: "To nie jest Twoje zdjęcie" });
    }

    // Usuń plik z dysku
    const filePath = path.join(__dirname, "../../uploads", image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Usuń z bazy
    db.run("DELETE FROM apartment_images WHERE id = ?", [req.params.image_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Zdjęcie usunięte" });
    });
  });
});

module.exports = router;
