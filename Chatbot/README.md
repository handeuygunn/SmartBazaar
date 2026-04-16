# 🤖 E-Ticaret Yapay Zeka Satış Asistanı (RAG Chatbot)

Bu proje, Makine Öğrenmesi (Öneri Sistemi) ile Üretken Yapay Zekayı (GenAI) bir araya getirerek müşterilere ürün pazarlayan gelişmiş bir **RAG (Retrieval-Augmented Generation)** aracıdır.

Dosya (`3_chatbot.py`), veritabanınızdaki **orijinal ürün değerlendirmelerini (review)** analiz ederek müşterinizin anadilinde yüksek kaliteli ikna/satış metinleri oluşturur.

---

## ✨ Ne İşe Yarar? (Özellikleri)

1. **Akıllı Veri Birleştirme:** Supabase `order_reviews` (Müşteri Yorumları) ve `order_items` tablolarınızı birleştirerek o ürüne dair en gerçekçi içgörüleri ortaya çıkarır.
2. **Çoklu Dil Çevirisi & Analiz:** Olist e-ticaret verisetindeki **Brezilya Portekizcesi** olan gerçek müşteri yorumlarını okur. Bu yorumları otomatik olarak analiz eder ve sitenizdeki Tüketiciye anlık olarak **Türkçe** satış pazarlaması üretir.
3. **Google Gemini 2.5 Gücü:** Google'ın en yeni Generative AI SDK'sı (`google-genai`) ve `gemini-2.5-flash` modeli ile performans sorunu yaşamadan anında içerik döndürür.

---

## ⚙️ Kurulum & Ön Hazırlık

Eğer ana projedeki kurulumları yaptıysanız sadece GenAI paketini yüklemeniz yeterlidir.

**Sanal Ortamı Çalıştırın:**
```bash
source .venv/bin/activate
```

**Gereksinimleri Kurun:**
```bash
pip install google-genai pandas
```

---

## 🔑 Kullanım ve Konfigürasyon

`3_chatbot.py` dosyasını kendi özel Google Cloud veya Google AI Studio geliştirici hesabınıza bağlamanız gereklidir.

1. Dosyadaki 67. Satırda yer alan `GEMINI_API_KEY` değişkenini bulun.
2. Formata uygun olarak anahtarınızı yapıştırın (`AQ...` veya `AIzaSy...`).
3. (Opsiyonel) Prompt kısmında yer alan "Satış Asistanı" talimatlarını, kendi e-ticaret sitenizin üslubuna (samimi, resmi vb.) göre değiştirebilirsiniz.

**Botu Başlatmak İçin:**
```bash
python 3_chatbot.py
```

---

## 🔎 RAG (Retrieval) Mantığı Nasıl Çalışıyor?

Geleneksel ChatGPT botları bir ürünü överken sahte ve hayal ürünü şeyler söyleyebilir (Halüsinasyon). Ancak bu projede kullanılan **RAG mimarisi** bunu engeller:

* Model ürünü anlatmadan önce, Python kodu ürünün Supabase veritabanındaki 3 gerçek müşteri yorumunu bulup Prompt'un (*talimatın*) sonuna gizlice ekler.
* LLM (Gemini), bu gerçek değerlendirmeleri okur ve müşteriye satışı bu yorumlara dayandırarark yapar.
* **Örnek Çıktı:** *"Bu ürünü size kesinlikle öneriyorum. Örneğin diğer müşterilerimiz bu ürünü kaliteli kumaşından ve hızlı kargolanmasından dolayı platformumuzda çok beğendiklerini belirttiler."*
