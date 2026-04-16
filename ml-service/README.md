# E-Ticaret Ürün Öneri Sistemi (Machine Learning)

Bu proje, veri tabanı altyapısı olarak **Supabase**, veri seti yapısı olarak **Olist E-Commerce** standartlarına dayalı olarak geliştirilmiş, ağaç tabanlı (Tree-based) bir **LightGBM Makine Öğrenmesi (Recommendation System)** projesidir.

## 🚀 Proje Amacı
Kullanıcıların geçmiş alışveriş harcamaları, kargo sepetleri ve en çok rağbet gören ürün kategorileri üzerinden ***"Bir kullanıcıya hangi özel ürünü gösterebiliriz?"*** (Classification / Ranking) sorusuna yanıt bulmak amaçlanmıştır. 

Modelimiz %95'lik `AUC (Area Under Curve)` skoru ve `%87 Doğruluk (Accuracy)` oranı ile testlerini başarıyla tamamlamıştır.

---

## 🛠️ Kurulum Gereksinimleri
Aşağıdaki adımları takip ederek projeyi kendi bilgisayarınızda çalıştırabilirsiniz.

**1. Sanal Ortam (Virtual Environment) Kurulumu ve Aktivesi**
Mac / Linux İçin:
```bash
python3 -m venv .venv
source .venv/bin/activate
```
Windows İçin:
```cmd
python -m venv .venv
.venv\Scripts\activate
```

**2. Kütüphanelerin Yüklenmesi**
```bash
pip install pandas numpy supabase lightgbm scikit-learn
```

---

## 📂 Proje Kullanımı

Proje karmaşıklığı önlemek amacıyla 2 ayrı adıma (dosyaya) bölünmüştür:

### Adım 1: Veri Çekme (`1_fetch_data.py`)
Modelimizi eğitebilmek için öncelikle Supabase sunucumuzdaki verileri yerel cihazımıza (CSV formatında) çekiyoruz. 
* Bu dosya projede **Pagination (Sayfalama)** yöntemini kullanarak 100 binden fazla satırı limitlere takılmadan başarıyla indirebilir.
* Supabase bağlantısını yapılandırmak için dosya içerisindeki `SUPABASE_URL` ve `SUPABASE_KEY` değişkenlerini kendinize göre güncelleyebilirsiniz.

**Çalıştırmak için:**
```bash
python 1_fetch_data.py
```
*(Sonuçlar `data/` klasörü içerisine `.csv` olarak düşecektir)*


### Adım 2: Özellik Çıkarımı ve Makine Öğrenmesi (`2_ml_pipeline.py`)
İndirdiğiniz gerçek verilerin, **"Tavsiye Edilenler Listesi"** oluşturacak bir yapay zekaya dönüştüğü yer burasıdır. Bu dosya şunları yapar:

1. **Join:** Dağınık veritabanı tablolarını (`orders`, `order_items`, `customers`, `products`) birleştirir.
2. **Feature Engineering (Boyutlandırma):** Kullanıcının toplamda ne kadar harcama yaptığı, ortalama kargo değerleri ve bir ürünün ortalama ne kadar popüler olduğu gibi makine öğrenmesinin anlayabileceği skorlar matematiğe dökülür.
3. **Negatif Örnekleme (Negative Sampling):** Yapay zeka'nın *sadece alınanı değil*, *alınmayacak ürünü de* bilmesi için etiket dengesi kurar.
4. **LightGBM Eğitimi:** Modeli %80-%20 kuralına göre eğitip başarı çıktısını test eder.

**Çalıştırmak için:**
```bash
python 2_ml_pipeline.py
```

---

## 🧠 Makine Öğrenmesinin Gözde Karar Değişkenleri
Modelin doğru bir tahmin çıkarmasında en etkili (Feature Importance) veriler şunlardır:
* `item_avg_price`: Ürünün ortalama ücreti (Her müşterinin belirli bir fiyat/bütçe segmenti olduğu ispatlandı)
* `user_avg_order_value`: Müşterinin ortalama sepet değer ve para harcama alışkanlığı. 
* `item_popularity`: Ürünlerin platformdaki genel popülaritesi.
* `user_basket_size`: Müşterinin genelde sepetine kaç parça ürün eklediği.
* `user_total_freight`: Müşterinin kargo masraflarına ödediği toplam bütçe dağılımı.
