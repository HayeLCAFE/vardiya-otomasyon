# Vardiya Otomasyon Sistemi

Profesyonel vardiya çizelgesi oluşturma aracı.

## Özellikler

- **Vardiya çizelgesi**: Otomatik vardiya planlaması
- **Web arayüzü**: Basit ve kullanıcı dostu arayüz
- **MongoDB desteği**: İsteğe bağlı veritabanı entegrasyonu

## Sistem gereksinimleri

- Node.js 16+
- npm (Node Package Manager)
- MongoDB (isteğe bağlı)

## Kurulum

### 1. Bağımlılıklar
```bash
npm install
```

### 2. İstemci (isteğe bağlı)
```bash
cd client
npm install
npm start
```

### 3. Çalıştırma
```bash
npm start
```

Geliştirme modu: `npm run dev`

## Kullanım

1. Sunucuyu başlattıktan sonra tarayıcıda açın: `http://localhost:5000`
2. Ay ve yıl seçin, **Vardiya Oluştur** ile çizelgeyi üretin.

## Konfigürasyon

`env.example` dosyasını kopyalayarak `.env` oluşturun:

```bash
cp env.example .env
```

Örnek değişkenler: `NODE_ENV`, `PORT`, `MONGODB_URI`, `TRUST_PROXY`, `PUBLIC_URL_PATH`, `APP_BASE_URL`, `CORS_ORIGINS`.

## Dosya yapısı

```
vardiya/
├── server.js          # Ana sunucu
├── index.html         # Web arayüzü
├── package.json
├── env.example
├── client/            # React istemcisi (isteğe bağlı)
└── deploy/            # Dağıtım ayarları
```

## API

### Personel
- `GET /api/personel` — Personel listesi

### Vardiya
- `POST /api/vardiya/olustur` — Çizelge oluştur
- `GET /api/vardiya/:ay/:yil` — Aylık kayıtlar

## Notlar

- MongoDB yoksa personel ve vardiya için varsayılan / sınırlı mod kullanılır.
- Tarayıcıda F12 ile konsoldan hata ayıklayabilirsiniz.

## Lisans

MIT License
