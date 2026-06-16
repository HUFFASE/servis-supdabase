'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, DatePicker, Space, Typography, Popconfirm, Tabs, Row, Col } from 'antd';
import { message } from '@/lib/antd';
import { SafetyCertificateOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useApp, Certificate, CertificateDefinition } from '@/context/AppContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function CertificatesPage() {
  const { 
    user, 
    certificates, 
    certificateDefinitions, 
    brands, 
    profiles, 
    addCertificate, 
    updateCertificate, 
    deleteCertificate,
    addCertificateDefinition,
    updateCertificateDefinition,
    deleteCertificateDefinition
  } = useApp();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('assignments');

  // Drawers State
  const [defDrawerVisible, setDefDrawerVisible] = useState(false);
  const [assignDrawerVisible, setAssignDrawerVisible] = useState(false);

  // Selected Records for Edit
  const [selectedDef, setSelectedDef] = useState<CertificateDefinition | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Forms
  const [formDef] = Form.useForm();
  const [formAssign] = Form.useForm();
  const watchedProfileId = Form.useWatch('profile_id', formAssign);

  const isEditor = user?.role === 'Direktör' || user?.role === 'Müdür';

  // --- Certificate Definition Library Drawer Actions ---
  const openAddDefDrawer = () => {
    setSelectedDef(null);
    formDef.resetFields();
    setDefDrawerVisible(true);
  };

  const openEditDefDrawer = (def: CertificateDefinition) => {
    setSelectedDef(def);
    formDef.setFieldsValue({
      name: def.name,
      brand_id: def.brand_id,
    });
    setDefDrawerVisible(true);
  };

  const onSaveDef = (values: any) => {
    if (selectedDef) {
      updateCertificateDefinition(selectedDef.id, values);
      message.success('Sertifika tanımı kütüphanede başarıyla güncellendi.');
    } else {
      addCertificateDefinition(values);
      message.success('Yeni sertifika kütüphaneye başarıyla eklendi.');
    }
    setDefDrawerVisible(false);
    setSelectedDef(null);
  };

  // --- Certificate Assignment Drawer Actions ---
  const openAddAssignDrawer = () => {
    setSelectedCert(null);
    formAssign.resetFields();
    formAssign.setFieldsValue({
      assignments: [{}] // pre-populate with one item
    });
    setAssignDrawerVisible(true);
  };

  const openEditAssignDrawer = (cert: Certificate) => {
    setSelectedCert(cert);
    // Find matching definition to prepopulate the Select definition dropdown
    const matchingDef = certificateDefinitions.find(
      (d) => d.name === cert.name && d.brand_id === cert.brand_id
    );

    formAssign.setFieldsValue({
      def_id: matchingDef?.id,
      profile_id: cert.profile_id,
      issue_date: dayjs(cert.issue_date),
      expiry_date: dayjs(cert.expiry_date),
    });
    setAssignDrawerVisible(true);
  };

  const onSaveAssign = (values: any) => {
    if (selectedCert) {
      // Find the definition details (name, brand) based on selected definition ID
      const certDef = certificateDefinitions.find((d) => d.id === values.def_id);
      if (!certDef) {
        message.error('Lütfen geçerli bir sertifika tanımı seçin.');
        return;
      }

      const formattedValues = {
        name: certDef.name,
        brand_id: certDef.brand_id,
        issue_date: values.issue_date.format('YYYY-MM-DD'),
        expiry_date: values.expiry_date.format('YYYY-MM-DD'),
      };

      updateCertificate(selectedCert.id, {
        ...formattedValues,
        profile_id: values.profile_id,
      });
      message.success('Mühendis sertifika ataması başarıyla güncellendi.');
    } else {
      // Create multiple assignment records for the selected profile in bulk mode
      const profileId = values.profile_id;
      const assignments = values.assignments || [];

      if (assignments.length === 0) {
        message.warning('Lütfen en az bir sertifika seçin.');
        return;
      }

      let count = 0;
      assignments.forEach((item: any) => {
        const certDef = certificateDefinitions.find((d) => d.id === item.def_id);
        if (certDef && item.issue_date && item.expiry_date) {
          addCertificate({
            name: certDef.name,
            brand_id: certDef.brand_id,
            profile_id: profileId,
            issue_date: item.issue_date.format('YYYY-MM-DD'),
            expiry_date: item.expiry_date.format('YYYY-MM-DD'),
          });
          count++;
        }
      });
      message.success(`${count} adet sertifika başarıyla kaydedildi ve atandı.`);
    }
    setAssignDrawerVisible(false);
    setSelectedCert(null);
  };

  // --- Table Columns Definition ---

  // Columns for Tab 1: Certificate Library
  const defColumns = [
    {
      title: 'Logo',
      dataIndex: 'brand_id',
      key: 'brand_logo',
      width: 80,
      render: (brandId: string) => {
        const brand = brands.find(b => b.id === brandId);
        return brand?.logo_url ? (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8fafc',
              border: '1px solid #f1f5f9'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logo_url} alt={brand.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
        ) : null;
      }
    },
    {
      title: 'Sertifika Adı',
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
      title: 'İşlemler',
      key: 'actions',
      render: (record: CertificateDefinition) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#0ea5e9' }} />}
            onClick={() => openEditDefDrawer(record)}
            disabled={!isEditor}
          >
            Düzenle
          </Button>
          <Popconfirm
            title="Sertifika Tanımını Sil"
            description="Bu sertifika tanımını kütüphaneden silmek istediğinize emin misiniz? Atanmış personel kayıtları etkilenebilir."
            onConfirm={() => {
              deleteCertificateDefinition(record.id);
              message.success('Sertifika kütüphaneden silindi.');
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

  // Columns for Tab 2: Personnel Assignments
  const assignColumns = [
    {
      title: 'Sertifika Adı',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Certificate, b: Certificate) => a.name.localeCompare(b.name, 'tr'),
      render: (text: string) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Marka / Üretici',
      dataIndex: 'brand_name',
      key: 'brand_name',
      sorter: (a: Certificate, b: Certificate) => (a.brand_name || '').localeCompare(b.brand_name || '', 'tr'),
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Sahip Personel',
      dataIndex: 'profile_name',
      key: 'profile_name',
      sorter: (a: Certificate, b: Certificate) => (a.profile_name || '').localeCompare(b.profile_name || '', 'tr'),
      render: (text: string) => (
        <Text style={{ fontSize: 13, fontWeight: 500 }}>{text}</Text>
      ),
    },
    {
      title: 'Alınma Tarihi',
      dataIndex: 'issue_date',
      key: 'issue_date',
      sorter: (a: Certificate, b: Certificate) => a.issue_date.localeCompare(b.issue_date),
      render: (date: string) => <Text style={{ fontSize: 12, color: '#475569' }}>{date}</Text>,
    },
    {
      title: 'Geçerlilik Tarihi',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      sorter: (a: Certificate, b: Certificate) => a.expiry_date.localeCompare(b.expiry_date),
      render: (date: string, record: Certificate) => {
        const isExpired = record.status === 'Expired';
        const isExpiring = record.status === 'Expiring';
        return (
          <Space>
            <ClockCircleOutlined style={{ color: isExpired ? '#ef4444' : isExpiring ? '#f59e0b' : '#64748b' }} />
            <Text delete={isExpired} style={{ fontSize: 12, color: isExpired ? '#ef4444' : isExpiring ? '#f59e0b' : '#475569', fontWeight: isExpiring || isExpired ? 500 : 'normal' }}>
              {date}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: Certificate, b: Certificate) => a.status.localeCompare(b.status),
      render: (status: string) => {
        const config = {
          Active: { color: 'success', label: 'AKTİF' },
          Expiring: { color: 'warning', label: 'SON 30 GÜN' },
          Expired: { color: 'error', label: 'SÜRESİ DOLDU' },
        }[status as 'Active' | 'Expiring' | 'Expired'] || { color: 'default', label: status };

        return <Tag color={config.color} style={{ fontWeight: 500 }}>{config.label}</Tag>;
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Certificate) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#0ea5e9' }} />}
            onClick={() => openEditAssignDrawer(record)}
          >
            Düzenle
          </Button>
          <Popconfirm
            title="Sertifika Atamasını Sil"
            description="Bu mühendisin sertifika atamasını sistemden kaldırmak istediğinize emin misiniz?"
            onConfirm={() => {
              deleteCertificate(record.id);
              message.success('Atama kaydı silindi.');
            }}
            okText="Sil"
            cancelText="İptal"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              Sil
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Sort assignments first by certificate name and then by owner's name
  const sortedCertificates = [...certificates].sort((a, b) => {
    const certCompare = a.name.localeCompare(b.name, 'tr');
    if (certCompare !== 0) return certCompare;
    const nameA = a.profile_name || '';
    const nameB = b.profile_name || '';
    return nameA.localeCompare(nameB, 'tr');
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Personel Yetkinlik & Sertifika Yönetimi
          </Title>
          <Text type="secondary">Üretici yetkinlik kütüphanesi ve ekip üyelerinin sertifika atamaları</Text>
        </div>
        <div>
          {activeTab === 'library' ? (
            isEditor && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddDefDrawer}
                style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
              >
                Yeni Sertifika Tanımla
              </Button>
            )
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddAssignDrawer}
              style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
            >
              Mühendise Sertifika Ata
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Container */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        type="line"
        size="large"
        items={[
          {
            key: 'assignments',
            label: (
              <Space>
                <SafetyCertificateOutlined />
                <span>Mühendis Sertifika Atamaları ({certificates.length})</span>
              </Space>
            ),
            children: (
              <Card
                className="premium-card"
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
              >
                <Table 
                  columns={assignColumns} 
                  dataSource={sortedCertificates} 
                  rowKey="id" 
                  pagination={{ pageSize: 8 }} 
                  size="middle" 
                />
              </Card>
            )
          },
          {
            key: 'library',
            label: (
              <Space>
                <BookOutlined />
                <span>Sertifika Kütüphanesi ({certificateDefinitions.length})</span>
              </Space>
            ),
            children: (
              <Card
                className="premium-card"
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
              >
                <Table 
                  columns={defColumns} 
                  dataSource={certificateDefinitions} 
                  rowKey="id" 
                  pagination={{ pageSize: 8 }} 
                  size="middle" 
                />
              </Card>
            )
          }
        ]}
      />

      {/* 1. Certificate Definition Drawer (Library) */}
      <Drawer
        title={selectedDef ? 'Sertifika Tanımını Düzenle' : 'Yeni Sertifika Tanımla'}
        size={380}
        onClose={() => setDefDrawerVisible(false)}
        open={defDrawerVisible}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setDefDrawerVisible(false)}>İptal</Button>
            <Button type="primary" onClick={() => formDef.submit()} style={{ backgroundColor: '#002b49' }}>
              Kaydet
            </Button>
          </Space>
        }
      >
        <Form form={formDef} layout="vertical" onFinish={onSaveDef}>
          <Form.Item
            name="name"
            label="Sertifika Adı"
            rules={[{ required: true, message: 'Lütfen sertifika adını girin!' }]}
          >
            <Input placeholder="Örn: CCIE Enterprise Infrastructure" />
          </Form.Item>
          <Form.Item
            name="brand_id"
            label="İlişkili Üretici / Marka"
            rules={[{ required: true, message: 'Lütfen ilişkili markayı seçin!' }]}
          >
            <Select
              placeholder="Marka Seçin"
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 2. Certificate Assignment Drawer */}
      <Drawer
        title={selectedCert ? 'Sertifika Atamasını Düzenle' : 'Mühendise Toplu Sertifika Ata'}
        size={selectedCert ? 400 : 540}
        onClose={() => setAssignDrawerVisible(false)}
        open={assignDrawerVisible}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setAssignDrawerVisible(false)}>İptal</Button>
            <Button type="primary" onClick={() => formAssign.submit()} style={{ backgroundColor: '#002b49' }}>
              {selectedCert ? 'Güncelle' : 'Kaydet ve Ata'}
            </Button>
          </Space>
        }
      >
        <Form form={formAssign} layout="vertical" onFinish={onSaveAssign}>
          {selectedCert ? (
            <>
              <Form.Item
                name="def_id"
                label="Kütüphaneden Sertifika Seçin"
                rules={[{ required: true, message: 'Lütfen kütüphaneden bir sertifika seçin!' }]}
              >
                <Select
                  placeholder="Sertifika Seçin"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={certificateDefinitions.map((d) => ({ 
                    value: d.id, 
                    label: `${d.name} (${d.brand_name})` 
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="profile_id"
                label="Sertifika Sahibi Personel"
                rules={[{ required: true, message: 'Lütfen sertifikaya sahip personeli seçin!' }]}
              >
                <Select
                  placeholder="Personel Seçin"
                  options={profiles.map((p) => ({ value: p.id, label: `${p.full_name} (${p.role})` }))}
                />
              </Form.Item>
              <Form.Item
                name="issue_date"
                label="Alınma Tarihi"
                rules={[{ required: true, message: 'Lütfen alınma tarihini seçin!' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                name="expiry_date"
                label="Geçerlilik Bitiş Tarihi"
                rules={[{ required: true, message: 'Lütfen geçerlilik bitiş tarihini seçin!' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="profile_id"
                label="Sertifika Sahibi Personel"
                rules={[{ required: true, message: 'Lütfen sertifikaların atanacağı personeli seçin!' }]}
                style={{ marginBottom: 20 }}
              >
                <Select
                  placeholder="Personel Seçin"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={profiles.map((p) => ({ value: p.id, label: `${p.full_name} (${p.role})` }))}
                />
              </Form.Item>

              {watchedProfileId && (() => {
                const userCerts = certificates.filter((c) => c.profile_id === watchedProfileId);
                if (userCerts.length === 0) return null;
                return (
                  <div style={{ marginBottom: 20, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 12, color: '#475569' }}>Personelin Mevcut Sertifikaları ({userCerts.length}):</Text>
                    </div>
                    <Space size={[4, 8]} wrap>
                      {userCerts.map((c) => {
                        const colors = {
                          Active: 'success',
                          Expiring: 'warning',
                          Expired: 'error',
                        }[c.status] || 'default';
                        return (
                          <Tag key={c.id} color={colors} style={{ fontSize: 11, fontWeight: 500, margin: 0 }}>
                            {c.name}
                          </Tag>
                        );
                      })}
                    </Space>
                  </div>
                );
              })()}

              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" strong style={{ fontSize: 13 }}>Atanacak Sertifikalar</Text>
              </div>

              <Form.List name="assignments">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => {
                      const { key, ...fieldRest } = field;
                      return (
                        <Card
                          key={key}
                          size="small"
                          style={{
                            marginBottom: 16,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 4px 0 rgba(0,0,0,0.01)',
                            background: '#f8fafc'
                          }}
                          title={
                            <Space size={6}>
                              <SafetyCertificateOutlined style={{ color: '#0ea5e9' }} />
                              <Text strong style={{ fontSize: 12 }}>Sertifika Ataması #{field.name + 1}</Text>
                            </Space>
                          }
                          extra={
                            fields.length > 1 && (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                                style={{ padding: '0 4px', height: 'auto' }}
                              />
                            )
                          }
                        >
                          <Form.Item
                            {...fieldRest}
                            name={[field.name, 'def_id']}
                            label={<span style={{ fontSize: 12, fontWeight: 500 }}>Sertifika Seçimi</span>}
                            rules={[{ required: true, message: 'Sertifika seçilmelidir!' }]}
                            style={{ marginBottom: 12 }}
                          >
                            <Select
                              placeholder="Kütüphaneden sertifika seçin"
                              showSearch
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              options={certificateDefinitions.map((d) => ({ 
                                value: d.id, 
                                label: `${d.name} (${d.brand_name})` 
                              }))}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item
                                {...fieldRest}
                                name={[field.name, 'issue_date']}
                                label={<span style={{ fontSize: 12, fontWeight: 500 }}>Alınma Tarihi</span>}
                                rules={[{ required: true, message: 'Alınma tarihi seçin!' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Seçin" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...fieldRest}
                                name={[field.name, 'expiry_date']}
                                label={<span style={{ fontSize: 12, fontWeight: 500 }}>Bitiş Tarihi</span>}
                                rules={[{ required: true, message: 'Bitiş tarihi seçin!' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Seçin" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      );
                    })}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      style={{ 
                        borderRadius: 6,
                        borderStyle: 'dashed',
                        borderColor: '#94a3b8',
                        color: '#475569',
                        height: 38
                      }}
                    >
                      Yeni Sertifika Ekle
                    </Button>
                  </>
                )}
              </Form.List>
            </>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
