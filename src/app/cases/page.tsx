'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, Space, Typography, Popconfirm, Avatar, Badge, List, Input as AntdInput, Tooltip, message, Divider } from 'antd';
import { CustomerServiceOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
import { useApp, Case, Profile } from '@/context/AppContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function CasesPage() {
  const { user, cases, customers, contracts, profiles, addCase, updateCase, addCaseComment, deleteCase } = useApp();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Handle drawer triggers
  const openAddDrawer = () => {
    setSelectedCase(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEditDrawer = (c: Case) => {
    setSelectedCase(c);
    form.setFieldsValue({
      customer_id: c.customer_id,
      contract_id: c.contract_id,
      title: c.title,
      description: c.description,
      severity: c.severity,
      status: c.status,
      assigned_to: c.assigned_to,
    });
    setDrawerVisible(true);
  };

  const onSave = (values: any) => {
    if (selectedCase) {
      updateCase(selectedCase.id, values);
      message.success('Destek talebi başarıyla güncellendi.');
    } else {
      addCase(values);
      message.success('Yeni destek talebi başarıyla oluşturuldu, SLA sayacı başlatıldı.');
    }
    setDrawerVisible(false);
    setSelectedCase(null);
  };

  // Comments submit handler
  const handleCommentSubmit = (caseId: string) => {
    const text = commentInputs[caseId];
    if (!text || !text.trim()) return;

    addCaseComment(caseId, text.trim());
    message.success('Yorum eklendi.');
    setCommentInputs({ ...commentInputs, [caseId]: '' });
  };

  // Filter cases based on state selectors
  const filteredCases = cases.filter((c) => {
    const matchSev = filterSeverity ? c.severity === filterSeverity : true;
    const matchStatus = filterStatus ? c.status === filterStatus : true;
    return matchSev && matchStatus;
  });

  const columns = [
    {
      title: 'Müşteri',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Destek Anlaşması',
      dataIndex: 'contract_name',
      key: 'contract_name',
      render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: 'Talebin Başlığı',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong style={{ fontSize: 13, color: '#334155' }}>{text}</Text>,
    },
    {
      title: 'Sorumlu Mühendis',
      dataIndex: 'assigned_name',
      key: 'assigned_name',
      render: (text: string) => (
        <Tag color={text === 'Atanmamış' ? 'default' : 'geekblue'}>{text}</Tag>
      ),
    },
    {
      title: 'Önem Derecesi',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors: Record<string, string> = {
          Critical: 'red',
          High: 'orange',
          Medium: 'gold',
          Low: 'blue',
        };
        return <Tag color={colors[severity] || 'default'}>{severity.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'SLA Kalan Süre',
      dataIndex: 'sla_countdown_hours',
      key: 'sla_countdown_hours',
      render: (hours: number, record: Case) => {
        if (record.status === 'Resolved' || record.status === 'Closed') {
          return <Tag color="gray">KAPANDI</Tag>;
        }
        if (hours === 0) {
          return <Tag color="error">SLA AŞILDI</Tag>;
        }
        const isUrgent = hours < 4;
        return (
          <Space>
            <ClockCircleOutlined style={{ color: isUrgent ? '#ef4444' : '#64748b' }} />
            <Text type={isUrgent ? 'danger' : 'secondary'} strong={isUrgent} style={{ fontSize: 12 }}>
              {hours} saat
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Talep Durumu',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          Open: 'blue',
          'In Progress': 'processing',
          Resolved: 'success',
          Closed: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Case) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#0ea5e9' }} />}
            onClick={(e) => {
              e.stopPropagation(); // prevent expanding row when clicking edit
              openEditDrawer(record);
            }}
          >
            Düzenle
          </Button>
          <Popconfirm
            title="Destek Talebini Sil"
            description="Bu talebi silmek istediğinize emin misiniz? Tüm iletişim geçmişi silinecektir."
            onConfirm={(e) => {
              e?.stopPropagation();
              deleteCase(record.id);
              message.success('Destek talebi silindi.');
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Sil"
            cancelText="İptal"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
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
            Destek Bilet Masası (Cases Service Desk)
          </Title>
          <Text type="secondary">Sözleşmeli veya münferit müşteriler için açılmış teknik talepler, SLA takipleri ve iletişim kanalı</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddDrawer}
          style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
        >
          Yeni Talep Aç
        </Button>
      </div>

      {/* Database Table Card */}
      <Card
        bordered={false}
        title={
          <Space>
            <CustomerServiceOutlined style={{ color: '#0ea5e9' }} />
            <span>Aktif Destek Talepleri Portföyü</span>
          </Space>
        }
        extra={
          <Space size={16}>
            <Select
              allowClear
              placeholder="Öneme Göre Filtrele"
              style={{ width: 180 }}
              onChange={(val) => setFilterSeverity(val)}
              options={[
                { value: 'Critical', label: 'Critical' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ]}
            />
            <Select
              allowClear
              placeholder="Duruma Göre Filtrele"
              style={{ width: 180 }}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Resolved', label: 'Resolved' },
                { value: 'Closed', label: 'Closed' },
              ]}
            />
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
      >
        <Table
          columns={columns}
          dataSource={filteredCases}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          size="middle"
          expandable={{
            expandedRowRender: (record: Case) => (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Talep Açıklaması:
                  </Text>
                  <Text style={{ color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {record.description}
                  </Text>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Yorumlar / Zaman Çizelgesi */}
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 12 }}>
                    İletişim Geçmişi & Mühendis Notları ({record.comments?.length || 0}):
                  </Text>
                  <List
                    size="small"
                    dataSource={record.comments || []}
                    locale={{ emptyText: 'Talebine ilişkin henüz yorum veya not eklenmemiş.' }}
                    renderItem={(item) => (
                      <div style={{ padding: '8px 0', borderBottom: '1px dotted #e2e8f0', display: 'flex', gap: 12 }}>
                        <Avatar icon={<UserOutlined />} size="small" style={{ background: '#002b49' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                            <Text strong style={{ fontSize: 12 }}>{item.author}</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {new Date(item.date).toLocaleString()}
                            </Text>
                          </div>
                          <Text style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{item.text}</Text>
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* Yorum Ekleme Inputu */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <AntdInput
                    value={commentInputs[record.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [record.id]: e.target.value })}
                    placeholder="Müşteriye bilgi notu yazın veya dahili teknik inceleme detaylarını girin..."
                    onPressEnter={() => handleCommentSubmit(record.id)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleCommentSubmit(record.id)}
                    style={{ backgroundColor: '#002b49' }}
                  >
                    Gönder
                  </Button>
                </div>
              </div>
            ),
            rowExpandable: () => true,
          }}
        />
      </Card>

      {/* Add / Edit Drawer */}
      <Drawer
        title={selectedCase ? 'Talebi Düzenle' : 'Yeni Destek Talebi Aç'}
        width={420}
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
            name="customer_id"
            label="Müşteri"
            rules={[{ required: true, message: 'Lütfen bir müşteri seçin!' }]}
          >
            <Select
              placeholder="Müşteri Seçin"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item
            name="contract_id"
            label="İlişkili Bakım Sözleşmesi (İsteğe Bağlı)"
          >
            <Select
              allowClear
              placeholder="Sözleşme Seçin"
              options={contracts.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item
            name="title"
            label="Talep Başlığı"
            rules={[{ required: true, message: 'Lütfen talep başlığı girin!' }]}
          >
            <Input placeholder="Örn: Paket Kaybı Sorunu" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Sorunun Detaylı Açıklaması"
            rules={[{ required: true, message: 'Lütfen sorun detaylarını girin!' }]}
          >
            <Input.TextArea rows={4} placeholder="Sorunun kapsamı, log çıktıları, gözlenen hatalar..." />
          </Form.Item>
          <Form.Item
            name="severity"
            label="Önem Seviyesi (SLA süresini belirler)"
            rules={[{ required: true, message: 'Lütfen bir önem seviyesi seçin!' }]}
          >
            <Select
              options={[
                { value: 'Critical', label: 'Critical (2 saatlik müdahale)' },
                { value: 'High', label: 'High (4 saatlik müdahale)' },
                { value: 'Medium', label: 'Medium (24 saatlik müdahale)' },
                { value: 'Low', label: 'Low (72 saatlik müdahale)' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="assigned_to"
            label="Sorumlu Atanan Mühendis"
          >
            <Select
              allowClear
              placeholder="Mühendis Seçin"
              options={profiles.map((p) => ({ value: p.id, label: `${p.full_name} (${p.role})` }))}
            />
          </Form.Item>
          {selectedCase && (
            <Form.Item
              name="status"
              label="Talep Durumu"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'Open', label: 'Open' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Resolved', label: 'Resolved' },
                  { value: 'Closed', label: 'Closed' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
