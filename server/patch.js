const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = bcrypt.hashSync('butaca2024', 10);
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', database: 'butaca_pos' });
    await conn.query('UPDATE usuarios SET password = ? WHERE email = ?', [hash, 'admin@labutaca.com']);
    console.log('Clave reparada con exito.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
