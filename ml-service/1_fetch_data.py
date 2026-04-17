import pandas as pd
from supabase import create_client, Client
import os

SUPABASE_URL = "https://vxlndiazdhncofqavnyh.supabase.co"
SUPABASE_KEY = "sb_secret_8nGLbGX2ak0SlRkAiRJTnQ_YYuuKT7M" # Uyarı: Anon key'ler normalde eyJ ile başlar, eğer bağlantı hatası alırsanız Dashboard'dan 'anon' 'public' key'i alınız.

print("Supabase'e bağlanılıyor...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Data adında bir klasör oluşturup CSV'leri içine kaydedeceğiz
os.makedirs("data", exist_ok=True)

def fetch_and_save(table_name):
    print(f"'{table_name}' tablosu çekiliyor (Tüm satırlar)...")
    try:
        all_data = []
        start = 0
        chunk_size = 1000
        
        while True:
            response = supabase.table(table_name).select("*").range(start, start + chunk_size - 1).execute()
            data = response.data
            
            if not data:
                break
                
            all_data.extend(data)
            start += chunk_size
            
        df = pd.DataFrame(all_data)
        
        if not df.empty:
            csv_path = f"data/{table_name}.csv"
            df.to_csv(csv_path, index=False)
            print(f"  -> BAŞARILI: Toplam {len(df)} satır veri {csv_path} olarak kaydedildi.")
        else:
            print(f"  -> Uyarı: '{table_name}' tablosu içi boş görünüyor.\n")
            
    except Exception as e:
        print(f"  -> Hata ({table_name}): {e}\n")

# Hangi tabloları çekeceksek buraya giriyoruz
fetch_and_save("customers")
fetch_and_save("orders")
fetch_and_save("order_items")
fetch_and_save("products")

print("---------------------------------------------------------")
print("VERİ ÇEKME AŞAMASI TAMAMLANDI!")
print("Kontrol edebilmek için Sol tarafta oluşan 'data' klasörüne bakabilirsiniz.")
print("Şimdi diğer doya olan '2_ml_pipeline.py' dosyasını çalıştırabilirsiniz.")
