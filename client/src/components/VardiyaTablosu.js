import React from 'react';
import { Table, Tag } from 'antd';
import moment from 'moment';

const VardiyaTablosu = ({ vardiyalar, baslangicTarihi, bitisTarihi }) => {
  const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  const columns = [
    {
      title: 'TARİH',
      dataIndex: 'tarih',
      key: 'tarih',
      width: 120,
      render: (tarih) => moment(tarih).format('DD.MM.YYYY'),
      className: (record) => {
        const gun = moment(record.tarih).day();
        return (gun === 0 || gun === 6) ? 'weekend-row' : '';
      }
    },
    {
      title: 'GÜNLER',
      dataIndex: 'gun',
      key: 'gun',
      width: 100,
      className: (record) => {
        const gun = moment(record.tarih).day();
        return (gun === 0 || gun === 6) ? 'weekend-row' : '';
      }
    },
    {
      title: '08:00 - 20:00',
      dataIndex: 'gunduzPersonel',
      key: 'gunduzPersonel',
      width: 200,
      render: (text) => (
        <Tag color="green" className="day-shift" style={{ width: '100%', textAlign: 'center' }}>
          {text}
        </Tag>
      )
    },
    {
      title: '20:00 - 08:00',
      dataIndex: 'gecePersonel',
      key: 'gecePersonel',
      width: 200,
      render: (text) => (
        <Tag color="blue" className="night-shift" style={{ width: '100%', textAlign: 'center' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'İZİNLİ',
      dataIndex: 'izinliPersonel',
      key: 'izinliPersonel',
      width: 200,
      render: (text) => (
        <Tag color="orange" className="leave-shift" style={{ width: '100%', textAlign: 'center' }}>
          {text}
        </Tag>
      )
    }
  ];

  const rowClassName = (record) => {
    const gun = moment(record.tarih).day();
    return (gun === 0 || gun === 6) ? 'weekend-row' : '';
  };

  if (vardiyalar.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
        <h3>Henüz vardiya çizelgesi oluşturulmadı</h3>
        <p>Lütfen ay ve yıl seçip "Vardiya Oluştur" butonuna tıklayın.</p>
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={vardiyalar}
      rowKey="_id"
      pagination={false}
      size="middle"
      scroll={{ x: 800 }}
      rowClassName={rowClassName}
      bordered
      title={() => (
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          Vardiya Çizelgesi ({baslangicTarihi} - {bitisTarihi})
        </div>
      )}
    />
  );
};

export default VardiyaTablosu;
