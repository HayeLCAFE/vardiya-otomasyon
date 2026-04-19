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
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:80',
    'http://127.0.0.1:80',
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
    console.log('MongoDB bağlantısı başarısız:', err.message);
});

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

const Personel = mongoose.model('Personel', PersonelSchema);
const Vardiya = mongoose.model('Vardiya', VardiyaSchema);

const varsayilanPersonel = [
    'OSMAN UYGURALP',
    'SİNAN ACAR',
    'MUSTAFA ÖZBİLEK',
    'SELİM KUZU'
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

function personelAdAnahtar(ad) {
    return String(ad || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleUpperCase('tr-TR');
}

app.get('/api/personel', async (req, res) => {
    const adHaritasi = new Map();
    varsayilanPersonel.forEach((ad) => {
        adHaritasi.set(personelAdAnahtar(ad), ad);
    });
    try {
        const kayitlar = await Personel.find({ aktif: true }).sort({ tamAd: 1 });
        kayitlar.forEach((p) => {
            const tam = (p.tamAd || '').trim();
            if (!tam) return;
            const k = personelAdAnahtar(tam);
            if (!adHaritasi.has(k)) {
                adHaritasi.set(k, tam);
            }
        });
    } catch (error) {
        console.log('Personel DB okunamadı, yalnızca varsayılan isimler kullanılıyor');
    }
    const tamAdlar = Array.from(adHaritasi.values()).sort((a, b) =>
        a.localeCompare(b, 'tr')
    );
    const cevap = tamAdlar.map((tamAd, index) => ({
        _id: index + 1,
        tamAd,
        ad: tamAd.split(' ')[0],
        soyad: tamAd.split(' ').slice(1).join(' ') || '',
        aktif: true
    }));
    res.json(cevap);
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

const IZIN_DOSYASI = path.join(__dirname, 'izinler.json');

async function izinleriOku() {
    try {
        const data = await fs.readFile(IZIN_DOSYASI, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

async function izinleriKaydet(izinler) {
    try {
        if (!Array.isArray(izinler)) {
            return { ok: false, error: 'İç veri dizisi değil' };
        }
        await fs.writeFile(IZIN_DOSYASI, JSON.stringify(izinler, null, 2), 'utf8');
        return { ok: true };
    } catch (error) {
        console.error('İzinler kaydedilemedi:', error);
        return { ok: false, error: error.message || String(error) };
    }
}

function tarihGunMetni(deg) {
    if (deg == null || deg === '') return '';
    const s = String(deg).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
}

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

        const basStr = tarihGunMetni(baslangic);
        const bitStr = tarihGunMetni(bitis);
        if (!basStr || !bitStr) {
            return res.status(400).json({ message: 'Geçersiz tarih formatı' });
        }
        if (basStr > bitStr) {
            return res.status(400).json({ message: 'Başlangıç tarihi bitişten sonra olamaz' });
        }

        const izinler = await izinleriOku();

        const yeniIzin = {
            _id: Date.now().toString(),
            personel: String(personel).trim(),
            baslangic: basStr,
            bitis: bitStr,
            createdAt: new Date().toISOString()
        };

        izinler.push(yeniIzin);
        const sonuc = await izinleriKaydet(izinler);

        if (sonuc.ok) {
            res.status(201).json(yeniIzin);
        } else {
            res.status(500).json({
                message: 'İzin dosyasına yazılamadı',
                detail: sonuc.error
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/izinler/:id', async (req, res) => {
    try {
        const izinler = await izinleriOku();
        const filtrelenmisIzinler = izinler.filter(izin => izin._id !== req.params.id);

        const sonuc = await izinleriKaydet(filtrelenmisIzinler);

        if (sonuc.ok) {
            res.json({ message: 'İzin silindi' });
        } else {
            res.status(500).json({ message: 'İzin silinemedi', detail: sonuc.error });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/izinler', async (req, res) => {
    try {
        const sonuc = await izinleriKaydet([]);

        if (sonuc.ok) {
            res.json({ message: 'Tüm izinler temizlendi' });
        } else {
            res.status(500).json({ message: 'İzinler temizlenemedi', detail: sonuc.error });
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
