'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Popover, List, Space, Typography, Card, Divider, MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TagsOutlined,
  BuildOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  FileTextOutlined,
  ProjectOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ClockCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout, notifications, markNotificationsAsRead, markNotificationAsRead, timesheets } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleNotificationClick = async (item: any) => {
    await markNotificationAsRead(item.id);
    const title = item.title.toLowerCase();
    const message = item.message.toLowerCase();
    if (title.includes('sertifika') || message.includes('sertifika')) {
      router.push('/certificates');
    } else if (
      title.includes('vaka') || 
      title.includes('destek') || 
      message.includes('vaka') || 
      message.includes('destek') || 
      title.includes('sla') || 
      message.includes('sla') || 
      title.includes('talep') || 
      message.includes('talep')
    ) {
      router.push('/cases');
    } else if (
      title.includes('timesheet') || 
      title.includes('efor') || 
      message.includes('timesheet') || 
      message.includes('efor') || 
      title.includes('zaman') || 
      message.includes('zaman')
    ) {
      router.push('/timesheets');
    } else if (
      title.includes('müşteri') || 
      title.includes('geribildirim') || 
      title.includes('csat') || 
      message.includes('csat') || 
      message.includes('geribildirim')
    ) {
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  // If we are on the login page or not logged in, render without the shell
  if (pathname === '/login' || !user) {
    return <>{children}</>;
  }

  // Define sidebar menu items based on RBAC roles
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: <Link href="/users">Kullanıcılar</Link>,
    },
    {
      key: '/brands',
      icon: <TagsOutlined />,
      label: <Link href="/brands">Markalar</Link>,
    },
    {
      key: '/services',
      icon: <BuildOutlined />,
      label: <Link href="/services">Hizmet Kataloğu</Link>,
    },
    {
      key: '/certificates',
      icon: <SafetyCertificateOutlined />,
      label: <Link href="/certificates">Sertifikalar</Link>,
    },
    {
      key: '/customers',
      icon: <TeamOutlined />,
      label: <Link href="/customers">Müşteriler</Link>,
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: <Link href="/contracts">Destek Sözleşmeleri</Link>,
    },
    {
      key: '/oneoffs',
      icon: <ProjectOutlined />,
      label: <Link href="/oneoffs">Proje / Tek Seferlik</Link>,
    },
    {
      key: '/cases',
      icon: <CustomerServiceOutlined />,
      label: <Link href="/cases">Destek Talepleri (Cases)</Link>,
    },
    {
      key: '/timesheets',
      icon: <ClockCircleOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Link href="/timesheets">Zaman Takibi</Link>
          {(user.role === 'Direktör' || user.role === 'Müdür') && (
            <Badge
              count={timesheets.filter((t) => t.status === 'Submitted').length}
              size="small"
              style={{ backgroundColor: '#f59e0b', color: '#fff', transform: 'scale(0.85)' }}
            />
          )}
        </div>
      ),
    },
    {
      key: '/knowledge',
      icon: <BookOutlined />,
      label: <Link href="/knowledge">Bilgi Bankası</Link>,
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Link href="/notifications">Bildirimler</Link>
          {unreadNotifications.length > 0 && (
            <Badge
              count={unreadNotifications.length}
              size="small"
              style={{ backgroundColor: '#ef4444', color: '#fff', transform: 'scale(0.85)' }}
            />
          )}
        </div>
      ),
    },
  ];

  // RBAC: Direktör & Müdür see Reports
  if (user.role === 'Direktör' || user.role === 'Müdür') {
    menuItems.push({
      key: '/reports',
      icon: <BarChartOutlined />,
      label: <Link href="/reports">Raporlar & Analiz</Link>,
    });
  }

  // Notifications Popover Content
  const notificationContent = (
    <div style={{ width: 340 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong>Bildirimler ({unreadNotifications.length})</Text>
        {unreadNotifications.length > 0 && (
          <Button type="link" size="small" onClick={markNotificationsAsRead} style={{ padding: 0 }}>
            Tümünü okundu işaretle
          </Button>
        )}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <List
        size="small"
        dataSource={unreadNotifications.slice(0, 5)}
        locale={{ emptyText: 'Yeni bildirim yok' }}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            onClick={() => handleNotificationClick(item)}
            style={{
              padding: '10px 8px',
              backgroundColor: 'rgba(14, 165, 233, 0.04)',
              borderRadius: 6,
              marginBottom: 6,
              borderBottom: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
            className="notification-item-hover"
          >
            <List.Item.Meta
              title={
                <Space>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor:
                        item.severity === 'error' ? '#ef4444' : item.severity === 'warning' ? '#f59e0b' : '#0ea5e9',
                      display: 'inline-block'
                    }}
                  />
                  <Text strong style={{ fontSize: 13 }}>
                    {item.title}
                  </Text>
                </Space>
              }
              description={
                <div style={{ paddingLeft: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    {item.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
      {notifications.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
          <Button type="link" size="small" onClick={() => router.push('/notifications')} style={{ fontWeight: 500 }}>
            Tüm bildirimleri gör
          </Button>
        </div>
      )}
    </div>
  );

  // Profile Menu Dropdown
  const profileMenu: MenuProps = {
    items: [
      {
        key: 'profile-header',
        label: (
          <div style={{ padding: '8px 12px', minWidth: 160 }}>
            <Text strong style={{ display: 'block' }}>{user.full_name}</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{user.email}</Text>
            <Badge status="success" text={user.role} style={{ marginTop: 4 }} />
          </div>
        ),
      },
      {
        type: 'divider',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Profil Ayarları',
        onClick: () => router.push('/users'),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Çıkış Yap',
        danger: true,
        onClick: () => {
          logout();
          router.push('/login');
        },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        collapsedWidth={80}
        theme="light"
        style={{
          boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.03)',
          borderRight: '1px solid #f1f5f9',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Sidebar Header (Logo) */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(135deg, #002b49 0%, #003a60 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              TS
            </div>
            {!collapsed && (
              <Title level={5} style={{ margin: 0, color: '#fff', fontSize: 16, letterSpacing: 0.5 }}>
                ERP Services
              </Title>
            )}
          </div>
        </div>

        {/* Sidebar Menu */}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname]}
          style={{ borderRight: 0, paddingTop: 16 }}
          items={menuItems}
        />
      </Sider>

      {/* Main Layout Area */}
      <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'margin-left 0.2s' }}>
        {/* Topbar Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.01)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 64,
          }}
        >
          {/* Collapse/Expand Toggle Button */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 40, height: 40 }}
          />

          {/* Topbar Right Menu Items */}
          <Space size={20}>
            {/* Notification Badge */}
            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              overlayClassName="notification-popover"
            >
              <Badge count={unreadNotifications.length} offset={[-2, 2]} size="small" style={{ backgroundColor: '#ef4444' }}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 20, color: '#64748b' }} />}
                  style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Badge>
            </Popover>

            {/* Profile Dropdown */}
            <Dropdown menu={profileMenu} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }} className="profile-trigger">
                <Avatar size={36} src={user.avatar_url} icon={<UserOutlined />} style={{ border: '2px solid #e2e8f0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }} className="hidden-xs">
                  <Text strong style={{ fontSize: 13, color: '#334155' }}>
                    {user.full_name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    {user.role}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Body */}
        <Content style={{ padding: '24px 32px', minHeight: 'calc(100vh - 64px)', overflow: 'initial' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
