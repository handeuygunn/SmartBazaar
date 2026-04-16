import pandas as pd
import numpy as np
import random
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
import os

if not os.path.exists("data/order_items.csv"):
    print("HATA: Henüz veriler indirilmemiş! Lütfen önce '1_fetch_data.py' dosyasını çalıştırın.")
    exit()

print("1. VERİLER YÜKLENİYOR (Lokal CSV'lerden)...")
df_customers = pd.read_csv("data/customers.csv")
df_orders = pd.read_csv("data/orders.csv")
df_items = pd.read_csv("data/order_items.csv")
df_products = pd.read_csv("data/products.csv")

print("2. VERİ BİRLEŞTİRME (Olist Tablo Yapısına Özel)...")
# Olist verisetinde 'customer_id' her siparişte bir kereliğine özel üretilir.
# Müşterinin ASIL kalıcı kimliği 'customer_unique_id'dir.
# Bu yüzden önce order ve item'ları, SONRA da customers tablosunu birleştirmeliyiz.
df_user_item = pd.merge(df_items, df_orders, on='order_id', how='inner')
df_user_item = pd.merge(df_user_item, df_customers, on='customer_id', how='inner')


print("3. FEATURE ENGINEERING (Veritabanındaki Gerçek Sütunlara Göre)...")

# --- ÜRÜN ÖZELLİKLERİ ---
# Olist'teki weight, photos_qty, freight_value gibi sütunları modele ekliyoruz
product_stats = df_user_item.groupby('product_id').agg(
    item_popularity=('order_id', 'count'),       # Ürün popülerliği (Satış adedi)
    item_avg_price=('price', 'mean'),            # Ortalama ücreti
    item_avg_freight=('freight_value', 'mean')   # Ürünün ortalama kargo bedeli
).reset_index()

item_features = pd.merge(product_stats, df_products[['product_id', 'product_category_name', 'product_weight_g', 'product_photos_qty']], on='product_id', how='left')

# Metinsel olan kategoriyi, LightGBM'in işleyebileceği sayılara çevirelim
item_features['category_encoded'] = item_features['product_category_name'].astype('category').cat.codes
item_features.drop('product_category_name', axis=1, inplace=True)


# --- KULLANICI ÖZELLİKLERİ ---
# Artık işlemleri "customer_unique_id" (gerçek kişi) üzerinden yapıyoruz
user_features = df_user_item.groupby('customer_unique_id').agg(
    user_total_spent=('price', 'sum'),           # Gerçek kişinin toplam harcaması
    user_total_freight=('freight_value', 'sum'), # Ödediği toplam kargo parası
    user_total_orders=('order_id', 'nunique'),   # Kaç kere alışverişe gelmiş
    user_basket_size=('product_id', 'count'),    # Sepet başına büyüklüğü
).reset_index()

# Eyalet bazlı coğrafi bir feature ekleyelim (Olist müşterileri Brezilya eyaletlerinde yaşar)
user_geo = df_user_item.drop_duplicates('customer_unique_id')[['customer_unique_id', 'customer_state']]
user_features = pd.merge(user_features, user_geo, on='customer_unique_id', how='left')

# Eyaletleri sayılara (label encoding) çevirelim
user_features['state_encoded'] = user_features['customer_state'].astype('category').cat.codes
user_features.drop('customer_state', axis=1, inplace=True)

user_features['user_avg_order_value'] = user_features['user_total_spent'] / user_features['user_total_orders']


print("4. NEGATİF ÖRNEKLEME (Performans Düzeltmesi)...")
positive_df = df_user_item[['customer_unique_id', 'product_id']].drop_duplicates().copy()
positive_df['label'] = 1

# Milyonlarca list/set işlemi Mac'inizi yormasın diye en aktif olan 10.000 müşteriyi işliyoruz
# Çünkü 100 bin kişi için "alınmayanları aramak" python'da 15 dakika sürer :)
top_customers = user_features.sort_values(by='user_total_orders', ascending=False).head(10000)['customer_unique_id'].tolist()
unique_products = df_products['product_id'].dropna().unique()
all_products_set = set(unique_products)

negative_samples = []
for user in top_customers:
    user_products = set(positive_df[positive_df['customer_unique_id'] == user]['product_id'])
    negative_candidates = list(all_products_set - user_products)
    
    # Gerçek dışı önermeleri model öğrensin diye 3 katı negatif örnek ekliyoruz
    num_neg = min(len(user_products) * 3, len(negative_candidates)) 
    if num_neg > 0:
        sampled_negatives = random.sample(negative_candidates, num_neg)
        for prod in sampled_negatives:
            negative_samples.append({'customer_unique_id': user, 'product_id': prod, 'label': 0})

negative_df = pd.DataFrame(negative_samples)

# Sadece filtrelenmiş hedef kitlemizi (top 10.000) modele sokuyoruz
train_df = pd.concat([positive_df[positive_df['customer_unique_id'].isin(top_customers)], negative_df], ignore_index=True)

# Çıkardığımız tüm özellikleri (Olist Feature'ları) birleştirelim
train_df = pd.merge(train_df, user_features, on='customer_unique_id', how='left')
train_df = pd.merge(train_df, item_features, on='product_id', how='left')

# Eksik verileri (NaN) 0 ile dolduralım
train_df = train_df.fillna(0) 

print(f"Eğitime Hazır Veri Satır Sayısı: {len(train_df)}\n")


print("5. LIGHTGBM MODEL EĞİTİMİ (Olist Özellikleriyle)...")
feature_columns = [
    'user_total_spent', 'user_total_freight', 'user_total_orders', 'user_basket_size', 'user_avg_order_value', 'state_encoded',
    'item_popularity', 'item_avg_price', 'item_avg_freight', 'product_weight_g', 'product_photos_qty', 'category_encoded'
]

X = train_df[feature_columns]
y = train_df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = lgb.LGBMClassifier(
    n_estimators=200, 
    learning_rate=0.05, 
    max_depth=7, 
    random_state=42,
    class_weight='balanced'
)

model.fit(
    X_train, y_train, 
    eval_set=[(X_test, y_test)], 
    callbacks=[lgb.early_stopping(stopping_rounds=15, verbose=False)]
)

preds = model.predict(X_test)
preds_proba = model.predict_proba(X_test)[:, 1]

print("---------------------------------------------------------")
print(f"Model Doğruluğu (Accuracy): {accuracy_score(y_test, preds):.4f}")
print(f"AUC Skoru (Model Başarısı): {roc_auc_score(y_test, preds_proba):.4f}")
print("---------------------------------------------------------")
print("Modele En Çok Karar Verdiren 5 Sütun:")
importance_df = pd.DataFrame({
    'Özellik': model.feature_name_, 
    'Önem Etkisi': model.feature_importances_
}).sort_values('Önem Etkisi', ascending=False)
print(importance_df.head(5).to_string(index=False))
print("\nEğitim Başarıyla Tamamlandı!")
