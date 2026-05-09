import os
try:
    from dotenv import load_dotenv
    load_dotenv()  # loads Chatbot/.env when running locally
except ImportError:
    pass  # dotenv optional; env vars can be set another way
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
try:
    from google import genai
except ImportError:
    pass # handle in endpoint

import requests
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Admin doğrulama middleware
def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        admin_token = request.headers.get('X-Admin-Token', '')
        
        # Admin kontrolü: Bearer token veya X-Admin-Token header'ı
        if auth_header == 'Bearer admin' or admin_token == 'admin':
            return f(*args, **kwargs)
        
        return jsonify({"error": "Admin authorization required"}), 403
    return decorated_function

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# CSV'den yükle, yoksa Supabase'den çek
def load_review_data():
    if not PANDAS_AVAILABLE:
        return None

    # 1. CSV dosyalarından dene (1_fetch_data.py çalıştırılmışsa)
    csv_dirs = ["data", "../ml-service/data"]
    for base in csv_dirs:
        try:
            df_reviews  = pd.read_csv(f"{base}/order_reviews.csv")
            df_items    = pd.read_csv(f"{base}/order_items.csv")
            df_products = pd.read_csv(f"{base}/products.csv")
            if 'review_comment_message' not in df_reviews.columns:
                continue
            df_reviews = df_reviews.dropna(subset=['review_comment_message'])
            df = pd.merge(df_reviews, df_items, on='order_id', how='inner')
            df = pd.merge(df, df_products[['product_id', 'product_category_name']], on='product_id', how='inner')
            print(f"Chatbot verisi CSV'den yüklendi: {base}")
            return df
        except Exception:
            continue

    # 2. Supabase'den çek
    try:
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        r_reviews  = requests.get(f"{SUPABASE_URL}/rest/v1/order_reviews?select=order_id,review_score,review_comment_message&limit=10000", headers=headers)
        r_items    = requests.get(f"{SUPABASE_URL}/rest/v1/order_items?select=order_id,product_id,price&limit=10000", headers=headers)
        r_products = requests.get(f"{SUPABASE_URL}/rest/v1/products?select=product_id,product_category_name&limit=10000", headers=headers)
        if r_reviews.ok and r_items.ok and r_products.ok:
            df_reviews  = pd.DataFrame(r_reviews.json()).dropna(subset=['review_comment_message'])
            df_items    = pd.DataFrame(r_items.json())
            df_products = pd.DataFrame(r_products.json())
            df = pd.merge(df_reviews, df_items, on='order_id', how='inner')
            df = pd.merge(df, df_products[['product_id', 'product_category_name']], on='product_id', how='inner')
            print("Chatbot verisi Supabase'den yüklendi.")
            return df
    except Exception as e:
        print(f"Supabase'den veri yükleme hatası: {e}")

    return None

df_prod_reviews = load_review_data()

@app.route('/api/products', methods=['GET'])
def get_products():
    limit    = request.args.get('limit',    type=int)
    offset   = request.args.get('offset',   0, type=int)
    category = request.args.get('category', '')

    url = f"{SUPABASE_URL}/rest/v1/products?select=*&order=product_id.desc"

    if category:
        url += f"&product_category_name=eq.{category}"

    url += f"&limit={limit}&offset={offset}" if limit is not None else "&limit=10000"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    try:
        response = requests.get(url, headers=headers)
        if response.ok:
            return jsonify(response.json()), 200
        else:
            return jsonify({"error": f"Failed to fetch products: {response.text}"}), 500
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    url = f"{SUPABASE_URL}/rest/v1/products?select=product_category_name"
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

# POST endpoint - Yeni ürün ekleme (Admin only)
@app.route('/api/products', methods=['POST'])
@require_admin
def create_product():
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        required_fields = ['id', 'title', 'price', 'category']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields: id, title, price, category"}), 400
        
        # Supabase'e INSERT
        url = f"{SUPABASE_URL}/rest/v1/products"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        product_data = {
            "product_id": data.get('id'),
            "product_category_name": data.get('category'),
            "product_name_lenght": len(data.get('title', '')),
            "product_description_lenght": len(data.get('description', '')),
            "product_photos_qty": data.get('stock', 0)
        }
        
        response = requests.post(url, json=product_data, headers=headers)
        
        if response.status_code in [200, 201]:
            return jsonify({
                "success": True,
                "product": {
                    "id": data.get('id'),
                    "title": data.get('title'),
                    "price": data.get('price'),
                    "category": data.get('category'),
                    "stock": data.get('stock', 0),
                    "brand": data.get('brand', 'SmartBazaar')
                }
            }), 201
        else:
            return jsonify({"error": f"Supabase error: {response.text}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# PUT endpoint - Ürün güncelleme (Admin only)
@app.route('/api/products/<product_id>', methods=['PUT'])
@require_admin
def update_product(product_id):
    try:
        data = request.get_json()
        
        # Supabase'te UPDATE
        url = f"{SUPABASE_URL}/rest/v1/products?product_id=eq.{product_id}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        update_data = {}
        if 'title' in data:
            update_data['product_name_lenght'] = len(data['title'])
        if 'stock' in data:
            update_data['product_photos_qty'] = data['stock']
        if 'category' in data:
            update_data['product_category_name'] = data['category']
        
        response = requests.patch(url, json=update_data, headers=headers)
        
        if response.status_code in [200, 204]:
            return jsonify({
                "success": True,
                "product": {
                    "id": product_id,
                    **data
                }
            }), 200
        else:
            return jsonify({"error": f"Update failed: {response.text}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# DELETE endpoint - Ürün silme (Admin only)
# Akış: 1) order_items kontrolü, 2) varsa sil, 3) ürünü sil
@app.route('/api/products/<product_id>', methods=['DELETE'])
@require_admin
def delete_product(product_id):
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        # 1. Ürüne bağlı order_items var mı kontrolü
        order_items_url = f"{SUPABASE_URL}/rest/v1/order_items?product_id=eq.{product_id}"
        order_items_check = requests.get(order_items_url, headers=headers)
        
        items_count = 0
        if order_items_check.status_code == 200:
            items_data = order_items_check.json()
            items_count = len(items_data) if isinstance(items_data, list) else 0
            
            # 2. Eğer order_items varsa, onları sil
            if items_count > 0:
                print(f"Product {product_id} has {items_count} order items, deleting them...")
                delete_order_items_url = f"{SUPABASE_URL}/rest/v1/order_items?product_id=eq.{product_id}"
                delete_items_response = requests.delete(delete_order_items_url, headers=headers)
                
                if delete_items_response.status_code not in [200, 204]:
                    return jsonify({
                        "error": f"Failed to delete order items: {delete_items_response.text}"
                    }), 500
                
                print(f"Order items deleted successfully ({items_count} deleted)")
        
        # 3. Şimdi ürünü sil
        product_url = f"{SUPABASE_URL}/rest/v1/products?product_id=eq.{product_id}"
        product_delete_response = requests.delete(product_url, headers=headers)
        
        if product_delete_response.status_code in [200, 204]:
            # 4. Deletion log'u kaydet
            log_url = f"{SUPABASE_URL}/rest/v1/product_deletion_logs"
            log_data = {
                "product_id": product_id,
                "deleted_by": "admin",
                "related_orders_deleted": items_count
            }
            
            try:
                log_response = requests.post(log_url, json=log_data, headers=headers)
                print(f"Product {product_id} deleted and logged (removed {items_count} order items)")
            except Exception as log_err:
                print(f"Log yazma hatası (ürün silindi): {log_err}")
            
            return jsonify({
                "success": True, 
                "message": f"Product {product_id} successfully deleted",
                "order_items_deleted": items_count
            }), 200
        else:
            error_text = product_delete_response.text
            print(f"Delete error: {error_text}")
            return jsonify({"error": f"Delete failed: {error_text}"}), 500
            
    except Exception as e:
        print(f"Error: {e}")
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
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")
        
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


# ─────────────────────────────────────────────
#  FAQ INTENT ENGINE  (NLP – keyword clustering)
# ─────────────────────────────────────────────

FAQ_INTENTS = {
    "shipping": {
        "keywords": [
            "kargo", "teslimat", "gönder", "ne zaman gelir", "ne zaman gelecek",
            "kaç günde", "ulaşır", "ulaşmaz", "takip", "tracking", "shipping",
            "delivery", "shipped", "dispatch", "kurye", "dağıtım", "gelmedi",
            "nerede kaldı", "yolda", "taşıma"
        ],
        "answer": (
            "🚚 **Kargo & Teslimat Bilgisi**\n\n"
            "• Siparişler onaylandıktan sonra **1-2 iş günü** içinde kargoya verilir.\n"
            "• Standart teslimat süresi **3-5 iş günü**dür (şehre göre değişebilir).\n"
            "• Ekspres kargo seçeneğiyle **1-2 iş günü**nde teslim alabilirsiniz.\n"
            "• Kargo takip numaranız sipariş onay e-postanıza gönderilir.\n"
            "• 150 TL üzeri alışverişlerde **ücretsiz kargo** uygulanır.\n\n"
            "📦 Siparişinizi Profilim > Siparişlerim bölümünden canlı olarak takip edebilirsiniz."
        )
    },
    "returns": {
        "keywords": [
            "iade", "geri gönder", "değişim", "değiştirmek", "değiştir", "beğenmedim",
            "return", "refund", "exchange", "iade etmek", "para iadesi", "iptal",
            "iptal etmek", "iptal etmek istiyorum", "wrong item", "yanlış ürün",
            "hasarlı", "bozuk", "kırık", "çalışmıyor", "kusurlu", "defolu"
        ],
        "answer": (
            "↩️ **İade & Değişim Politikası**\n\n"
            "• Teslim tarihinden itibaren **14 gün** içinde iade talep edebilirsiniz.\n"
            "• Ürün orijinal ambalajında, kullanılmamış ve fatura ile birlikte olmalıdır.\n"
            "• İade onaylandıktan sonra **3-5 iş günü** içinde ödemeniz iade edilir.\n"
            "• Hasarlı veya yanlış ürün geldiğinde kargo ücreti tarafımızca karşılanır.\n"
            "• Dijital ürünler ve indirimli kampanya ürünleri iade kapsamı dışındadır.\n\n"
            "📋 İade talebinizi Profilim > Siparişlerim > İade Talebi bölümünden açabilirsiniz."
        )
    },
    "payment": {
        "keywords": [
            "ödeme", "kredi kartı", "banka kartı", "havale", "eft", "kapıda ödeme",
            "payment", "pay", "credit card", "debit", "taksit", "taksitli", "fatura",
            "nakit", "cash", "paypal", "apple pay", "google pay", "güvenli", "ssl",
            "3d secure", "çalınma", "dolandırıcılık", "güvenlik", "şifre"
        ],
        "answer": (
            "💳 **Ödeme Yöntemleri & Güvenlik**\n\n"
            "• Kredi kartı (Visa, Mastercard, AmEx) — tüm bankalar\n"
            "• Banka kartı (debit)\n"
            "• Havale / EFT\n"
            "• Kapıda Ödeme (nakit veya pos cihazı)\n\n"
            "🔒 **Güvenlik:** Tüm işlemler **256-bit SSL** şifreleme ve **3D Secure** ile korunmaktadır. Kart bilgileriniz sistemimizde saklanmaz.\n\n"
            "💰 **Taksit:** Anlaşmalı bankalarda 3, 6 ve 12 taksit imkânı mevcuttur. Taksit seçeneklerini ödeme adımında görebilirsiniz."
        )
    }
}

GREETING_KEYWORDS = ["merhaba", "selam", "hi", "hello", "iyi günler", "günaydın", "hey"]

GREETING_ANSWER = (
    "👋 Merhaba! Ben SmartBazaar Destek Asistanıyım.\n\n"
    "Size şu konularda yardımcı olabilirim:\n"
    "• 🚚 **Kargo & Teslimat** — Kargo süreleri, takip\n"
    "• ↩️ **İade & Değişim** — İade koşulları, para iadesi\n"
    "• 💳 **Ödeme** — Yöntemler, güvenlik, taksit\n"
    "• 💡 **Ürün Önerisi** — Kişiselleştirilmiş öneriler\n\n"
    "Sorunuzu yazabilirsiniz!"
)

CONTACT_SUPPORT_ANSWER = (
    "🤔 Bu konuda size daha iyi yardımcı olabilmek için destek ekibimize bağlayalım.\n\n"
    "📞 **Müşteri Destek Hattı:** 0850 xxx xx xx (09:00–21:00)\n"
    "📧 **E-posta:** destek@smartbazaar.com\n"
    "💬 **Canlı Destek:** Web sitemizin sağ alt köşesindeki 'Canlı Destek' butonunu kullanabilirsiniz.\n\n"
    "Ortalama yanıt süresi **30 dakika**dır. Size en kısa sürede dönüş yapacağız! 🙏"
)


def detect_intent(message: str):
    """
    Lightweight NLP intent detection:
    1. Normalise & tokenise
    2. Keyword matching with partial / substring support
    3. Returns matched intent key or None
    """
    msg = message.lower().strip()
    # remove common punctuation
    for ch in "?!.,;:\"'()[]{}":
        msg = msg.replace(ch, " ")

    # greeting check
    for kw in GREETING_KEYWORDS:
        if kw in msg:
            return "greeting"

    # score each intent
    scores = {}
    for intent, data in FAQ_INTENTS.items():
        score = 0
        for kw in data["keywords"]:
            if kw in msg:
                score += len(kw.split())   # longer phrase = higher weight
        if score > 0:
            scores[intent] = score

    if not scores:
        return None
    return max(scores, key=scores.get)


def gemini_faq_answer(user_message: str, detected_intent: str | None) -> str | None:
    """
    Optional: use Gemini to enrich the answer or handle edge cases.
    Returns None if Gemini is unavailable.
    """
    try:
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        if not GEMINI_API_KEY:
            return None
        client = genai.Client(api_key=GEMINI_API_KEY)

        context_hint = ""
        if detected_intent and detected_intent in FAQ_INTENTS:
            context_hint = f"Bu soru büyük olasılıkla '{detected_intent}' konusuyla ilgilidir. "

        system_prompt = (
            "Sen SmartBazaar e-ticaret platformunun Türkçe konuşan müşteri destek asistanısın. "
            "Sadece şu konularda yardımcı olabilirsin: kargo/teslimat, iade/değişim, ödeme yöntemleri. "
            "Bu konular dışındaki sorular için müşteriyi destek hattına yönlendir. "
            "Yanıtların kısa, net ve samimi olsun. Emoji kullanabilirsin. "
            f"{context_hint}"
            "Kullanıcı sorusu: " + user_message
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=system_prompt
        )
        return response.text
    except Exception:
        return None


@app.route('/api/chat/faq', methods=['POST'])
def faq_chat():
    """
    NLP-powered FAQ endpoint.
    Body: { "message": "..." }
    Returns: { "response": "...", "intent": "..." }
    """
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"error": "message field is required"}), 400

    intent = detect_intent(user_message)

    # 1. Greeting
    if intent == "greeting":
        return jsonify({"response": GREETING_ANSWER, "intent": "greeting"}), 200

    # 2. Known FAQ intent → return pre-built structured answer
    if intent and intent in FAQ_INTENTS:
        base_answer = FAQ_INTENTS[intent]["answer"]

        # Optionally enrich with Gemini if the question is complex
        words = user_message.split()
        if len(words) > 6:   # complex question — try Gemini enrichment
            gemini_resp = gemini_faq_answer(user_message, intent)
            if gemini_resp:
                return jsonify({"response": gemini_resp, "intent": intent}), 200

        return jsonify({"response": base_answer, "intent": intent}), 200

    # 3. Unknown intent → try Gemini
    gemini_resp = gemini_faq_answer(user_message, None)
    if gemini_resp:
        return jsonify({"response": gemini_resp, "intent": "ai_assisted"}), 200

    # 4. Final fallback → Contact Support
    return jsonify({"response": CONTACT_SUPPORT_ANSWER, "intent": "unknown"}), 200


if __name__ == '__main__':
    app.run(port=5001)

