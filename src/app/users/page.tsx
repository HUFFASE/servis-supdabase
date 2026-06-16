'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, Space, Typography, Avatar, Row, Col, Modal, Divider } from 'antd';
import { message } from '@/lib/antd';
import {
  UserOutlined,
  EditOutlined,
  TeamOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  MailOutlined,
  IdcardOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { useApp, Profile, UserRole } from '@/context/AppContext';

const { Title, Text, Paragraph } = Typography;

export default function UsersPage() {
  const { user, profiles, updateProfile, certificates, cases } = useApp();
  
  // States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  
  // Search and Filter States
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  
  // Detail Modal States
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [form] = Form.useForm();

  // Handle drawer trigger for editing
  const openEditDrawer = (profile: Profile) => {
    setSelectedProfile(profile);
    form.setFieldsValue({
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      password: '',
      hourly_cost: profile.hourly_cost || 50,
    });
    setDrawerVisible(true);
  };

  const onSave = async (values: any) => {
    if (selectedProfile) {
      try {
        await updateProfile(
          selectedProfile.id, 
          values.full_name, 
          values.role, 
          values.password, 
          values.hourly_cost ? Number(values.hourly_cost) : undefined,
          values.email
        );
        message.success('Kullanıcı profili başarıyla güncellendi.');
        setDrawerVisible(false);
        
        // If the currently displayed detail modal is for this profile, update it
        if (detailProfile && detailProfile.id === selectedProfile.id) {
          setDetailProfile({
            ...detailProfile,
            full_name: values.full_name,
            email: values.email,
            role: values.role,
            password: values.password,
            hourly_cost: values.hourly_cost ? Number(values.hourly_cost) : detailProfile.hourly_cost
          });
        }
        
        setSelectedProfile(null);
      } catch (err) {
        console.error('Error in onSave UI handler:', err);
      }
    }
  };

  // Filter profiles
  const filteredProfiles = profiles.filter((p) => {
    const matchSearch = p.full_name.toLowerCase().includes(searchText.toLowerCase()) || 
                        p.email.toLowerCase().includes(searchText.toLowerCase());
    const matchRole = roleFilter ? p.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar_url',
      key: 'avatar_url',
      width: 80,
      render: (url: string) => (
        <Avatar src={url} icon={<UserOutlined />} size="large" style={{ border: '2px solid #f1f5f9' }} />
      ),
    },
    {
      title: 'Ad Soyad',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: Profile) => (
        <Space orientation="vertical" size={0}>
          <Text strong style={{ fontSize: 14 }}>{text}</Text>
          {record.id === user?.id && <Tag color="blue">Mevcut Kullanıcı</Tag>}
        </Space>
      ),
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => <Text style={{ color: '#475569' }}>{text}</Text>,
    },
    {
      title: 'Yetki Rolü',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors: Record<string, string> = {
          Direktör: 'red',
          Müdür: 'volcano',
          Presales: 'orange',
          Postsales: 'green',
        };
        return <Tag color={colors[role] || 'default'} style={{ fontWeight: 500 }}>{role}</Tag>;
      },
    },
    {
      title: 'Son Güncelleme',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => <Text type="secondary" style={{ fontSize: 12 }}>{mounted ? new Date(date).toLocaleString() : ''}</Text>,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Profile) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<InfoCircleOutlined style={{ color: '#0ea5e9' }} />}
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              setDetailProfile(record);
              setDetailModalVisible(true);
            }}
          >
            Detaylar
          </Button>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#64748b' }} />}
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              openEditDrawer(record);
            }}
            disabled={user?.role !== 'Direktör' && record.id !== user?.id} // Only Director or owner can edit
          >
            Düzenle
          </Button>
        </Space>
      ),
    },
  ];

  // Fetch details for detail modal
  const userCertificates = detailProfile 
    ? certificates.filter((c) => c.profile_id === detailProfile.id)
    : [];

  const userActiveCases = detailProfile
    ? cases.filter((c) => c.assigned_to === detailProfile.id && (c.status === 'Open' || c.status === 'In Progress'))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Bar */}
      <div>
        <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
          Sistem Kullanıcıları
        </Title>
        <Text type="secondary">Sisteme kayıtlı personellerin rolleri, yetkinlikleri ve profil ayarları</Text>
      </div>

      <Row gutter={[20, 20]}>
        {/* Info Card */}
        <Col xs={24} lg={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Space orientation="vertical" align="center" style={{ width: '100%', padding: '16px 0' }} size={16}>
              <Avatar src={user?.avatar_url} size={80} style={{ border: '4px solid #f1f5f9' }} />
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>{user?.full_name}</Title>
                <Text type="secondary">{user?.email}</Text>
              </div>
              <Tag color="geekblue" style={{ fontSize: 13, padding: '4px 12px' }}>{user?.role}</Tag>
              <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                {user?.role !== 'Direktör' ? 'Gelişmiş kullanıcı yönetimi yetkileri için Direktör rolüyle giriş yapmalısınız.' : 'Tüm kullanıcıların rollerini yönetme yetkisine sahipsiniz.'}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* Users Table Card */}
        <Col xs={24} lg={18}>
          <Card
            className="premium-card"
            variant="borderless"
            title={
              <Space>
                <TeamOutlined style={{ color: '#0ea5e9' }} />
                <span>Kullanıcı Listesi</span>
              </Space>
            }
            extra={
              <Space size={12} className="hidden-xs">
                {/* Search Box */}
                <Input
                  placeholder="Kullanıcı adı veya e-posta..."
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 220, borderRadius: 6 }}
                  allowClear
                />
                
                {/* Role Filter */}
                <Select
                  placeholder="Role Göre Filtrele"
                  style={{ width: 160 }}
                  onChange={(val) => setRoleFilter(val)}
                  allowClear
                  options={[
                    { value: 'Direktör', label: 'Direktör' },
                    { value: 'Müdür', label: 'Müdür' },
                    { value: 'Presales', label: 'Presales' },
                    { value: 'Postsales', label: 'Postsales' },
                  ]}
                />
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
          >
            {/* Search/Filter for Mobile Screens */}
            <div style={{ display: 'none', gap: 12, marginBottom: 16 }} className="show-xs-flex">
              <Input
                placeholder="Kullanıcı adı veya e-posta..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ flex: 1, borderRadius: 6 }}
                allowClear
              />
              <Select
                placeholder="Rol"
                style={{ width: 120 }}
                onChange={(val) => setRoleFilter(val)}
                allowClear
                options={[
                  { value: 'Direktör', label: 'Direktör' },
                  { value: 'Müdür', label: 'Müdür' },
                  { value: 'Presales', label: 'Presales' },
                  { value: 'Postsales', label: 'Postsales' },
                ]}
              />
            </div>

            <Table
              columns={columns}
              dataSource={filteredProfiles}
              rowKey="id"
              pagination={{ pageSize: 6 }}
              size="middle"
              onRow={(record) => ({
                onClick: () => {
                  setDetailProfile(record);
                  setDetailModalVisible(true);
                },
                style: { cursor: 'pointer' }
              })}
            />
          </Card>
        </Col>
      </Row>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <IdcardOutlined style={{ color: '#0ea5e9' }} />
            <span>Kullanıcı Detay Kartı</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalVisible(false)} style={{ background: '#002b49' }}>
            Kapat
          </Button>
        ]}
        width={580}
        destroyOnHidden
        style={{ top: 80 }}
      >
        {detailProfile && (
          <div style={{ padding: '10px 0' }}>
            {/* User Profile Card Header */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
              <Avatar src={detailProfile.avatar_url} size={64} style={{ border: '3px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Title level={4} style={{ margin: 0, color: '#0f172a' }}>{detailProfile.full_name}</Title>
                <Space>
                  <Tag color={
                    detailProfile.role === 'Direktör' ? 'red' : 
                    detailProfile.role === 'Müdür' ? 'volcano' : 
                    detailProfile.role === 'Presales' ? 'orange' : 'green'
                  } style={{ margin: 0, fontWeight: 600 }}>
                    {detailProfile.role}
                  </Tag>
                  {detailProfile.id === user?.id && <Tag color="blue">Siz</Tag>}
                </Space>
              </div>
            </div>

            {/* Profile Info Fields */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Space orientation="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 11 }}>E-posta Adresi</Text>
                    <Space size={6}>
                      <MailOutlined style={{ color: '#94a3b8' }} />
                      <Text strong style={{ fontSize: 13 }}>{detailProfile.email}</Text>
                    </Space>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space orientation="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Sistem ID</Text>
                    <Space size={6}>
                      <IdcardOutlined style={{ color: '#94a3b8' }} />
                      <Text strong style={{ fontSize: 13 }}>{detailProfile.id}</Text>
                    </Space>
                  </Space>
                </Col>
                {(detailProfile.id === user?.id || user?.role === 'Direktör') && (
                  <Col xs={24} sm={12}>
                    <Space orientation="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Giriş Şifresi</Text>
                      <Space size={6}>
                        <KeyOutlined style={{ color: '#94a3b8' }} />
                        <Text strong style={{ fontSize: 13 }}>•••••• (Bcrypt ile Korunuyor)</Text>
                      </Space>
                    </Space>
                  </Col>
                )}
                <Col xs={24}>
                  <Space orientation="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Son Güncelleme Zamanı</Text>
                    <Space size={6}>
                      <CalendarOutlined style={{ color: '#94a3b8' }} />
                      <Text strong style={{ fontSize: 13 }}>
                        {new Date(detailProfile.updated_at).toLocaleString()}
                      </Text>
                    </Space>
                  </Space>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            {/* Competency & Workload Tabs */}
            <Row gutter={[20, 20]}>
              {/* Certificates */}
              <Col xs={24} sm={12}>
                <Card 
                  variant="outlined" 
                  size="small" 
                  title={
                    <Space>
                      <SafetyCertificateOutlined style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: 13 }}>Sertifikalar ({userCertificates.length})</span>
                    </Space>
                  }
                  style={{ height: '100%', borderRadius: 8 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {userCertificates.length === 0 ? (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '12px 0', fontSize: 12 }}>Sertifika kaydı yok</div>
                    ) : (
                      userCertificates.map((item) => (
                        <div key={item.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Text strong style={{ fontSize: 12 }}>{item.name}</Text>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>Bitiş: {item.expiry_date}</Text>
                            <Tag color={item.status === 'Expired' ? 'red' : item.status === 'Expiring' ? 'orange' : 'green'} style={{ fontSize: 9, lineHeight: '14px', height: '16px', margin: 0 }}>
                              {item.status}
                            </Tag>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </Col>

              {/* Workload / Active Tasks */}
              <Col xs={24} sm={12}>
                <Card 
                  variant="outlined" 
                  size="small" 
                  title={
                    <Space>
                      <CustomerServiceOutlined style={{ color: '#0ea5e9' }} />
                      <span style={{ fontSize: 13 }}>Aktif Destek Talepleri ({userActiveCases.length})</span>
                    </Space>
                  }
                  style={{ height: '100%', borderRadius: 8 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {userActiveCases.length === 0 ? (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '12px 0', fontSize: 12 }}>Atanmış açık görev yok</div>
                    ) : (
                      userActiveCases.map((item) => (
                        <div key={item.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Text ellipsis style={{ fontSize: 12, fontWeight: 500 }}>{item.title}</Text>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>SLA: {item.sla_countdown_hours} sa</Text>
                            <Tag color={
                              item.severity === 'Critical' ? 'red' : 
                              item.severity === 'High' ? 'orange' : 
                              item.severity === 'Medium' ? 'gold' : 'blue'
                            } style={{ fontSize: 9, lineHeight: '14px', height: '16px', margin: 0 }}>
                              {item.severity}
                            </Tag>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Edit Drawer */}
      <Drawer
        title="Profil Düzenle"
        size={360}
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
        {selectedProfile && (
          <Form form={form} layout="vertical" onFinish={onSave}>
            <Form.Item
              name="full_name"
              label="Ad Soyad"
              rules={[{ required: true, message: 'Lütfen ad soyad girin!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="E-posta Adresi"
              rules={[
                { required: true, message: 'Lütfen e-posta adresi girin!' },
                { type: 'email', message: 'Geçersiz e-posta adresi!' }
              ]}
            >
              <Input disabled={user?.role !== 'Direktör' && selectedProfile.id !== user?.id} />
            </Form.Item>
            <Form.Item
              name="role"
              label="Yetki Rolü"
              rules={[{ required: true }]}
            >
              <Select
                disabled={user?.role !== 'Direktör'} // Only Director can change roles
                options={[
                  { value: 'Direktör', label: 'Direktör' },
                  { value: 'Müdür', label: 'Müdür' },
                  { value: 'Presales', label: 'Presales' },
                  { value: 'Postsales', label: 'Postsales' },
                ]}
              />
            </Form.Item>
            {(user?.role === 'Direktör' || user?.role === 'Müdür') && (
              <Form.Item
                name="hourly_cost"
                label="Saatlik İş Gücü Maliyeti ($)"
                rules={[{ required: true, message: 'Lütfen saatlik maliyet girin!' }]}
              >
                <Input type="number" min={1} placeholder="Örn: 50" style={{ borderRadius: 6 }} />
              </Form.Item>
            )}
            {(selectedProfile.id === user?.id || user?.role === 'Direktör') && (
              <Form.Item
                name="password"
                label="Yeni Şifre"
                rules={[
                  { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
                ]}
              >
                <Input.Password placeholder="Değiştirmek istemiyorsanız boş bırakın" autoComplete="new-password" />
              </Form.Item>
            )}
          </Form>
        )}
      </Drawer>
    </div>
  );
}
