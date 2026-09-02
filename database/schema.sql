-- Użytkownicy
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK(role IN ('student', 'owner')) DEFAULT 'student',
    age INTEGER,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    status TEXT CHECK(status IN ('student', 'worker', 'unemployed')),
    avatar TEXT,
    bio TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apartments (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    price REAL NOT NULL,
    area REAL,
    has_balcony INTEGER DEFAULT 0,
    pets_allowed INTEGER DEFAULT 0,
    has_parking INTEGER DEFAULT 0,
    description TEXT,
    is_rented INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS residents (
    id INTEGER PRIMARY KEY,
    apartment_id INTEGER,
    user_id INTEGER,
    move_in_date DATE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY,
    from_user_id INTEGER,
    to_user_id INTEGER,
    apartment_id INTEGER,
    cleanliness INTEGER CHECK(cleanliness BETWEEN 1 AND 5),
    conflict_free INTEGER CHECK(conflict_free BETWEEN 1 AND 5),
    sociability INTEGER CHECK(sociability BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
);

CREATE TABLE IF NOT EXISTS residence_requests (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,
  apartment_id INTEGER,
  status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (apartment_id) REFERENCES apartments(id)
);

CREATE TABLE IF NOT EXISTS apartment_images (
  id INTEGER PRIMARY KEY,
  apartment_id INTEGER,
  filename TEXT NOT NULL,
  original_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  apartment_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
  UNIQUE(user_id, apartment_id)
);
