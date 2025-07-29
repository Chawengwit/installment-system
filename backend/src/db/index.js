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
                nickname VARCHAR(100),
                social_media JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                installment_status BOOLEAN NOT NULL DEFAULT FALSE
            );

            CREATE TABLE IF NOT EXISTS credit_cards (
                id SERIAL PRIMARY KEY,
                card_name VARCHAR(100) NOT NULL,
                credit_limit NUMERIC(12, 2) NOT NULL,
                used_amount NUMERIC(12, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                installment_status BOOLEAN NOT NULL DEFAULT FALSE
            );

            ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS color VARCHAR(255);

            CREATE INDEX IF NOT EXISTS idx_credit_card_name ON credit_cards(card_name);

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
                    CREATE TYPE installment_status_enum AS ENUM ('active', 'non-active', 'completed', 'deleted', 'paid', 'overdue', 'cancelled');
                END IF;
            END\$\$;

            CREATE TABLE IF NOT EXISTS installments (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                credit_card_id INTEGER REFERENCES credit_cards(id),
                due_date NUMERIC(12, 0) NOT NULL,
                monthly_payment NUMERIC(12, 2) NOT NULL,
                total_amount NUMERIC(12, 2) NOT NULL,
                interest_rate NUMERIC(5, 2) NOT NULL,
                term_months INTEGER NOT NULL,
                status installment_status_enum DEFAULT 'non-active',
                late_fee NUMERIC(12, 2) DEFAULT 0,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_installments_customer_id ON installments(customer_id);
            CREATE INDEX IF NOT EXISTS idx_installments_credit_card_id ON installments(credit_card_id);
            CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);

            CREATE TABLE IF NOT EXISTS installment_payments (
                id SERIAL PRIMARY KEY,
                installment_id INTEGER REFERENCES installments(id) ON DELETE CASCADE,
                term_number INTEGER NOT NULL,
                due_date DATE NOT NULL,
                paid_date DATE,
                amount NUMERIC(12, 2) NOT NULL,
                paid_amount NUMERIC(12, 2),
                is_paid BOOLEAN DEFAULT FALSE,
                slip_image TEXT,
                notification_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (installment_id, term_number)
            );

            CREATE INDEX IF NOT EXISTS idx_payments_due_date ON installment_payments(due_date);
            CREATE INDEX IF NOT EXISTS idx_payments_is_paid ON installment_payments(is_paid);
            CREATE INDEX IF NOT EXISTS idx_payments_installment_id ON installment_payments(installment_id);
            CREATE INDEX IF NOT EXISTS idx_payments_due_date_paid ON installment_payments(due_date, is_paid);

            CREATE TABLE IF NOT EXISTS contracts (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                installment_id INTEGER REFERENCES installments(id),
                contract_pdf TEXT,
                signature_image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_contracts_installment_id ON contracts(installment_id);
            CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
        `);

    } finally {
        client.release();
    }
};

createTables().catch(err => console.error('Error creating tables:', err));

export const query = (text, params) => pool.query(text, params);
export { pool };
