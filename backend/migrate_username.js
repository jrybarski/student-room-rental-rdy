const db = require('./src/config/db');

console.log('🔄 Uruchamiam migrację...');

// Krok 1: Dodaj kolumnę username (jeśli nie istnieje)
db.run(`ALTER TABLE users ADD COLUMN username TEXT`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ Kolumna username już istnieje, pomijam.');
    } else {
      console.error('❌ Błąd dodawania kolumny:', err.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Kolumna username dodana.');
  }

  // Krok 2: Wypełnij username dla istniejących użytkowników
  // Format: imie_nazwisko z małych liter + id na końcu dla unikalności
  db.all(`SELECT id, name, email FROM users WHERE username IS NULL OR username = ''`, [], (err, users) => {
    if (err) { console.error('❌ Błąd pobierania użytkowników:', err.message); process.exit(1); }

    if (users.length === 0) {
      console.log('✅ Wszyscy użytkownicy mają już login.');
      createIndex();
      return;
    }

    console.log(`🔄 Generuję loginy dla ${users.length} użytkowników...`);

    let done = 0;
    users.forEach((user) => {
      // Generuj login z imienia i nazwiska
      const base = (user.name || user.email.split('@')[0])
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // usuń polskie znaki
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15);

      const username = `${base}_${user.id}`;

      db.run(`UPDATE users SET username = ? WHERE id = ?`, [username, user.id], (err) => {
        if (err) console.error(`❌ Błąd dla user ${user.id}:`, err.message);
        else console.log(`  ✓ user ${user.id} → @${username}`);

        done++;
        if (done === users.length) createIndex();
      });
    });
  });
});

// Krok 3: Utwórz unikalny indeks na username
function createIndex() {
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`, (err) => {
    if (err) {
      // Może być konflikt duplikatów — wtedy indeks się nie uda
      console.warn('⚠️  Nie udało się utworzyć unikalnego indeksu:', err.message);
      console.warn('   Sprawdź czy nie ma duplikatów w kolumnie username.');
    } else {
      console.log('✅ Unikalny indeks na username utworzony.');
    }
    console.log('\n🎉 Migracja zakończona! Możesz uruchomić serwer.');
    process.exit(0);
  });
}
