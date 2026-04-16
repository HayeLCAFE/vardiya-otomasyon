import React from 'react';
import { Layout, Card } from 'antd';
import VardiyaSistemi from './components/VardiyaSistemi';
import 'antd/dist/reset.css';

const { Header, Content } = Layout;

function App() {
  return (
    <Layout style={{ minHeight: '100vh', padding: '20px' }}>
      <Content>
        <Card style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="header-title">
            <h1>🏔️ BURDUR GENÇLİK VE SPOR İL MÜDÜRLÜĞÜ SALDA KAYAK MERKEZİ GÜVENLİK VARDİYASI</h1>
          </div>
          <VardiyaSistemi />
        </Card>
      </Content>
    </Layout>
  );
}

export default App;
