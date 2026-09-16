import psycopg2
import logging
from config import (
    DATABASE_URL,
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
)

logger = logging.getLogger(__name__)


def get_db_connection():
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL)
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
    )


def init_db():
    from auth import get_password_hash
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')

    # Seed default admin user
    cursor.execute("SELECT id FROM users WHERE username = %s", ("admin",))
    if not cursor.fetchone():
        hashed_pw = get_password_hash("admin")
        cursor.execute(
            "INSERT INTO users (username, hashed_password, role) VALUES (%s, %s, %s)",
            ("admin", hashed_pw, "admin")
        )

    conn.commit()
    cursor.close()
    conn.close()
