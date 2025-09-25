import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Vérifier la connexion une seule fois au démarrage
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connexion PostgreSQL réussie !");
    client.release(); // Libère la connexion pour le pool
  } catch (err) {
    console.error("❌ Erreur de connexion à PostgreSQL :", err.message);
  }
})();

export default pool;
