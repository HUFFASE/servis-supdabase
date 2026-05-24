'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, Typography, Alert, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useApp, UserRole } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Postsales');

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Simulate quick login delay for realism
      await new Promise((resolve) => setTimeout(resolve, 800));
      const success = await login(selectedRole);
      
      if (success) {
        message.success({
          content: `${selectedRole} rolüyle başarıyla giriş yapıldı!`,
          duration: 3
        });
        router.replace('/dashboard');
      } else {
        message.error('Giriş başarısız. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      console.error(err);
      message.error('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Blur Circles */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
          top: '-10%',
          left: '-10%',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(0, 43, 73, 0.3) 0%, transparent 70%)',
          bottom: '-20%',
          right: '-10%',
          borderRadius: '50%',
        }}
      />

      {/* Main Glassmorphic Login Card */}
      <Card
        bordered={false}
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* Logo element */}
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #002b49 0%, #003a60 100%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 24,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              marginBottom: 16,
            }}
          >
            TS
          </div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            TS ERP Portalı
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Professional Services Automation & Destek Yönetimi
          </Text>
        </div>

        <Alert
          message="Simülasyon Modu"
          description="RBAC (Yetki Rolü) testleri için giriş yapmak istediğiniz kullanıcı rolünü aşağıdaki listeden seçebilirsiniz."
          type="info"
          showIcon
          icon={<SafetyOutlined />}
          style={{ marginBottom: 20, fontSize: 12 }}
        />

        <Form name="login_form" initialValues={{ email: 'user@techservices.com' }} onFinish={onFinish} size="large">
          {/* Role selection dropdown (For Simulation) */}
          <Form.Item label={<Text strong style={{ fontSize: 13 }}>Giriş Yapılacak Rol (Test)</Text>} labelCol={{ span: 24 }}>
            <Select
              value={selectedRole}
              onChange={(value: UserRole) => setSelectedRole(value)}
              options={[
                { value: 'Direktör', label: 'Direktör (Full Yetki & Raporlar)' },
                { value: 'Müdür', label: 'Müdür (Full Yetki & Raporlar)' },
                { value: 'Presales', label: 'Presales (Gelir Gizleme & Rapor Kısıtlaması)' },
                { value: 'Postsales', label: 'Postsales (Gelir Gizleme & Rapor Kısıtlaması)' },
              ]}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          {/* Email input field */}
          <Form.Item name="email" rules={[{ required: true, message: 'Lütfen e-posta adresinizi girin!' }, { type: 'email', message: 'Geçersiz e-posta adresi!' }]}>
            <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="E-posta Adresi" />
          </Form.Item>

          {/* Password input field */}
          <Form.Item name="password" rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Şifre" />
          </Form.Item>

          {/* Login submit button */}
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, background: 'linear-gradient(135deg, #002b49 0%, #003a60 100%)', border: 'none' }}>
              Sisteme Giriş Yap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
