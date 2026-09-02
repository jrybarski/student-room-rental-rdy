const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../../../database/app.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Błąd połączenia z bazą:", err.message);
  } else {
    console.log("Połączono z bazą SQLite:", dbPath);
  }
});
db.serialize(() => {
  const fs = require("fs");
  const schemaPath = path.join(__dirname, "../../../database/schema.sql");

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema, (err) => {
      if (err) {
        console.error("Błąd podczas tworzenia tabel:", err.message);
      } else {
        console.log("Schemat bazy danych załadowany.");
      }
    });
  }
});

module.exports = db;
