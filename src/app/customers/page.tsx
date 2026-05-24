'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Space, Typography, Popconfirm, message, Tabs, Descriptions, Divider, Avatar } from 'antd';
import { TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, CustomerServiceOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useApp, Customer } from '@/context/AppContext';

const { Title, Text } = Typography;

export default function CustomersPage() {
  const { user, customers, contracts, cases, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  // Customer Detail Drawer State
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailCust, setDetailCust] = useState<Customer | null>(null);

  const isEditor = user?.role === 'Direktör' || user?.role === 'Müdür';

  const openAddDrawer = () => {
    setSelectedCust(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEditDrawer = (customer: Customer) => {
    setSelectedCust(customer);
    form.setFieldsValue({
      name: customer.name,
      industry: customer.industry,
      contact_person: customer.contact_person,
      email: customer.email,
      phone: customer.phone,
    });
    setDrawerVisible(true);
  };

  const openDetailDrawer = (customer: Customer) => {
    setDetailCust(customer);
    setDetailVisible(true);
  };

  const onSave = (values: any) => {
    if (selectedCust) {
      updateCustomer(selectedCust.id, values);
      message.success('Müşteri hesabı başarıyla güncellendi.');
    } else {
      addCustomer(values);
      message.success('Yeni müşteri başarıyla kaydedildi.');
    }
    setDrawerVisible(false);
    setSelectedCust(null);
  };

  const columns = [
    {
      title: 'Müşteri Adı',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customer) => (
        <Button
          type="link"
          onClick={() => openDetailDrawer(record)}
          style={{ padding: 0, fontWeight: 600, fontSize: 13, height: 'auto', verticalAlign: 'middle' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Sektör',
      dataIndex: 'industry',
      key: 'industry',
      render: (text: string) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: 'İlgili Kişi',
      dataIndex: 'contact_person',
      key: 'contact_person',
      render: (text: string) => <Text style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{text}</Text>,
    },
    {
      title: 'İrtibat E-posta',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => <Text style={{ color: '#475569' }}>{text}</Text>,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => <Text style={{ color: '#475569' }}>{text}</Text>,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Customer) => (
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
            title="Müşteriyi Sil"
            description="Bu müşteriyi silmek istediğinize emin misiniz? Sözleşmeler ve açılmış tüm destek talepleri silinecektir!"
            onConfirm={() => {
              deleteCustomer(record.id);
              message.success('Müşteri kaydı silindi.');
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
            Müşteri Hesapları (CRM)
          </Title>
          <Text type="secondary">Sisteme kayıtlı kurumsal müşteriler, irtibat bilgileri ve sektör tanımlamaları</Text>
        </div>
        {isEditor && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddDrawer}
            style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
          >
            Yeni Müşteri Ekle
          </Button>
        )}
      </div>

      {/* CRM Database Table Card */}
      <Card
        bordered={false}
        title={
          <Space>
            <TeamOutlined style={{ color: '#0ea5e9' }} />
            <span>Müşteri Hesapları Veritabanı</span>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
      >
        <Table columns={columns} dataSource={customers} rowKey="id" pagination={{ pageSize: 8 }} size="middle" />
      </Card>

      {/* Add / Edit Drawer */}
      <Drawer
        title={selectedCust ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Hesabı Ekle'}
        width={380}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        destroyOnClose
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
            label="Müşteri Adı / Ünvanı"
            rules={[{ required: true, message: 'Lütfen müşteri ünvanını girin!' }]}
          >
            <Input placeholder="Örn: Turkcell İletişim A.Ş." />
          </Form.Item>
          <Form.Item
            name="industry"
            label="Sektör"
            rules={[{ required: true, message: 'Lütfen bir sektör girin!' }]}
          >
            <Input placeholder="Örn: Telekomünikasyon, Finans, Sağlık..." />
          </Form.Item>
          <Form.Item
            name="contact_person"
            label="İlgili Kişi Ad Soyad"
            rules={[{ required: true, message: 'Lütfen ilgili kişi ad soyad bilgisini girin!' }]}
          >
            <Input placeholder="Örn: Mehmet Öz" />
          </Form.Item>
          <Form.Item
            name="email"
            label="İrtibat E-posta Adresi"
            rules={[{ required: true, message: 'Lütfen irtibat e-postasını girin!' }, { type: 'email', message: 'Geçersiz e-posta adresi!' }]}
          >
            <Input placeholder="Örn: mehmet.oz@turkcell.com" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="İrtibat Telefonu"
            rules={[{ required: true, message: 'Lütfen irtibat telefon numarasını girin!' }]}
          >
            <Input placeholder="Örn: 0532..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Customer Detail Drawer */}
      <Drawer
        title={
          <Space>
            <TeamOutlined style={{ color: '#0ea5e9' }} />
            <span>Müşteri Detay Kartı - {detailCust?.name}</span>
          </Space>
        }
        width={600}
        onClose={() => {
          setDetailVisible(false);
          setDetailCust(null);
        }}
        open={detailVisible}
        destroyOnClose
      >
        {detailCust && (() => {
          const custContracts = contracts.filter((c) => c.customer_id === detailCust.id);
          const custCases = cases.filter((c) => c.customer_id === detailCust.id);
          const openCases = custCases.filter((c) => c.status === 'Open' || c.status === 'In Progress');
          const closedCases = custCases.filter((c) => c.status === 'Resolved' || c.status === 'Closed');

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Profile Card */}
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #002b49 0%, #003a60 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0, 43, 73, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar
                    size={64}
                    style={{ backgroundColor: '#0ea5e9', fontSize: 24, fontWeight: 'bold' }}
                  >
                    {detailCust.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                  <div>
                    <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
                      {detailCust.name}
                    </Typography.Title>
                    <Tag color="cyan" style={{ marginTop: 6, fontWeight: 500 }}>
                      {detailCust.industry}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* Tabs Inside Drawer */}
              <Tabs
                defaultActiveKey="info"
                type="line"
                items={[
                  {
                    key: 'info',
                    label: (
                      <Space>
                        <CalendarOutlined />
                        <span>Müşteri & Kontrat Bilgileri</span>
                      </Space>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 12 }}>
                        {/* Core Details */}
                        <Descriptions title="İletişim Bilgileri" bordered column={1} size="small">
                          <Descriptions.Item label="Sektör">{detailCust.industry}</Descriptions.Item>
                          <Descriptions.Item label="İlgili Kişi">{detailCust.contact_person}</Descriptions.Item>
                          <Descriptions.Item label="E-posta">{detailCust.email}</Descriptions.Item>
                          <Descriptions.Item label="Telefon">{detailCust.phone}</Descriptions.Item>
                        </Descriptions>

                        <Divider style={{ margin: '8px 0' }} />

                        {/* Contract Details */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                              Destek Sözleşmeleri ({custContracts.length})
                            </Typography.Title>
                          </div>

                          {custContracts.length === 0 ? (
                            <Card style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                              <Text type="secondary">Bu müşteriye ait aktif bir sözleşme bulunmamaktadır.</Text>
                            </Card>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {custContracts.map((contract) => (
                                <Card
                                  key={contract.id}
                                  size="small"
                                  style={{
                                    borderRadius: 8,
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 4px 0 rgba(0,0,0,0.01)',
                                  }}
                                  title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text strong style={{ fontSize: 13 }}>{contract.name}</Text>
                                      <Tag color={contract.status === 'Active' ? 'success' : 'default'} style={{ fontWeight: 500 }}>
                                        {contract.status === 'Active' ? 'AKTİF' : 'PASİF'}
                                      </Tag>
                                    </div>
                                  }
                                >
                                  <Descriptions column={1} size="small" style={{ marginTop: 4 }}>
                                    <Descriptions.Item label="Sözleşme Süresi">
                                      <Space>
                                        <CalendarOutlined style={{ color: '#64748b' }} />
                                        <span>{contract.start_date} / {contract.end_date}</span>
                                      </Space>
                                    </Descriptions.Item>
                                    {/* Only show value to Direktör & Müdür for safety */}
                                    {(user?.role === 'Direktör' || user?.role === 'Müdür') && (
                                      <Descriptions.Item label="Sözleşme Değeri">
                                        <Text strong style={{ color: '#0ea5e9' }}>
                                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(contract.value)}
                                        </Text>
                                      </Descriptions.Item>
                                    )}
                                    <Descriptions.Item label="SLA Detayları">
                                      <span style={{ fontSize: 12, color: '#475569' }}>{contract.sla_details}</span>
                                    </Descriptions.Item>
                                  </Descriptions>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'active-cases',
                    label: (
                      <Space>
                        <CustomerServiceOutlined />
                        <span>Açık Talepler ({openCases.length})</span>
                      </Space>
                    ),
                    children: (
                      <div style={{ paddingTop: 12 }}>
                        {openCases.length === 0 ? (
                          <Card style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                            <Text type="secondary">Bu müşteriye ait aktif/açık bir destek talebi bulunmuyor.</Text>
                          </Card>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {openCases.map((c) => {
                              const severityColors = {
                                Critical: '#ef4444',
                                High: '#f59e0b',
                                Medium: '#0ea5e9',
                                Low: '#10b981',
                              }[c.severity];

                              return (
                                <Card
                                  key={c.id}
                                  size="small"
                                  style={{
                                    borderRadius: 8,
                                    border: '1px solid #e2e8f0',
                                    borderLeft: `4px solid ${severityColors}`,
                                  }}
                                  title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text strong style={{ fontSize: 13 }}>{c.title}</Text>
                                      <Tag color={c.status === 'Open' ? 'error' : 'warning'} style={{ fontWeight: 500 }}>
                                        {c.status === 'Open' ? 'AÇIK' : 'İŞLEMDE'}
                                      </Tag>
                                    </div>
                                  }
                                >
                                  <div style={{ marginBottom: 10 }}>
                                    <Text style={{ fontSize: 12, color: '#64748b' }}>{c.description}</Text>
                                  </div>
                                  <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Önem Derecesi">
                                      <Tag color={c.severity === 'Critical' ? 'error' : c.severity === 'High' ? 'warning' : 'blue'}>
                                        {c.severity}
                                      </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Atanan Mühendis">
                                      <Space size={6}>
                                        <UserOutlined style={{ color: '#0ea5e9' }} />
                                        <Text strong style={{ fontSize: 12 }}>{c.assigned_name}</Text>
                                      </Space>
                                    </Descriptions.Item>
                                    {(c.status === 'Open' || c.status === 'In Progress') && c.sla_countdown_hours > 0 && (
                                      <Descriptions.Item label="Kalan SLA Süresi">
                                        <Space size={6}>
                                          <ClockCircleOutlined style={{ color: c.sla_countdown_hours <= 4 ? '#ef4444' : '#64748b' }} />
                                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: c.sla_countdown_hours <= 4 ? '#ef4444' : 'inherit' }}>
                                            {c.sla_countdown_hours} Saat
                                          </Text>
                                        </Space>
                                      </Descriptions.Item>
                                    )}
                                  </Descriptions>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'closed-cases',
                    label: (
                      <Space>
                        <CheckCircleOutlined />
                        <span>Çözülmüş Talepler ({closedCases.length})</span>
                      </Space>
                    ),
                    children: (
                      <div style={{ paddingTop: 12 }}>
                        {closedCases.length === 0 ? (
                          <Card style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                            <Text type="secondary">Bu müşteriye ait çözülmüş/kapanmış destek talebi bulunmuyor.</Text>
                          </Card>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {closedCases.map((c) => (
                              <Card
                                key={c.id}
                                size="small"
                                style={{
                                  borderRadius: 8,
                                  border: '1px solid #e2e8f0',
                                  borderLeft: '4px solid #10b981',
                                }}
                                title={
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: 13 }}>{c.title}</Text>
                                    <Tag color="success" style={{ fontWeight: 500 }}>
                                      {c.status === 'Resolved' ? 'ÇÖZÜLDÜ' : 'KAPANDI'}
                                    </Tag>
                                  </div>
                                }
                              >
                                <div style={{ marginBottom: 10 }}>
                                  <Text style={{ fontSize: 12, color: '#64748b' }}>{c.description}</Text>
                                </div>
                                <Descriptions column={1} size="small">
                                  <Descriptions.Item label="Önem Derecesi">{c.severity}</Descriptions.Item>
                                  <Descriptions.Item label="Atanan Mühendis">
                                    <Space size={6}>
                                      <UserOutlined style={{ color: '#10b981' }} />
                                      <Text strong style={{ fontSize: 12 }}>{c.assigned_name}</Text>
                                    </Space>
                                  </Descriptions.Item>
                                </Descriptions>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
