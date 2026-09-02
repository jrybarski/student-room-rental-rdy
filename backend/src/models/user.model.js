const db = require("../config/db");
const bcrypt = require("bcryptjs");

const User = {
  create: (userData, callback) => {
    const { email, password, username, name, role = "student", age, gender, status, phone, bio } = userData;
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return callback(err);
      const sql = `INSERT INTO users (email, password, username, name, role, age, gender, status, phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [email, hash, username, name, role, age || null, gender || null, status || null, phone || null, bio || null], function (err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, email, username, name, role, age, gender, status, phone, bio });
      });
    });
  },

  findByEmail: (email, callback) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], callback);
  },

  findByUsername: (username, callback) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], callback);
  },

  findById: (id, callback) => {
    db.get(`SELECT id, email, username, name, role, age, gender, status, phone, avatar, bio, created_at FROM users WHERE id = ?`, [id], callback);
  },

  findByIdWithPassword: (id, callback) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], callback);
  },

  updateProfile: (id, data, callback) => {
    const { name, age, gender, status, bio, avatar } = data;
    db.run(`UPDATE users SET name = ?, age = ?, gender = ?, status = ?, bio = ?, avatar = ? WHERE id = ?`, [name, age, gender, status, bio, avatar, id], callback);
  },

  updateAvatar: (id, avatar, callback) => {
    db.run(`UPDATE users SET avatar = ? WHERE id = ?`, [avatar, id], callback);
  },

  updatePassword: (id, newPassword, callback) => {
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) return callback(err);
      db.run(`UPDATE users SET password = ? WHERE id = ?`, [hash, id], callback);
    });
  },
};

module.exports = User;
