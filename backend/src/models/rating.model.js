const db = require("../config/db");

const Rating = {
  create: (data, callback) => {
    const {
      from_user_id,
      to_user_id,
      apartment_id,
      cleanliness,
      conflict_free,
      sociability,
      comment,
    } = data;
    
    // Sprawdź czy już istnieje ocena od tego użytkownika
    const checkSql = `SELECT id FROM ratings WHERE from_user_id = ? AND to_user_id = ?`;
    db.get(checkSql, [from_user_id, to_user_id], (err, existing) => {
      if (err) return callback(err);
      
      if (existing) {
        // Ocena już istnieje - nie można zmienić
        return callback({ alreadyRated: true, message: 'Już oceniłeś tego użytkownika. Ocena jest jednorazowa.' });
      }
      
      // Utwórz nową ocenę
      const insertSql = `
        INSERT INTO ratings 
        (from_user_id, to_user_id, apartment_id, cleanliness, conflict_free, sociability, comment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(
        insertSql,
        [from_user_id, to_user_id, apartment_id, cleanliness, conflict_free, sociability, comment],
        function (err) {
          if (err) return callback(err);
          callback(null, { id: this.lastID, ...data });
        }
      );
    });
  },

  // Sprawdź czy użytkownik już ocenił daną osobę
  hasRated: (from_user_id, to_user_id, callback) => {
    const sql = `SELECT id FROM ratings WHERE from_user_id = ? AND to_user_id = ?`;
    db.get(sql, [from_user_id, to_user_id], (err, row) => {
      if (err) return callback(err);
      callback(null, !!row);
    });
  },

  findByApartment: (apartment_id, callback) => {
    const sql = `
      SELECT r.*, u.name as from_user_name 
      FROM ratings r
      JOIN users u ON r.from_user_id = u.id
      WHERE r.apartment_id = ?
    `;
    db.all(sql, [apartment_id], callback);
  },

  findAverageByUser: (user_id, callback) => {
    const sql = `
      SELECT 
        AVG(cleanliness) as avg_cleanliness,
        AVG(conflict_free) as avg_conflict_free,
        AVG(sociability) as avg_sociability,
        COUNT(*) as ratings_count
      FROM ratings WHERE to_user_id = ?
    `;
    db.get(sql, [user_id], callback);
  },

  findByUser: (user_id, callback) => {
    const sql = `
      SELECT r.*, u.name as from_user_name 
      FROM ratings r
      JOIN users u ON r.from_user_id = u.id
      WHERE r.to_user_id = ?
      ORDER BY r.created_at DESC
    `;
    db.all(sql, [user_id], callback);
  },

  // Pobierz współlokatorów do oceny wraz z informacją czy już oceniono
  getRoommatesForRating: (user_id, callback) => {
    const sql = `
      SELECT DISTINCT 
        u.id, u.name, u.avatar, 
        a.id as apartment_id, a.title as apartment_title,
        CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as already_rated
      FROM residents r1
      JOIN residents r2 ON r1.apartment_id = r2.apartment_id AND r1.user_id != r2.user_id
      JOIN users u ON r2.user_id = u.id
      JOIN apartments a ON r1.apartment_id = a.id
      LEFT JOIN ratings r ON r.from_user_id = ? AND r.to_user_id = u.id
      WHERE r1.user_id = ?
    `;
    db.all(sql, [user_id, user_id], callback);
  },
};

module.exports = Rating;
