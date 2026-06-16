'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, InputNumber, Space, Typography, Popconfirm } from 'antd';
import { message } from '@/lib/antd';
import { ProjectOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';
import { useApp, OneOff } from '@/context/AppContext';

const { Title, Text } = Typography;

export default function OneOffsPage() {
  const { user, oneOffs, customers, addOneOff, updateOneOff, deleteOneOff } = useApp();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOneOff, setSelectedOneOff] = useState<OneOff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  const isFinanceRestricted = user?.role === 'Presales' || user?.role === 'Postsales';
  const isEditor = user?.role === 'Direktör' || user?.role === 'Müdür';

  const filteredOneOffs = oneOffs.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.customer_name?.toLowerCase().includes(q) ||
      o.name?.toLowerCase().includes(q)
    );
  });

  const openAddDrawer = () => {
    setSelectedOneOff(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEditDrawer = (oneOff: OneOff) => {
    setSelectedOneOff(oneOff);
    form.setFieldsValue({
      customer_id: oneOff.customer_id,
      name: oneOff.name,
      amount: oneOff.amount,
      status: oneOff.status,
    });
    setDrawerVisible(true);
  };

  const onSave = (values: any) => {
    if (selectedOneOff) {
      updateOneOff(selectedOneOff.id, values);
      message.success('Proje detayları başarıyla güncellendi.');
    } else {
      addOneOff(values);
      message.success('Yeni tek seferlik proje başarıyla kaydedildi.');
    }
    setDrawerVisible(false);
    setSelectedOneOff(null);
  };

  const columns = [
    {
      title: 'Müşteri',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Proje / İş Adı',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text style={{ color: '#0ea5e9', fontWeight: 500 }}>{text}</Text>,
    },
    {
      title: 'Proje Bütçesi (USD)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => {
        if (isFinanceRestricted) {
          return <Tag color="default">SINIRLI YETKİ</Tag>;
        }
        return <Text strong style={{ color: '#10b981' }}>${amount.toLocaleString()}</Text>;
      },
    },
    {
      title: 'Proje Aşaması',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          Draft: { color: 'default', label: 'TASLAK' },
          'In Progress': { color: 'processing', label: 'DEVAM EDİYOR' },
          Completed: { color: 'success', label: 'TAMAMLANDI' },
        }[status as 'Draft' | 'In Progress' | 'Completed'] || { color: 'default', label: status };

        return <Tag color={config.color} style={{ fontWeight: 500 }}>{config.label}</Tag>;
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: OneOff) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#0ea5e9' }} />}
            onClick={() => openEditDrawer(record)}
            disabled={!isEditor}
          >
            Düzenle
          </Button>
          <Popconfirm
            title="Projeyi Sil"
            description="Bu projeyi listeden silmek istediğinize emin misiniz?"
            onConfirm={() => {
              deleteOneOff(record.id);
              message.success('Proje kaydı listeden silindi.');
            }}
            okText="Sil"
            cancelText="İptal"
            disabled={!isEditor}
          >
            <Button type="text" danger icon={<DeleteOutlined />} disabled={!isEditor}>
              Sil
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Tek Seferlik Projeler & Kurulumlar
          </Title>
          <Text type="secondary">Sözleşme harici yapılan anahtar teslim kurulumlar, migrasyonlar ve ek işler</Text>
        </div>
        {isEditor && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddDrawer}
            style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
          >
            Yeni Proje Ekle
          </Button>
        )}
      </div>

      {/* Database Table Card */}
      <Card
        className="premium-card"
        variant="borderless"
        title={
          <Space>
            <ProjectOutlined style={{ color: '#0ea5e9' }} />
            <span>Proje Portföyü</span>
          </Space>
        }
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Müşteri veya proje ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 280 }}
          />
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
      >
        <Table
          columns={columns}
          dataSource={filteredOneOffs}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          size="middle"
          locale={{
            emptyText: (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8' }}>
                <InboxOutlined style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>Kayıt bulunamadı</div>
              </div>
            ),
          }}
        />
      </Card>

      {/* Add / Edit Drawer */}
      <Drawer
        title={selectedOneOff ? 'Proje Bilgilerini Düzenle' : 'Yeni Tek Seferlik Proje Ekle'}
        size={380}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>İptal</Button>
            <Button type="primary" onClick={() => form.submit()} style={{ backgroundColor: '#002b49' }}>
              Kaydet
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item
            name="customer_id"
            label="Proje Müşterisi"
            rules={[{ required: true, message: 'Lütfen bir müşteri seçin!' }]}
          >
            <Select
              placeholder="Müşteri Seçin"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Proje / İş Başlığı"
            rules={[{ required: true, message: 'Lütfen proje başlığını girin!' }]}
          >
            <Input placeholder="Örn: Turkcell Kartal Veri Merkezi Migrasyonu" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Proje Bütçesi (USD)"
            rules={[{ required: true, message: 'Lütfen proje bütçesini girin!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Bütçe tutarı..." />
          </Form.Item>
          <Form.Item
            name="status"
            label="Proje Aşaması"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'Draft', label: 'Taslak' },
                { value: 'In Progress', label: 'Devam Ediyor' },
                { value: 'Completed', label: 'Tamamlandı' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
