import sqlite3
import os

db_path = '/Users/handeuygun/Desktop/SmartBazaar/Chatbot/reviews.db'

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute('''
CREATE TABLE IF NOT EXISTS product_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Insert some mock data for existing products to make it look good
mock_reviews = [
    ('prod001', 'user1', 'Ahmet Yılmaz', 5, 'Harika bir ürün, kesinlikle tavsiye ederim!', True),
    ('prod001', 'user2', 'Ayşe Demir', 4, 'Güzel ama kargosu biraz yavaş geldi.', False),
    ('prod002', 'user3', 'Mehmet Kaya', 5, 'Tam beklediğim gibi, teşekkürler SmartBazaar.', True)
]

for review in mock_reviews:
    c.execute('INSERT INTO product_reviews (product_id, user_id, user_name, rating, comment, verified_purchase) VALUES (?, ?, ?, ?, ?, ?)', review)

conn.commit()
conn.close()
print("Reviews DB initialized")
