const db = require("../config/db");

const ResidenceRequest = {
  create: (student_id, apartment_id, callback) => {
    const sql = `INSERT INTO residence_requests (student_id, apartment_id) VALUES (?, ?)`;
    db.run(sql, [student_id, apartment_id], function (err) {
      if (err) return callback(err);
      callback(null, { id: this.lastID });
    });
  },

  findPendingByApartment: (apartment_id, callback) => {
    const sql = `
      SELECT rr.id, rr.student_id, u.name, u.email 
      FROM residence_requests rr
      JOIN users u ON rr.student_id = u.id
      WHERE rr.apartment_id = ? AND rr.status = 'pending'
    `;
    db.all(sql, [apartment_id], callback);
  },

  updateStatus: (request_id, status, callback) => {
    const sql = `UPDATE residence_requests SET status = ? WHERE id = ?`;
    db.run(sql, [status, request_id], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  },

  // Po akceptacji → dodaj do residents
  acceptAndAssign(request_id, callback) {
    const sql = `UPDATE residence_requests SET status = 'accepted' WHERE id = ?`;
    db.run(sql, [request_id], function (err) {
      if (err) return callback(err);

      // POBIERZ student_id i apartment_id
      db.get(
        `SELECT student_id, apartment_id FROM residence_requests WHERE id = ?`,
        [request_id],
        (err, row) => {
          if (err) return callback(err);

          // DODAJ DO residents
          db.run(
            `INSERT INTO residents (user_id, apartment_id) VALUES (?, ?)`,
            [row.student_id, row.apartment_id],
            function (err) {
              if (err) return callback(err);
              callback(null, { insertedId: this.lastID });
            }
          );
        }
      );
    });
  },
};

module.exports = ResidenceRequest;
