const db = require("../config/db");

const Apartment = {
  create: (data, callback) => {
    const { owner_id, title, address, city, price, area, has_balcony, pets_allowed, has_parking, description } = data;
    const sql = `
      INSERT INTO apartments 
      (owner_id, title, address, city, price, area, has_balcony, pets_allowed, has_parking, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      sql,
      [owner_id, title, address, city, price, area || null, has_balcony ? 1 : 0, pets_allowed ? 1 : 0, has_parking ? 1 : 0, description],
      function (err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, ...data });
      }
    );
  },

  findAll: (filters, callback) => {
    let sql = `SELECT * FROM apartments WHERE is_rented = 0`;
    const params = [];

    if (filters.city) { sql += ` AND LOWER(city) LIKE LOWER(?)`; params.push(`%${filters.city}%`); }
    if (filters.minPrice) { sql += ` AND price >= ?`; params.push(filters.minPrice); }
    if (filters.maxPrice) { sql += ` AND price <= ?`; params.push(filters.maxPrice); }
    if (filters.minArea) { sql += ` AND area >= ?`; params.push(filters.minArea); }
    if (filters.maxArea) { sql += ` AND area <= ?`; params.push(filters.maxArea); }
    if (filters.hasBalcony !== undefined && filters.hasBalcony !== '') {
      sql += ` AND has_balcony = ?`;
      params.push(filters.hasBalcony === 'true' || filters.hasBalcony === true ? 1 : 0);
    }
    if (filters.petsAllowed !== undefined && filters.petsAllowed !== '') {
      sql += ` AND pets_allowed = ?`;
      params.push(filters.petsAllowed === 'true' || filters.petsAllowed === true ? 1 : 0);
    }
    if (filters.hasParking !== undefined && filters.hasParking !== '') {
      sql += ` AND has_parking = ?`;
      params.push(filters.hasParking === 'true' || filters.hasParking === true ? 1 : 0);
    }

    sql += ` ORDER BY created_at DESC`;
    db.all(sql, params, callback);
  },

  // Zwraca owner_phone do wyświetlenia w ofercie
  findById: (id, callback) => {
    const sql = `
      SELECT a.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM apartments a
      JOIN users u ON a.owner_id = u.id
      WHERE a.id = ?
    `;
    db.get(sql, [id], callback);
  },

  findByOwner: (ownerId, callback) => {
    const sql = `SELECT * FROM apartments WHERE owner_id = ? ORDER BY created_at DESC`;
    db.all(sql, [ownerId], callback);
  },
};

module.exports = Apartment;
