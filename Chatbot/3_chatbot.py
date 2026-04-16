import pandas as pd
import os

# Yeni nesil Google GenAI kütüphanesi
# Eğer hata alırsanız: pip install google-genai
try:
    from google import genai
except ImportError:
    print("HATA: google-genai kütüphanesi kurulu değil. Terminalde 'pip install google-genai' yazın.")
    exit()

print("1. VERİLER VE YORUMLAR YÜKLENİYOR...")
try:
    df_reviews = pd.read_csv("data/order_reviews.csv")
    df_items = pd.read_csv("data/order_items.csv")
    df_products = pd.read_csv("data/products.csv")
except Exception as e:
    print("Veriler eksik! Lütfen '1_fetch_data.py' dosyasını çalıştırın.")
    exit()

if 'review_comment_message' in df_reviews.columns:
    df_reviews = df_reviews.dropna(subset=['review_comment_message'])
    df_prod_reviews = pd.merge(df_reviews, df_items, on='order_id', how='inner')
    df_prod_reviews = pd.merge(df_prod_reviews, df_products[['product_id', 'product_category_name']], on='product_id', how='inner')
else:
    print("Yorum sütunu bulunamadı.")
    exit()

def urun_oner_ve_yorumlari_analiz_et():
    print("2. CHATBOT İÇİN ÜRÜN YORUMLARI HARMANLANIYOR (RAG MİMARİSİ)...")
    
    top_products = df_prod_reviews.groupby('product_id').agg(
        avg_score=('review_score', 'mean'),
        comment_count=('review_comment_message', 'count'),
        category=('product_category_name', 'first')
    ).reset_index()
    
    best_products = top_products[(top_products['comment_count'] >= 5) & (top_products['avg_score'] > 4)].sample(2)
    
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
        
    print("\n[✨ En Güncel Gemini AI, Portekizce yorumları okuyor ve çeviriyor...]")
    
    try:
        # Sizin verdiğiniz güncel API Key:
        GEMINI_API_KEY = "[ENCRYPTION_KEY]" 
        
        # En Güncel SDK: google-genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # En güncel model: gemini-2.5-flash
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=ai_context
        )
        
        print("\n==================================")
        print("🤖 SATIŞ ASİSTANI (GEMINI):")
        print("==================================\n")
        print(response.text)
        
    except Exception as e:
        print(f"\n[HATA] Gemini Sisteminde Bir Sorun Çıktı:\n>> {e}\n")

if __name__ == "__main__":
    urun_oner_ve_yorumlari_analiz_et()
