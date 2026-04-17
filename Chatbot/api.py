import pandas as pd
import os
from flask import Flask, jsonify
from flask_cors import CORS
try:
    from google import genai
except ImportError:
    pass # handle in endpoint

import requests

app = Flask(__name__)
CORS(app)

SUPABASE_URL = "https://vxlndiazdhncofqavnyh.supabase.co"
SUPABASE_KEY = "sb_secret_8nGLbGX2ak0SlRkAiRJTnQ_YYuuKT7M"

# Scriptin bulunduğu dizini baz alarak veri yollarını oluşturuyoruz
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../ml-service/data")

print("1. VERİLER YÜKLENİYOR...")
try:
    df_reviews = pd.read_csv(os.path.join(DATA_DIR, "order_reviews.csv"))
    df_items = pd.read_csv(os.path.join(DATA_DIR, "order_items.csv"))
    df_products = pd.read_csv(os.path.join(DATA_DIR, "products.csv"))

    if 'review_comment_message' in df_reviews.columns:
        df_reviews = df_reviews.dropna(subset=['review_comment_message'])
        df_prod_reviews = pd.merge(df_reviews, df_items, on='order_id', how='inner')
        df_prod_reviews = pd.merge(df_prod_reviews, df_products[['product_id', 'product_category_name']], on='product_id', how='inner')
except Exception as e:
    print("Veriler eksik veya yüklenemedi:", e)
    df_prod_reviews = None

@app.route('/api/products', methods=['GET'])
def get_products():
    # Frontend'in secret key ile supabase'e erişmesi yasak olduğu için proxy yapıyoruz
    url = f"{SUPABASE_URL}/rest/v1/products?select=*&limit=100"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    try:
        response = requests.get(url, headers=headers)
        return jsonify(response.json()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    url = f"{SUPABASE_URL}/rest/v1/products?select=product_category_name&limit=500"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        cats = list(set([p['product_category_name'] for p in data if p.get('product_category_name')]))
        return jsonify(cats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/recommend', methods=['GET'])
def recommend():
    if df_prod_reviews is None:
        return jsonify({"error": "Veri setleri yüklenemedi. Lütfen önce veri çekim işlemini tamamlayın."}), 500
        
    top_products = df_prod_reviews.groupby('product_id').agg(
        avg_score=('review_score', 'mean'),
        comment_count=('review_comment_message', 'count'),
        category=('product_category_name', 'first'),
        item_popularity=('order_id', 'count'),
        item_avg_price=('price', 'mean')
    ).reset_index()
    
    # ML Service Analizi sonucunda modelin en çok etkilendiği faktörlerden biri item_popularity 
    # ve item_avg_price olarak belirlenmiştir. Bu yüzden önerilerde popülerliği yüksek ürünlere öncelik veriyoruz.
    best_candidates = top_products[
        (top_products['comment_count'] >= 5) & 
        (top_products['avg_score'] > 4) &
        (top_products['item_popularity'] > 10)
    ].sort_values(by=['item_popularity', 'avg_score'], ascending=[False, False])
    
    # Eğer filtreye uyan yeterli ürün yoksa, kriterleri gevşetip getiriyoruz
    if len(best_candidates) < 2:
        best_candidates = top_products[
            (top_products['comment_count'] >= 3) & 
            (top_products['avg_score'] > 3.5)
        ].sort_values(by=['item_popularity', 'avg_score'], ascending=[False, False])
        
    best_products = best_candidates.head(10).sample(min(2, len(best_candidates)))
    
    ai_context = "Sen E-Ticaret sitemizin son derece kibar, profesyonel ve ikna edici Yapay Zeka Satış Asistanısın.\n"
    ai_context += "Aşağıda sana müşteriye önermen gereken 2 adet ürünün bilgilerini ve diğer müşterilerin bu ürünlerle ilgili önceden yazdığı GERÇEK değerlendirmeleri (Review) veriyorum.\n"
    ai_context += "DİKKAT: Göreceğin müşteri yorumları 'Brezilya Portekizcesi' dilindedir fakat karşındaki MÜŞTERİ TÜRK'TÜR. Kullanıcıyla sadece TÜRKÇE konuşmalısın.\n"
    ai_context += "Senden istediğim şey; müşteriye bu ürünleri kibar bir dille Türkçe önermen. Portekizce yorumları kendin okuyup analiz et, ve müşteriye Türkçe olarak 'Mesela diğer müşterilerimiz bu ürünü şundan dolayı çok sevmiş...' diyerek yorumlardan TÜRKÇE çeviriler, özetler ve alıntılar vererek satışı destekle.\n\n"
    ai_context += "İşte Önereceğin Ürünler ve Orijinal Portekizce Yorumları:\n\n"
    
    for idx, row in best_products.iterrows():
        p_id = row['product_id']
        cat = row['category']
        reviews = df_prod_reviews[df_prod_reviews['product_id'] == p_id]['review_comment_message'].sample(min(3, row['comment_count'])).tolist()
        
        ai_context += f"Ürün Kategorisi: {cat}\n"
        ai_context += f"Ürün ID Kodu: {p_id[:8]}...\n"
        ai_context += f"Gerçek Müşteri Yorumları:\n"
        for r in reviews:
            ai_context += f"- '{r}'\n"
        ai_context += "---\n"
        
    try:
        GEMINI_API_KEY = "AQ.Ab8RN6K0ZWC5vgEvMftPkBfUjoEI9V6lIJi7ul23VAqsUK-yiA" 
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=ai_context
        )
        return jsonify({"response": response.text}), 200
    except Exception as e:
        error_str = str(e)
        if "503" in error_str:
            return jsonify({"response": "Şu an Gemini yapay zeka servisi çok yoğun, lütfen birkaç saniye sonra tekrar dene. Ürün önerilerimiz hazır bekliyor!"}), 200
        return jsonify({"error": error_str}), 500

if __name__ == '__main__':
    app.run(port=5001)
