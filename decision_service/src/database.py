import sqlite3

DB_PATH = "users.db"

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    from auth import get_password_hash
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    # Seed default admin user
    cursor.execute("SELECT * FROM users WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        hashed_pw = get_password_hash("admin")
        cursor.execute("INSERT INTO users (username, hashed_password, role) VALUES (?, ?, ?)", ("admin", hashed_pw, "admin"))
    conn.commit()
    conn.close()
