const db = require('./src/config/db');

console.log('🔄 Dodaję kolumnę phone do tabeli users...');

db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ Kolumna phone już istnieje.');
    } else {
      console.error('❌ Błąd:', err.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Kolumna phone dodana pomyślnie.');
  }
  console.log('🎉 Migracja zakończona!');
  process.exit(0);
});
