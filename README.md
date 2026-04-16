# Vardiya Otomasyon Sistemi

Profesyonel vardiya çizelgesi ve izin yönetim sistemi.

## 🚀 Özellikler

- **Vardiya Çizelgesi Oluşturma**: Otomatik vardiya planlaması
- **İzin Yönetimi**: Personel izinlerini ekleme/silme
- **Web Arayüzü**: Modern ve kullanıcı dostu arayüz
- **Veri Yedekleme**: JSON dosya tabanlı veri saklama
- **MongoDB Desteği**: İsteğe bağlı veritabanı entegrasyonu

## 📋 Sistem Gereksinimleri

- Node.js 16+ 
- npm (Node Package Manager)
- MongoDB (isteğe bağlı)

## ⚡ Kurulum

### 1. Projeyi İndirme
```bash
# Proje dosyalarını bilgisayarınıza indirin
# Vardiya-Otomasyon klasörünü açın
```

### 2. Sunucu Kurulumu
```bash
# Sunucu klasöründe terminal açın
npm install
```

### 3. İstemci Kurulumu (isteğe bağlı)
```bash
# İstemci tarafını kullanmak için
cd client
npm install
npm start
```

### 4. Çalıştırma
```bash
# Ana sunucuyu başlatın
npm start

# veya geliştirme modunda
npm run dev
```

## 🌐 Kullanım

1. Sunucuyu başlattıktan sonra tarayıcıda açın:
   ```
   http://localhost:5000
   ```

2. **Vardiya Oluşturma:**
   - Ay ve yıl seçin
   - "Vardiya Çizelgesi Oluştur" butonuna tıklayın

3. **İzin Yönetimi:**
   - Personel seçin
   - Başlangıç ve bitiş tarihlerini girin
   - "İzin Ekle" butonuna tıklayın

## ⚙️ Konfigürasyon

### Ortam Değişkenleri
`env.example` dosyasını kopyalayarak `.env` oluşturun:

```bash
cp env.example .env
```

### Ayarlar
```env
NODE_ENV=production
PORT=5000

# MongoDB (isteğe bağlı)
MONGODB_URI=mongodb://localhost:27017/vardiya

# Proxy ayarları
TRUST_PROXY=1
PUBLIC_URL_PATH=/vardiya

# CORS ayarları
APP_BASE_URL=
CORS_ORIGINS=https://siteniz.com
```

## 📁 Dosya Yapısı

```
vardiya/
├── server.js          # Ana sunucu dosyası
├── index.html         # Web arayüzü
├── package.json       # Sunucu bağımlılıkları
├── izinler.json       # İzin verileri
├── env.example        # Ortam değişkenleri şablonu
├── client/            # React istemcisi (isteğe bağlı)
└── deploy/            # Dağıtım ayarları
```

## 🔧 API Endpoints

### Personel
- `GET /api/personel` - Personel listesi

### Vardiya
- `POST /api/vardiya/olustur` - Vardiya çizelgesi oluştur
- `GET /api/vardiya/:ay/:yil` - Aylık vardiya listesi

### İzinler
- `GET /api/izinler` - İzin listesi
- `POST /api/izinler` - İzin ekle
- `DELETE /api/izinler/:id` - İzin sil
- `DELETE /api/izinler` - Tüm izinleri temizle

## 🛠️ Geliştirme

### Geliştirme Modu
```bash
npm run dev
```

### İstemci Geliştirme
```bash
cd client
npm start
```

## 📝 Notlar

- Sistem MongoDB bağlantısı olamazsa otomatik olarak dosya moduna geçer
- İzin verileri `izinler.json` dosyasında saklanır
- Vardiya verileri geçici olarak bellekte tutulur
- Tarayıcıda F12 ile konsolu açarak hata ayıklama yapabilirsiniz

## 🤝 Destek

Sorunlarınız için:
1. Tarayıcı konsolunu kontrol edin
2. Sunucu loglarını inceleyin
3. MongoDB bağlantınızı kontrol edin (kullanıyorsanız)

## 📄 Lisans

MIT License
