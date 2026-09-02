const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./config/db");
require("dotenv").config();
const apartmentRoutes = require("./routes/apartment.routes");
const ratingRoutes = require("./routes/rating.routes");
const residenceRoutes = require("./routes/residence.routes");
const residentRoutes = require("./routes/resident.routes");
const imageRoutes = require("./routes/image.routes");
const favoriteRoutes = require("./routes/favorite.routes");

// DODAJ TO:
const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(cors());
app.use(express.json());

// Serwowanie zdjęć jako pliki statyczne
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// DODAJ TO:
app.use("/api/auth", authRoutes);
app.use("/api/apartments", apartmentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/residence", residenceRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/favorites", favoriteRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API działa!" });
});

app.get("/test-db", (req, res) => {
  db.get("SELECT sqlite_version() AS version", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ version: row.version });
  });
});
// TEST: Pobierz wszystkich użytkowników (TYLKO DO TESTÓW!)
app.get("/api/users", (req, res) => {
  db.all("SELECT id, email, name, role FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
