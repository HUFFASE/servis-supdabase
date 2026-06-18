'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Space, Typography, Popconfirm, Row, Col } from 'antd';
import { message } from '@/lib/antd';
import { TagsOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';
import { useApp, Brand } from '@/context/AppContext';

const { Title, Text } = Typography;

export default function BrandsPage() {
  const { user, brands, addBrand, updateBrand, deleteBrand } = useApp();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  const isEditor = user?.role === 'Direktör' || user?.role === 'Müdür';

  // Sort brands alphabetically using Turkish collation rules
  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const filteredBrands = sortedBrands.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    );
  });

  const openAddDrawer = () => {
    setSelectedBrand(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEditDrawer = (brand: Brand) => {
    setSelectedBrand(brand);
    form.setFieldsValue({
      name: brand.name,
      description: brand.description,
      logo_url: brand.logo_url,
    });
    setDrawerVisible(true);
  };

  const onSave = (values: Omit<Brand, 'id'>) => {
    if (selectedBrand) {
      updateBrand(selectedBrand.id, values);
      message.success('Marka başarıyla güncellendi.');
    } else {
      addBrand({
        ...values,
        logo_url: values.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${values.name.slice(0, 2).toUpperCase()}`,
      });
      message.success('Yeni marka başarıyla eklendi.');
    }
    setDrawerVisible(false);
    setSelectedBrand(null);
  };

  const columns = [
    {
      title: 'Logo',
      dataIndex: 'logo_url',
      key: 'logo_url',
      width: 80,
      render: (url: string, record: Brand) => (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            border: '1px solid #f1f5f9'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={record.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ),
    },
    {
      title: 'Marka Adı',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong style={{ fontSize: 14 }}>{text}</Text>,
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Tanımlı Hizmetler',
      dataIndex: 'services_count',
      key: 'services_count',
      render: (count: number) => <Tag color="blue">{count || 0} Hizmet</Tag>,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Brand) => (
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
            title="Markayı Sil"
            description="Bu markayı silmek istediğinize emin misiniz? Markaya bağlı hizmetler etkilenebilir."
            onConfirm={() => {
              deleteBrand(record.id);
              message.success('Marka silindi.');
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
            Teknoloji Markaları (Vendors)
          </Title>
          <Text type="secondary">Profesyonel hizmet verilen sistem üreticileri / markalar</Text>
        </div>
        {isEditor && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddDrawer}
            style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
          >
            Yeni Marka Ekle
          </Button>
        )}
      </div>

      {/* Grid of brand summaries */}
      <Row gutter={[20, 20]}>
        {sortedBrands.map((b) => (
          <Col xs={24} sm={12} md={6} key={b.id}>
            <Card
              className="premium-card"
              variant="borderless"
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #f1f5f9',
                    overflow: 'hidden'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo_url} alt={b.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{b.name}</Title>
                  <Tag color="geekblue" style={{ marginTop: 2 }}>{b.services_count || 0} Hizmet</Tag>
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 13, height: 40, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {b.description}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Brands Table */}
      <Card
        className="premium-card"
        variant="borderless"
        title={
          <Space>
            <TagsOutlined style={{ color: '#0ea5e9' }} />
            <span>Marka Veritabanı</span>
          </Space>
        }
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Marka adı veya açıklamada ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 260 }}
          />
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
      >
        <Table
          columns={columns}
          dataSource={filteredBrands}
          rowKey="id"
          pagination={false}
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
        title={selectedBrand ? 'Markayı Düzenle' : 'Yeni Marka Ekle'}
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
            name="name"
            label="Marka Adı"
            rules={[{ required: true, message: 'Lütfen marka adını girin!' }]}
          >
            <Input placeholder="Örn: Fortinet" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Açıklama"
            rules={[{ required: true, message: 'Lütfen marka açıklaması girin!' }]}
          >
            <Input.TextArea rows={4} placeholder="Markanın faaliyet alanı ve çözümleri..." />
          </Form.Item>
          <Form.Item
            name="logo_url"
            label="Logo URL (İsteğe Bağlı)"
          >
            <Input placeholder="Https://..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
