'use client';

import React, { useState } from 'react';
import { Card, Tag, Button, Select, Space, Typography, Row, Col, Badge, Tooltip, Empty, Pagination } from 'antd';
import { message, notification } from '@/lib/antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  ClockCircleOutlined, 
  FilterOutlined, 
  ArrowRightOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useApp, AppNotification } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.locale('tr');

const { Title, Text } = Typography;

export default function NotificationsPage() {
  const { notifications, markNotificationsAsRead, markNotificationAsRead } = useApp();
  const router = useRouter();

  // Filters State
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle single notification click & routing
  const handleNotificationClick = async (item: AppNotification) => {
    // 1. Mark as read
    await markNotificationAsRead(item.id);
    message.success('Bildirim okundu olarak işaretlendi.');

    // 2. Navigate based on notification content
    const title = item.title.toLowerCase();
    const msg = item.message.toLowerCase();

    if (title.includes('sertifika') || msg.includes('sertifika')) {
      router.push('/certificates');
    } else if (
      title.includes('vaka') || 
      title.includes('destek') || 
      msg.includes('vaka') || 
      msg.includes('destek') || 
      title.includes('sla') || 
      msg.includes('sla') || 
      title.includes('talep') || 
      msg.includes('talep')
    ) {
      router.push('/cases');
    } else if (
      title.includes('timesheet') || 
      title.includes('efor') || 
      msg.includes('timesheet') || 
      msg.includes('efor') || 
      title.includes('zaman') || 
      msg.includes('zaman')
    ) {
      router.push('/timesheets');
    } else if (
      title.includes('müşteri') || 
      title.includes('geribildirim') || 
      title.includes('csat') || 
      msg.includes('csat') || 
      msg.includes('geribildirim')
    ) {
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  // Bulk read action
  const handleMarkAllRead = async () => {
    if (notifications.filter(n => !n.read).length === 0) {
      message.info('Okunmamış bildirim bulunmuyor.');
      return;
    }
    await markNotificationsAsRead();
    message.success('Tüm bildirimler okundu olarak işaretlendi.');
  };

  // Filter 2 weeks (14 days) limit
  const twoWeeksAgo = dayjs().subtract(14, 'days');
  const lastTwoWeeksNotifications = notifications.filter(item => {
    return dayjs(item.timestamp).isAfter(twoWeeksAgo);
  });

  // Apply filters
  const filteredNotifications = lastTwoWeeksNotifications.filter(item => {
    // Status Filter
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'unread' ? !item.read : item.read;

    // Severity Filter
    const matchesSeverity = 
      severityFilter === 'all' ? true : item.severity === severityFilter;

    return matchesStatus && matchesSeverity;
  });

  // Stats calculation
  const totalInTwoWeeks = lastTwoWeeksNotifications.length;
  const unreadCount = lastTwoWeeksNotifications.filter(n => !n.read).length;
  const readCount = lastTwoWeeksNotifications.filter(n => n.read).length;
  const criticalCount = lastTwoWeeksNotifications.filter(n => n.severity === 'error').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Bildirim Merkezi
          </Title>
          <Text type="secondary">
            Son 2 haftalık sistem, vaka, sertifika ve onay bildirimlerinizin detaylı dökümü.
          </Text>
        </div>
        <Space size={10}>
          <Button 
            onClick={() => {
              notification.destroy();
              message.success('Ekrandaki tüm bildirim pencereleri kapatıldı.');
            }}
            style={{ height: 40, borderRadius: 6 }}
          >
            Ekranı Temizle
          </Button>
          <Button 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
          >
            Tümünü Okundu İşaretle
          </Button>
        </Space>
      </div>

      {/* Stats Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
            <Space orientation="vertical" size={4}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: 500 }}>Toplam Bildirim (14 Gün)</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>{totalInTwoWeeks}</span>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>bildirim</span>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', borderLeft: '4px solid #ef4444' }}>
            <Space orientation="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Okunmamış Bildirimler</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{unreadCount}</span>
                <Badge status="processing" style={{ transform: 'scale(1.2)' }} />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', borderLeft: '4px solid #10b981' }}>
            <Space orientation="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Okunmuş Bildirimler</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{readCount}</span>
                <span style={{ fontSize: 12 }}>adet</span>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', borderLeft: '4px solid #f59e0b' }}>
            <Space orientation="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Kritik Seviye Uyarılar</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{criticalCount}</span>
                <span style={{ fontSize: 12 }}>kritik</span>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filters & Content Panel */}
      <Card 
        variant="borderless" 
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <Space size={12}>
            <FilterOutlined style={{ color: '#64748b' }} />
            <Text strong style={{ color: '#475569' }}>Filtrele:</Text>
          </Space>
          <Space size={12} wrap>
            <Select 
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: 'Tüm Bildirimler' },
                { value: 'unread', label: 'Sadece Okunmamış' },
                { value: 'read', label: 'Sadece Okunmuş' }
              ]}
            />
            <Select 
              value={severityFilter}
              onChange={(val) => {
                setSeverityFilter(val);
                setCurrentPage(1);
              }}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: 'Tüm Dereceler' },
                { value: 'error', label: 'Kritik Seviye (Error)' },
                { value: 'warning', label: 'Orta Seviye (Warning)' },
                { value: 'info', label: 'Bilgi Seviyesi (Info)' }
              ]}
            />
          </Space>
        </div>

        {filteredNotifications.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Seçilen filtrelere uygun son 2 haftalık bildirim bulunamadı."
            style={{ padding: '48px 0' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredNotifications.slice((currentPage - 1) * 8, currentPage * 8).map((item) => {
              const severityConfig = {
                error: { color: '#ef4444', icon: <AlertOutlined style={{ color: '#ef4444' }} />, label: 'Kritik' },
                warning: { color: '#f59e0b', icon: <WarningOutlined style={{ color: '#f59e0b' }} />, label: 'Uyarı' },
                info: { color: '#0ea5e9', icon: <InfoCircleOutlined style={{ color: '#0ea5e9' }} />, label: 'Bilgi' }
              }[item.severity] || { color: '#64748b', icon: <BellOutlined />, label: 'Genel' };

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 8,
                    backgroundColor: item.read ? 'transparent' : 'rgba(14, 165, 233, 0.04)',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  className="notification-item-hover"
                  onClick={() => handleNotificationClick(item)}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
                    <div 
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: `${severityConfig.color}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${severityConfig.color}20`,
                        flexShrink: 0
                      }}
                    >
                      {severityConfig.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Space size={8} style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <Text strong={!item.read} style={{ fontSize: 14, color: '#1e293b' }}>
                          {item.title}
                        </Text>
                        <Tag color={item.severity === 'error' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'} style={{ fontSize: 11, fontWeight: 500 }}>
                          {severityConfig.label}
                        </Tag>
                        {!item.read && (
                          <Badge status="processing" style={{ marginLeft: 4 }} />
                        )}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 13, display: 'block', color: '#64748b', marginBottom: 6 }}>
                        {item.message}
                      </Text>
                      <Space size={4} style={{ color: '#94a3b8', fontSize: 11 }}>
                        <ClockCircleOutlined />
                        <span>{dayjs(item.timestamp).fromNow()}</span>
                        <span>•</span>
                        <span>{dayjs(item.timestamp).format('DD MMMM YYYY, HH:mm')}</span>
                      </Space>
                    </div>
                  </div>
                  <Tooltip title="Git ve Detayı Gör">
                    <Button 
                      type="text" 
                      icon={<ArrowRightOutlined style={{ color: '#002b49' }} />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(item);
                      }}
                    />
                  </Tooltip>
                </div>
              );
            })}

            {filteredNotifications.length > 8 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Pagination
                  current={currentPage}
                  pageSize={8}
                  total={filteredNotifications.length}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
