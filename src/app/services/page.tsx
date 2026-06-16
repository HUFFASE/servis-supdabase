'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, InputNumber, Space, Typography, Popconfirm } from 'antd';
import { message } from '@/lib/antd';
import { BuildOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';
import { useApp, Service } from '@/context/AppContext';

const { Title, Text } = Typography;

export default function ServicesPage() {
  const { user, services, brands, addService, updateService, deleteService } = useApp();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  const isEditor = user?.role === 'Direktör' || user?.role === 'Müdür';

  const openAddDrawer = () => {
    setSelectedService(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEditDrawer = (service: Service) => {
    setSelectedService(service);
    form.setFieldsValue({
      name: service.name,
      brand_id: service.brand_id,
      description: service.description,
      price_per_hour: service.price_per_hour,
    });
    setDrawerVisible(true);
  };

  const onSave = (values: any) => {
    if (selectedService) {
      updateService(selectedService.id, values);
      message.success('Hizmet başarıyla güncellendi.');
    } else {
      addService(values);
      message.success('Yeni hizmet kataloğa başarıyla eklendi.');
    }
    setDrawerVisible(false);
    setSelectedService(null);
  };

  const filteredServices = services.filter((s) => {
    const matchBrand = filterBrand ? s.brand_id === filterBrand : true;
    const q = searchQuery.toLowerCase();
    const matchSearch = searchQuery
      ? (s.name?.toLowerCase().includes(q) ||
         s.brand_name?.toLowerCase().includes(q) ||
         s.description?.toLowerCase().includes(q))
      : true;
    return matchBrand && matchSearch;
  });

  const columns = [
    {
      title: 'Hizmet Adı',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Marka / Üretici',
      dataIndex: 'brand_name',
      key: 'brand_name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => <Text style={{ color: '#475569' }}>{text}</Text>,
    },
    {
      title: 'Saatlik Ücret (USD)',
      dataIndex: 'price_per_hour',
      key: 'price_per_hour',
      render: (price: number) => <Text strong style={{ color: '#10b981' }}>${price}/sa</Text>,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Service) => (
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
            title="Hizmeti Sil"
            description="Bu profesyonel hizmeti katalogdan silmek istediğinize emin misiniz?"
            onConfirm={() => {
              deleteService(record.id);
              message.success('Hizmet katalogdan silindi.');
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
            Hizmet Kataloğu (Service Catalog)
          </Title>
          <Text type="secondary">Teknoloji markalarına yönelik profesyonel ve teknik destek hizmetleri kataloğu</Text>
        </div>
        {isEditor && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddDrawer}
            style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
          >
            Yeni Hizmet Ekle
          </Button>
        )}
      </div>

      {/* Filter and List Card */}
      <Card
        className="premium-card"
        variant="borderless"
        title={
          <Space>
            <BuildOutlined style={{ color: '#0ea5e9' }} />
            <span>Tanımlı Teknik Hizmetler</span>
          </Space>
        }
        extra={
          <Space size={8}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Hizmet ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 220 }}
            />
            <Select
              allowClear
              placeholder="Markaya Göre Filtrele"
              style={{ width: 220 }}
              onChange={(val) => setFilterBrand(val)}
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
      >
        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          pagination={{ pageSize: 6 }}
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
        title={selectedService ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
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
            label="Hizmet Adı"
            rules={[{ required: true, message: 'Lütfen hizmet adını girin!' }]}
          >
            <Input placeholder="Örn: Kurulum ve Konfigürasyon" />
          </Form.Item>
          <Form.Item
            name="brand_id"
            label="İlişkili Üretici / Marka"
            rules={[{ required: true, message: 'Lütfen bir marka seçin!' }]}
          >
            <Select
              placeholder="Marka Seçin"
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </Form.Item>
          <Form.Item
            name="price_per_hour"
            label="Saatlik Hizmet Ücreti (USD)"
            rules={[{ required: true, message: 'Lütfen saatlik ücreti girin!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Saatlik fiyat..." />
          </Form.Item>
          <Form.Item
            name="description"
            label="Açıklama"
            rules={[{ required: true, message: 'Lütfen hizmet kapsamını girin!' }]}
          >
            <Input.TextArea rows={4} placeholder="Hizmetin kapsamı ve teknik detayları..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
