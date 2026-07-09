// Diagnostic : vérifie que le fichier .env est bien trouvé et lu.
// Usage : node scripts/checkEnv.js
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
console.log('Chemin recherché pour .env :', envPath);
console.log('Le fichier existe ?', fs.existsSync(envPath));

require('dotenv').config({ path: envPath });

console.log('DB_HOST:', JSON.stringify(process.env.DB_HOST));
console.log('DB_NAME:', JSON.stringify(process.env.DB_NAME));
console.log('DB_USER:', JSON.stringify(process.env.DB_USER));
console.log('DB_PASSWORD défini ?', process.env.DB_PASSWORD !== undefined);
console.log('DB_PASSWORD longueur:', (process.env.DB_PASSWORD || '').length);
