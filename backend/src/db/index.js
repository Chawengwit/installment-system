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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                installment_status BOOLEAN NOT NULL DEFAULT FALSE
            );

            CREATE TABLE IF NOT EXISTS credit_cards (
                id SERIAL PRIMARY KEY,
                card_name VARCHAR(100) NOT NULL,
                card_number VARCHAR(100) NOT NULL,
                credit_limit NUMERIC(12, 2) NOT NULL,
                used_amount NUMERIC(12, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                installment_status BOOLEAN NOT NULL DEFAULT FALSE
            );

            CREATE INDEX IF NOT EXISTS idx_credit_card_name ON credit_cards(card_name);
            CREATE INDEX IF NOT EXISTS idx_credit_card_number ON credit_cards(card_number);

            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price NUMERIC(12, 2) NOT NULL,
                serial_number VARCHAR(100) NOT NULL,
                images JSONB,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_status_enum') THEN
                    CREATE TYPE installment_status_enum AS ENUM ('active', 'paid', 'overdue', 'cancelled');
                END IF;
            END\$\$;

            CREATE TABLE IF NOT EXISTS installments (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                credit_card_id INTEGER REFERENCES credit_cards(id),
                start_date DATE NOT NULL,
                total_amount NUMERIC(12, 2) NOT NULL,
                interest_rate NUMERIC(5, 2) NOT NULL,
                term_months INTEGER NOT NULL,
                status installment_status_enum DEFAULT 'active',
                late_fee NUMERIC(12, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_installments_customer_id ON installments(customer_id);
            CREATE INDEX IF NOT EXISTS idx_installments_credit_card_id ON installments(credit_card_id);
            CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
        `);

    } finally {
        client.release();
    }
};

createTables().catch(err => console.error('Error creating tables:', err));

export const query = (text, params) => pool.query(text, params);
export { pool };
