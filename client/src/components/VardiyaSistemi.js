import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Select, 
  Button, 
  Table, 
  Card, 
  Space, 
  message, 
  Spin, 
  Typography,
  Divider
} from 'antd';
import { 
  CalendarOutlined, 
  ReloadOutlined, 
  PrinterOutlined,
  FilePdfOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import VardiyaTablosu from './VardiyaTablosu';

const { Title } = Typography;
const { Option } = Select;

const VardiyaSistemi = () => {
  const [ay, setAy] = useState(moment().month() + 1);
  const [yil, setYil] = useState(moment().year());
  const [vardiyalar, setVardiyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [olusturuldu, setOlusturuldu] = useState(false);

  const aylar = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  useEffect(() => {
    vardiyaGetir();
  }, [ay, yil]);

  const vardiyaGetir = async () => {
    try {
      setYukleniyor(true);
      const response = await axios.get(`/api/vardiya/${ay}/${yil}`);
      setVardiyalar(response.data);
      setOlusturuldu(response.data.length > 0);
    } catch (error) {
      console.error('Vardiyalar alınırken hata:', error);
      setOlusturuldu(false);
    } finally {
      setYukleniyor(false);
    }
  };

  const vardiyaOlustur = async () => {
    try {
      setYukleniyor(true);
      const response = await axios.post('/api/vardiya/olustur', { ay, yil });
      message.success(response.data.message);
      await vardiyaGetir();
    } catch (error) {
      message.error('Vardiya oluşturulurken hata: ' + error.response?.data?.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const tarihAraligiGetir = () => {
    const baslangic = moment(`${yil}-${ay}-15`, 'YYYY-MM-DD');
    const sonrakiAy = ay === 12 ? 1 : ay + 1;
    const sonrakiYil = ay === 12 ? yil + 1 : yil;
    const bitis = moment(`${sonrakiYil}-${sonrakiAy}-14`, 'YYYY-MM-DD');
    
    return {
      baslangic: baslangic.format('DD.MM.YYYY'),
      bitis: bitis.format('DD.MM.YYYY')
    };
  };

  const { baslangic, bitis } = tarihAraligiGetir();

  return (
    <div>
      {/* Kontrol Paneli */}
      <Card className="control-panel" style={{ marginBottom: 20 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              <CalendarOutlined /> Ay Seçimi
            </label>
            <Select
              value={ay}
              onChange={setAy}
              style={{ width: '100%' }}
              size="large"
            >
              {aylar.map((ayAdi, index) => (
                <Option key={index + 1} value={index + 1}>
                  {ayAdi}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              <CalendarOutlined /> Yıl Seçimi
            </label>
            <Select
              value={yil}
              onChange={setYil}
              style={{ width: '100%' }}
              size="large"
            >
              {[moment().year(), moment().year() + 1, moment().year() + 2].map(yil => (
                <Option key={yil} value={yil}>
                  {yil}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={vardiyaOlustur}
              loading={yukleniyor}
              style={{ width: '100%', marginTop: 24 }}
            >
              Vardiya Oluştur
            </Button>
          </Col>
          
          <Col xs={24} sm={24} md={6}>
            <Button
              size="large"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{ width: '100%', marginTop: 24 }}
              disabled={!olusturuldu}
            >
              Yazdır
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tarih Aralığı Bilgisi */}
      {olusturuldu && (
        <Card style={{ marginBottom: 20, textAlign: 'center' }}>
          <Title level={4}>
            📅 {baslangic} - {bitis} Tarihli Vardiya Çizelgesi
          </Title>
        </Card>
      )}

      {/* Vardiya Tablosu */}
      <Spin spinning={yukleniyor}>
        <VardiyaTablosu 
          vardiyalar={vardiyalar} 
          baslangicTarihi={baslangic}
          bitisTarihi={bitis}
        />
      </Spin>

      {/* Notlar */}
      {olusturuldu && (
        <Card className="notes-section">
          <Title level={5}>📋 Notlar</Title>
          <ul>
            <li>Görevi ile ilgili emir ve talimatları eksiksiz yerine getirecektir.</li>
            <li>Çalışma yerinde verilen 1 saatlik yemek ve dinlenme süresi çalışma süresine dahil edilmiştir.</li>
            <li>Nöbet vardiya sistemi 12 (on iki) saatlik nöbet sistemine göre yazılmıştır.</li>
          </ul>
        </Card>
      )}
    </div>
  );
};

export default VardiyaSistemi;
