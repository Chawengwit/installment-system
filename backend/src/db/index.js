import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                id_card_image TEXT,
                id_card_number VARCHAR(50) NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS credit_cards (
                id SERIAL PRIMARY KEY,
                card_name VARCHAR(100) NOT NULL,
                card_number VARCHAR(100) NOT NULL,
                credit_limit NUMERIC(12, 2) NOT NULL,
                used_amount NUMERIC(12, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_credit_card_name ON credit_cards(card_name);
            CREATE INDEX IF NOT EXISTS idx_credit_card_number ON credit_cards(card_number);
        `);
    } finally {
        client.release();
    }
};

createTables().catch(err => console.error('Error creating tables:', err));

export const query = (text, params) => pool.query(text, params);
export { pool };
