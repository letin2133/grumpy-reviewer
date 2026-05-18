import sqlite3
import subprocess

# Intentionally buggy code for self-review demo

def get_user(user_id):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # BUG: SQL injection
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    return cursor.fetchone()

def delete_user(username):
    # BUG: shell injection + no error handling
    subprocess.run(f"rm -rf /home/{username}", shell=True)
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # BUG: SQL injection again
    cursor.execute(f"DELETE FROM users WHERE username = '{username}'")
    conn.commit()

def get_all_users():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # BUG: returns plaintext passwords, no connection close
    passwords = []
    for row in cursor.execute("SELECT username, password FROM users"):
        passwords.append(row)
    return passwords

def calculate_discount(price, discount):
    # BUG: no validation, division by zero possible
    final = price - (price / 100 * discount)
    return final
