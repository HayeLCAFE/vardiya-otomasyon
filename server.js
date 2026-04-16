const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const trustProxyEnv = process.env.TRUST_PROXY;
const useTrustProxy =
    trustProxyEnv === '1' ||
    trustProxyEnv === 'true' ||
    (isProduction && trustProxyEnv !== '0' && trustProxyEnv !== 'false');
if (useTrustProxy) {
    app.set('trust proxy', 1);
}

const PUBLIC_URL_PATH = (process.env.PUBLIC_URL_PATH || '').replace(/\/$/, '');
if (PUBLIC_URL_PATH) {
    app.use((req, res, next) => {
        const pathOnly = req.path;
        if (pathOnly === PUBLIC_URL_PATH || pathOnly.startsWith(`${PUBLIC_URL_PATH}/`)) {
            let newPath = pathOnly.slice(PUBLIC_URL_PATH.length) || '/';
            const q = req.url.indexOf('?');
            req.url = q >= 0 ? newPath + req.url.slice(q) : newPath;
        }
        next();
    });
}

const corsOriginSet = new Set([
    'https://mail.sinanacar.com.tr',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
]);
function addCorsOrigin(url) {
    if (!url) return;
    const u = String(url).trim().replace(/\/$/, '');
    if (u) corsOriginSet.add(u);
}
addCorsOrigin(process.env.APP_BASE_URL);
(process.env.CORS_ORIGINS || '').split(',').forEach((s) => addCorsOrigin(s));

app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        if (corsOriginSet.has(origin)) {
            return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vardiya')
    .then(() => {
        console.log('MongoDB bağlantısı başarılı');
    })
    .catch((err) => {
    console.log('MongoDB bağlantısı başarısız, dosya modunda çalışıyor:', err.message);
    console.log('Dosya modu aktif - izinler.json kullanılıyor');
});

const IZIN_DOSYASI = path.join(__dirname, 'izinler.json');

async function izinleriOku() {
    try {
        const data = await fs.readFile(IZIN_DOSYASI, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function izinleriKaydet(izinler) {
    try {
        await fs.writeFile(IZIN_DOSYASI, JSON.stringify(izinler, null, 2));
        return true;
    } catch (error) {
        console.error('İzinler kaydedilemedi:', error);
        return false;
    }
}

const PersonelSchema = new mongoose.Schema({
    ad: { type: String, required: true },
    soyad: { type: String, required: true },
    tamAd: { type: String, required: true },
    aktif: { type: Boolean, default: true }
});

const VardiyaSchema = new mongoose.Schema({
    tarih: { type: Date, required: true },
    gun: { type: String, required: true },
    gunduzPersonel: { type: String, required: true },
    gecePersonel: { type: String, required: true },
    izinliPersonel: { type: String, required: true },
    ay: { type: Number, required: true },
    yil: { type: Number, required: true }
});

const IzinSchema = new mongoose.Schema({
    personel: { type: String, required: true },
    baslangic: { type: Date, required: true },
    bitis: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Personel = mongoose.model('Personel', PersonelSchema);
const Vardiya = mongoose.model('Vardiya', VardiyaSchema);
const Izin = mongoose.model('Izin', IzinSchema);

const varsayilanPersonel = [
    'OSMAN UYGURALP',
    'SİNAN ACAR',
    'MUSTAFA ÖZBİLEK',
    'SELİM KUZU'
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/personel', async (req, res) => {
    try {
        const personel = await Personel.find({ aktif: true }).sort({ tamAd: 1 });
        if (personel.length === 0) {
            const varsayilan = varsayilanPersonel.map((ad, index) => ({
                _id: index + 1,
                tamAd: ad,
                ad: ad.split(' ')[0],
                soyad: ad.split(' ')[1] || '',
                aktif: true
            }));
            res.json(varsayilan);
        } else {
            res.json(personel);
        }
    } catch (error) {
        const varsayilan = varsayilanPersonel.map((ad, index) => ({
            _id: index + 1,
            tamAd: ad,
            ad: ad.split(' ')[0],
            soyad: ad.split(' ')[1] || '',
            aktif: true
        }));
        res.json(varsayilan);
    }
});

app.post('/api/vardiya/olustur', async (req, res) => {
    try {
        const { ay, yil } = req.body;

        const baslangicTarihi = moment(`${yil}-${ay}-15`, 'YYYY-MM-DD');
        const sonrakiAy = ay === 12 ? 1 : ay + 1;
        const sonrakiYil = ay === 12 ? yil + 1 : yil;
        const bitisTarihi = moment(`${sonrakiYil}-${sonrakiAy}-14`, 'YYYY-MM-DD');

        let personelAdlari = varsayilanPersonel;
        try {
            const personel = await Personel.find({ aktif: true });
            if (personel.length > 0) {
                personelAdlari = personel.map(p => p.tamAd);
            }
        } catch (error) {
            console.log('Personel veritabanı okunamadı, varsayılan liste kullanılıyor');
        }

        const vardiyaKayitlari = [];
        let gunSayac = 0;

        const patterns = [
            { gunduz: 0, gece: 2, izinli: 1 },
            { gunduz: 1, gece: 3, izinli: 0 },
            { gunduz: 0, gece: 2, izinli: 1 },
            { gunduz: 1, gece: 3, izinli: 0 },
        ];

        for (let tarih = baslangicTarihi.clone(); tarih.isSameOrBefore(bitisTarihi); tarih.add(1, 'day')) {
            const pattern = patterns[gunSayac % patterns.length];
            const gunAdi = turkceGunAdi(tarih.day());

            vardiyaKayitlari.push({
                _id: `${yil}-${ay}-${gunSayac}`,
                tarih: tarih.toDate(),
                gun: gunAdi,
                gunduzPersonel: personelAdlari[pattern.gunduz],
                gecePersonel: personelAdlari[pattern.gece],
                izinliPersonel: personelAdlari[pattern.izinli],
                ay: ay,
                yil: yil
            });

            gunSayac++;
        }

        try {
            await Vardiya.deleteMany({ ay: ay, yil: yil });
            await Vardiya.insertMany(vardiyaKayitlari);
        } catch (error) {
            console.log('Veritabanı kayıt hatası - bellek modunda çalışıyor');
        }

        res.json({
            message: 'Vardiya çizelgesi başarıyla oluşturuldu',
            baslangicTarihi: baslangicTarihi.format('DD.MM.YYYY'),
            bitisTarihi: bitisTarihi.format('DD.MM.YYYY'),
            kayitSayisi: vardiyaKayitlari.length,
            vardiyalar: vardiyaKayitlari
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/vardiya/:ay/:yil', async (req, res) => {
    try {
        const { ay, yil } = req.params;

        let vardiya = [];
        try {
            vardiya = await Vardiya.find({ ay: parseInt(ay), yil: parseInt(yil) })
                .sort({ tarih: 1 });
        } catch (error) {
            console.log('Veritabanı okuma hatası - boş liste döndürülüyor');
        }

        res.json(vardiya);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/izinler', async (req, res) => {
    try {
        const izinler = await izinleriOku();
        res.json(izinler);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/izinler', async (req, res) => {
    try {
        const { personel, baslangic, bitis } = req.body;
        
        if (!personel || !baslangic || !bitis) {
            return res.status(400).json({ message: 'Eksik veri gönderildi' });
        }

        const izinler = await izinleriOku();
        
        const yeniIzin = {
            _id: Date.now().toString(),
            personel,
            baslangic,
            bitis,
            createdAt: new Date().toISOString()
        };

        izinler.push(yeniIzin);
        const kaydedildi = await izinleriKaydet(izinler);

        if (kaydedildi) {
            res.status(201).json(yeniIzin);
        } else {
            res.status(500).json({ message: 'Izin kaydedilemedi' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/izinler/:id', async (req, res) => {
    try {
        const izinler = await izinleriOku();
        const filtrelenmisIzinler = izinler.filter(izin => izin._id !== req.params.id);

        const kaydedildi = await izinleriKaydet(filtrelenmisIzinler);

        if (kaydedildi) {
            res.json({ message: 'Izin başarıyla silindi' });
        } else {
            res.status(500).json({ message: 'Izin silinemedi' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/izinler', async (req, res) => {
    try {
        const kaydedildi = await izinleriKaydet([]);

        if (kaydedildi) {
            res.json({ message: 'Tüm izinler temizlendi' });
        } else {
            res.status(500).json({ message: 'Izinler temizlenemedi' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

function turkceGunAdi(gunIndex) {
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return gunler[gunIndex];
}

app.use(express.static(__dirname, { index: false }));

const bindHost = process.env.BIND_HOST;
const onListen = () => {
    console.log('===================================');
    console.log(`Vardiya sunucusu ${bindHost || '(varsayilan)'}:${PORT}`);
    console.log(`Trust proxy: ${useTrustProxy}`);
    if (PUBLIC_URL_PATH) {
        console.log(`PUBLIC_URL_PATH=${PUBLIC_URL_PATH}`);
    }
    console.log(`CORS izinli origin sayisi: ${corsOriginSet.size}`);
    console.log('===================================');
};
if (bindHost) {
    app.listen(PORT, bindHost, onListen);
} else {
    app.listen(PORT, onListen);
}

module.exports = app;
