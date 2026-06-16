'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, InputNumber, DatePicker, Space, Typography, Popconfirm } from 'antd';
import { message } from '@/lib/antd';
import { FileProtectOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApp, Contract } from '@/context/AppContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ContractsPage() {
  const { user, contracts, customers, addContract, updateContract, deleteContract } = useApp();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [form] = Form.useForm();

  const isFinanceRestricted = user?.role === 'Presales' || user?.role === 'Postsales';
  const isEditor = user?.role === 'Direktör' || user?.role === 'Müdür';

  const openAddDrawer = () => {
    setSelectedContract(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEditDrawer = (contract: Contract) => {
    setSelectedContract(contract);
    form.setFieldsValue({
      customer_id: contract.customer_id,
      name: contract.name,
      start_date: dayjs(contract.start_date),
      end_date: dayjs(contract.end_date),
      value: contract.value,
      sla_details: contract.sla_details,
      status: contract.status,
    });
    setDrawerVisible(true);
  };

  const onSave = (values: any) => {
    const formattedValues = {
      ...values,
      start_date: values.start_date.format('YYYY-MM-DD'),
      end_date: values.end_date.format('YYYY-MM-DD'),
    };

    if (selectedContract) {
      updateContract(selectedContract.id, formattedValues);
      message.success('Destek sözleşmesi başarıyla güncellendi.');
    } else {
      addContract(formattedValues);
      message.success('Yeni destek sözleşmesi başarıyla eklendi.');
    }
    setDrawerVisible(false);
    setSelectedContract(null);
  };

  const columns = [
    {
      title: 'Müşteri',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Sözleşme Adı',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text style={{ color: '#0ea5e9', fontWeight: 500 }}>{text}</Text>,
    },
    {
      title: 'Sözleşme Bedeli (USD)',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => {
        if (isFinanceRestricted) {
          return <Tag color="default">SINIRLI YETKİ</Tag>;
        }
        return <Text strong style={{ color: '#10b981' }}>${value.toLocaleString()}</Text>;
      },
    },
    {
      title: 'Süreç Tarihleri',
      key: 'dates',
      render: (record: Contract) => (
        <Text style={{ fontSize: 12, color: '#475569' }}>
          {record.start_date} / {record.end_date}
        </Text>
      ),
    },
    {
      title: 'SLA Kapsamı',
      dataIndex: 'sla_details',
      key: 'sla_details',
      ellipsis: true,
    },
    {
      title: 'Süreç Durumu',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          Active: 'success',
          Pending: 'warning',
          Expired: 'error',
        }[status as 'Active' | 'Pending' | 'Expired'] || 'default';

        const labels = {
          Active: 'AKTİF',
          Pending: 'BEKLEMEDE',
          Expired: 'SONLANDI',
        }[status as 'Active' | 'Pending' | 'Expired'] || status;

        return <Tag color={colors} style={{ fontWeight: 500 }}>{labels}</Tag>;
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Contract) => (
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
            title="Sözleşmeyi Sil"
            description="Bu bakım sözleşmesini kaldırmak istediğinize emin misiniz? Bağlı durumdaki tüm bilet SLA sayaçları durdurulacaktır."
            onConfirm={() => {
              deleteContract(record.id);
              message.success('Bakım sözleşmesi silindi.');
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
            Kurumsal SLA ve Destek Sözleşmeleri
          </Title>
          <Text type="secondary">Müşteri bakım sözleşmeleri, hizmet süreleri ve SLA parametreleri veritabanı</Text>
        </div>
        {isEditor && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddDrawer}
            style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
          >
            Yeni Sözleşme Ekle
          </Button>
        )}
      </div>

      {/* Contracts Table Card */}
      <Card
        className="premium-card"
        variant="borderless"
        title={
          <Space>
            <FileProtectOutlined style={{ color: '#0ea5e9' }} />
            <span>Kayıtlı Destek Anlaşmaları</span>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
      >
        <Table columns={columns} dataSource={contracts} rowKey="id" pagination={{ pageSize: 8 }} size="middle" />
      </Card>

      {/* Add / Edit Drawer */}
      <Drawer
        title={selectedContract ? 'Sözleşme Bilgilerini Düzenle' : 'Yeni Bakım Sözleşmesi Ekle'}
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
            label="Sözleşmeli Müşteri"
            rules={[{ required: true, message: 'Lütfen bir müşteri seçin!' }]}
          >
            <Select
              placeholder="Müşteri Seçin"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Sözleşme Başlığı"
            rules={[{ required: true, message: 'Lütfen sözleşme başlığını girin!' }]}
          >
            <Input placeholder="Örn: Turkcell Cisco Network Destek Sözleşmesi" />
          </Form.Item>
          <Form.Item
            name="value"
            label="Sözleşme Bedeli (USD)"
            rules={[{ required: true, message: 'Lütfen sözleşme tutarını girin!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Tutar..." />
          </Form.Item>
          <Form.Item
            name="start_date"
            label="Başlangıç Tarihi"
            rules={[{ required: true, message: 'Lütfen başlangıç tarihini seçin!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="end_date"
            label="Bitiş Tarihi"
            rules={[{ required: true, message: 'Lütfen bitiş tarihini seçin!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="sla_details"
            label="SLA Parametre Detayları"
            rules={[{ required: true, message: 'Lütfen SLA kriterlerini girin!' }]}
          >
            <Input.TextArea rows={3} placeholder="Örn: 7/24 Destek, Kritik Durumlarda 2 Saat Müdahale..." />
          </Form.Item>
          <Form.Item
            name="status"
            label="Süreç Durumu"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'Active', label: 'Aktif' },
                { value: 'Pending', label: 'Beklemede' },
                { value: 'Expired', label: 'Sonlandı / Geçersiz' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
