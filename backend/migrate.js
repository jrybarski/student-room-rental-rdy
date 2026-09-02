const db = require('./src/config/db');

console.log('Rozpoczynam migrację bazy danych...');

const migrations = [
  // Kolumny apartments
  `ALTER TABLE apartments ADD COLUMN area REAL`,
  `ALTER TABLE apartments ADD COLUMN has_balcony INTEGER DEFAULT 0`,
  `ALTER TABLE apartments ADD COLUMN is_rented INTEGER DEFAULT 0`,
  `ALTER TABLE apartments ADD COLUMN pets_allowed INTEGER DEFAULT 0`,
  `ALTER TABLE apartments ADD COLUMN has_parking INTEGER DEFAULT 0`,
  // Kolumny users (profil)
  `ALTER TABLE users ADD COLUMN age INTEGER`,
  `ALTER TABLE users ADD COLUMN gender TEXT`,
  `ALTER TABLE users ADD COLUMN status TEXT`,
  `ALTER TABLE users ADD COLUMN avatar TEXT`,
  `ALTER TABLE users ADD COLUMN bio TEXT`,
  // Kolumna ratings (zmiana payment_punctuality na sociability)
  `ALTER TABLE ratings ADD COLUMN sociability INTEGER`,
  // Tabela favorites
  `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    apartment_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    UNIQUE(user_id, apartment_id)
  )`,
];

let completed = 0;

migrations.forEach((sql, index) => {
  db.run(sql, (err) => {
    completed++;
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log(`Migracja ${index + 1}: Kolumna już istnieje (OK)`);
      } else {
        console.log(`Migracja ${index + 1}: ${err.message}`);
      }
    } else {
      console.log(`Migracja ${index + 1}: Sukces`);
    }
    
    if (completed === migrations.length) {
      console.log('\nMigracja zakończona!');
      
      // Sprawdź czy trzeba zmienić price_per_room na price
      db.all("PRAGMA table_info(apartments)", (err, columns) => {
        if (err) {
          console.log('Błąd sprawdzania struktury tabeli');
          process.exit(1);
        }
        
        const hasPrice = columns.some(c => c.name === 'price');
        const hasPricePerRoom = columns.some(c => c.name === 'price_per_room');
        
        if (hasPricePerRoom && !hasPrice) {
          console.log('\nTworzę nową tabelę z kolumną price...');
          
          const createNew = `
            CREATE TABLE apartments_new (
              id INTEGER PRIMARY KEY,
              owner_id INTEGER,
              title TEXT NOT NULL,
              address TEXT NOT NULL,
              city TEXT NOT NULL,
              price REAL NOT NULL,
              area REAL,
              has_balcony INTEGER DEFAULT 0,
              description TEXT,
              is_rented INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_id) REFERENCES users(id)
            )
          `;
          
          db.run(createNew, (err) => {
            if (err) {
              console.log('Błąd tworzenia nowej tabeli:', err.message);
              process.exit(1);
            }
            
            db.run(`
              INSERT INTO apartments_new (id, owner_id, title, address, city, price, area, has_balcony, description, is_rented, created_at)
              SELECT id, owner_id, title, address, city, price_per_room, area, has_balcony, description, is_rented, created_at
              FROM apartments
            `, (err) => {
              if (err) {
                console.log('Błąd kopiowania danych:', err.message);
              }
              
              db.run('DROP TABLE apartments', (err) => {
                if (err) {
                  console.log('Błąd usuwania starej tabeli:', err.message);
                }
                
                db.run('ALTER TABLE apartments_new RENAME TO apartments', (err) => {
                  if (err) {
                    console.log('Błąd zmiany nazwy tabeli:', err.message);
                  } else {
                    console.log('Tabela apartments zaktualizowana pomyślnie!');
                  }
                  process.exit(0);
                });
              });
            });
          });
        } else {
          console.log('Struktura tabeli jest aktualna.');
          process.exit(0);
        }
      });
    }
  });
});
