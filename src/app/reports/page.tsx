'use client';

import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Space, Typography, List, Result, Button, Avatar, Divider, Segmented, Tooltip } from 'antd';
import {
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FireOutlined,
  CrownOutlined,
  RiseOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { useApp, Profile, Case, Customer } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

export default function ReportsPage() {
  const { user, cases, contracts, customers, oneOffs, profiles, timesheets } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'engineers' | 'finance'>('general');

  // Enforce RBAC validation
  if (!user) {
    return null;
  }

  const isAuthorized = user.role === 'Direktör' || user.role === 'Müdür';

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Result
          status="403"
          title="403"
          subTitle="Bu sayfayı görüntüleme yetkiniz bulunmamaktadır. Sadece Direktör ve Müdür rolleri bu raporlara erişebilir."
          extra={
            <Button type="primary" onClick={() => router.push('/dashboard')} style={{ background: '#002b49' }}>
              Panoya Dön
            </Button>
          }
          style={{
            background: '#fff',
            padding: 48,
            borderRadius: 12,
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.03)'
          }}
        />
      </div>
    );
  }

  // --- CALCULATIONS ---

  // SLA achievement calculations
  const totalClosedCases = cases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const metSlaCases = cases.filter((c) => (c.status === 'Resolved' || c.status === 'Closed') && c.sla_countdown_hours >= 0).length;
  const slaAchievementRate = totalClosedCases > 0 ? Math.round((metSlaCases / totalClosedCases) * 100) : 100;

  // Case counts by severity
  const activeCases = cases.filter((c) => c.status === 'Open' || c.status === 'In Progress');
  const criticalCount = activeCases.filter((c) => c.severity === 'Critical').length;
  const highCount = activeCases.filter((c) => c.severity === 'High').length;
  const mediumCount = activeCases.filter((c) => c.severity === 'Medium').length;
  const lowCount = activeCases.filter((c) => c.severity === 'Low').length;

  // Engineer workload mapping
  const engineerWorkloads = profiles.map((p) => {
    const assignedCases = cases.filter((c) => c.assigned_to === p.id && (c.status === 'Open' || c.status === 'In Progress'));
    const criticalAssigned = assignedCases.filter((c) => c.severity === 'Critical').length;
    const resolvedCases = cases.filter((c) => c.assigned_to === p.id && (c.status === 'Resolved' || c.status === 'Closed')).length;

    return {
      profile: p,
      activeCount: assignedCases.length,
      criticalCount: criticalAssigned,
      completedCount: resolvedCases,
      workloadScore: assignedCases.length * 3 + criticalAssigned * 5 // higher score means more busy
    };
  }).sort((a, b) => b.activeCount - a.activeCount);

  // Financial calculations
  const totalContractRevenue = contracts.reduce((acc, curr) => acc + (curr.status === 'Active' ? curr.value : 0), 0);
  const totalOneOffRevenue = oneOffs.reduce((acc, curr) => acc + (curr.status === 'Completed' ? curr.amount : 0), 0);
  const totalInPerformanceOneOff = oneOffs.reduce((acc, curr) => acc + (curr.status === 'In Progress' ? curr.amount : 0), 0);

  // Advanced direct labor cost and gross margins calculations
  const getTimesheetLaborCost = (ts: any) => {
    const prof = profiles.find((p) => p.id === ts.profile_id);
    const hourlyCost = prof?.hourly_cost || 50;
    return Number(ts.hours_spent) * hourlyCost;
  };

  const approvedTimesheets = timesheets?.filter((t) => t.status === 'Approved') || [];
  const totalLaborCost = approvedTimesheets.reduce((acc, curr) => acc + getTimesheetLaborCost(curr), 0);
  const totalRevenue = totalContractRevenue + totalOneOffRevenue;
  const totalGrossProfit = totalRevenue - totalLaborCost;
  const totalMarginPercentage = totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 100;

  // Financial breakdown by customer
  const customerFinancials = customers.map((c) => {
    const customerContracts = contracts.filter((con) => con.customer_id === c.id && con.status === 'Active');
    const customerOneOffsCompleted = oneOffs.filter((o) => o.customer_id === c.id && o.status === 'Completed');
    const customerOneOffsInProgress = oneOffs.filter((o) => o.customer_id === c.id && o.status === 'In Progress');

    const contractSum = customerContracts.reduce((acc, curr) => acc + curr.value, 0);
    const completedOneOffSum = customerOneOffsCompleted.reduce((acc, curr) => acc + curr.amount, 0);
    const inProgressOneOffSum = customerOneOffsInProgress.reduce((acc, curr) => acc + curr.amount, 0);

    const totalSum = contractSum + completedOneOffSum;

    // Per-customer labor cost calculation
    const customerLaborCost = approvedTimesheets.reduce((acc, ts) => {
      let match = false;
      if (ts.case_id) {
        const cs = cases.find((caseItem) => caseItem.id === ts.case_id);
        if (cs && cs.customer_id === c.id) match = true;
      } else if (ts.oneoff_id) {
        const o = oneOffs.find((oItem) => oItem.id === ts.oneoff_id);
        if (o && o.customer_id === c.id) match = true;
      }
      return match ? acc + getTimesheetLaborCost(ts) : acc;
    }, 0);

    const customerNetProfit = totalSum - customerLaborCost;
    const customerMargin = totalSum > 0 ? Math.round((customerNetProfit / totalSum) * 100) : 100;

    return {
      customer: c,
      contractSum,
      completedOneOffSum,
      inProgressOneOffSum,
      totalSum,
      customerLaborCost,
      customerNetProfit,
      customerMargin
    };
  }).sort((a, b) => b.totalSum - a.totalSum);

  // SLA Performance by Customer
  const customerSLAs = customers.map((c) => {
    const customerCases = cases.filter((caseItem) => caseItem.customer_id === c.id);
    const closed = customerCases.filter((caseItem) => caseItem.status === 'Resolved' || caseItem.status === 'Closed');
    const met = closed.filter((caseItem) => caseItem.sla_countdown_hours >= 0);
    const active = customerCases.filter((caseItem) => caseItem.status === 'Open' || caseItem.status === 'In Progress').length;
    const rate = closed.length > 0 ? Math.round((met.length / closed.length) * 100) : 100;

    return {
      customer: c,
      total: customerCases.length,
      closed: closed.length,
      met: met.length,
      active,
      slaRate: rate
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Raporlar & Performans Analizi
          </Title>
          <Text type="secondary">
            Operasyonel SLA verileri, mühendis iş yükü dağılımı ve finansal performans göstergeleri.
          </Text>
        </div>
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { label: 'Genel Bakış', value: 'general', icon: <DashboardOutlined /> },
            { label: 'Mühendis Yükü', value: 'engineers', icon: <UserOutlined /> },
            { label: 'Finansal Analiz', value: 'finance', icon: <DollarOutlined /> },
          ]}
          style={{ padding: '4px', background: '#f1f5f9', borderRadius: 8 }}
        />
      </div>

      <Divider style={{ margin: 0 }} />

      {/* TAB 1: GENERAL OVERVIEW */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Row Cards */}
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)', textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={slaAchievementRate}
                  strokeColor={{ '0%': '#10b981', '100%': '#0ea5e9' }}
                  width={120}
                />
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>Genel SLA Başarısı</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>Tüm kapatılan çağrılarda hedeflere uyum oranı</Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)', height: '100%' }}>
                <Title level={5} style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Operasyonel SLA Başarımı Müşteri Kırılımı</Title>
                <List
                  dataSource={customerSLAs}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text strong style={{ color: '#334155' }}>{item.customer.name}</Text>
                          <Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.closed} Kapatıldı / {item.active} Açık
                            </Text>
                            <Tag color={item.slaRate >= 90 ? 'success' : item.slaRate >= 75 ? 'warning' : 'error'} style={{ fontWeight: 600 }}>
                              SLA: %{item.slaRate}
                            </Tag>
                          </Space>
                        </div>
                        <Progress
                          percent={item.slaRate}
                          size="small"
                          status={item.slaRate >= 90 ? 'success' : item.slaRate >= 75 ? 'normal' : 'exception'}
                          strokeColor={item.slaRate >= 90 ? '#10b981' : item.slaRate >= 75 ? '#f59e0b' : '#ef4444'}
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          {/* Ticket Severity Breakdown */}
          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <Card
                bordered={false}
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ef4444' }} />
                    <span>Aktif Destek Talepleri Dağılımı</span>
                  </Space>
                }
                style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong><Tag color="red">Kritik (Critical)</Tag></Text>
                      <Text strong>{criticalCount} çağrı</Text>
                    </div>
                    <Progress percent={activeCases.length > 0 ? Math.round((criticalCount / activeCases.length) * 100) : 0} strokeColor="#ef4444" />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong><Tag color="orange">Yüksek (High)</Tag></Text>
                      <Text strong>{highCount} çağrı</Text>
                    </div>
                    <Progress percent={activeCases.length > 0 ? Math.round((highCount / activeCases.length) * 100) : 0} strokeColor="#f59e0b" />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong><Tag color="gold">Orta (Medium)</Tag></Text>
                      <Text strong>{mediumCount} çağrı</Text>
                    </div>
                    <Progress percent={activeCases.length > 0 ? Math.round((mediumCount / activeCases.length) * 100) : 0} strokeColor="#d97706" />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong><Tag color="blue">Düşük (Low)</Tag></Text>
                      <Text strong>{lowCount} çağrı</Text>
                    </div>
                    <Progress percent={activeCases.length > 0 ? Math.round((lowCount / activeCases.length) * 100) : 0} strokeColor="#3b82f6" />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                bordered={false}
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#8b5cf6' }} />
                    <span>Hızlı Operasyonel Özet</span>
                  </Space>
                }
                style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)', height: '100%' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Toplam Açılmış Çağrı</Text>
                      <Title level={4} style={{ margin: 0, color: '#0f172a' }}>{cases.length} adet</Title>
                    </Space>
                    <CrownOutlined style={{ fontSize: 24, color: '#f59e0b' }} />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>SLA Uyumlu Kapatılanlar</Text>
                      <Title level={4} style={{ margin: 0, color: '#10b981' }}>{metSlaCases} / {totalClosedCases}</Title>
                    </Space>
                    <RiseOutlined style={{ fontSize: 24, color: '#10b981' }} />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Kuyruktaki Aktif Çağrı Hacmi</Text>
                      <Title level={4} style={{ margin: 0, color: '#0ea5e9' }}>{activeCases.length} adet</Title>
                    </Space>
                    <ClockCircleOutlined style={{ fontSize: 24, color: '#0ea5e9' }} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* TAB 2: ENGINEER WORKLOADS */}
      {activeTab === 'engineers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Workload Metric cards */}
          <Row gutter={[20, 20]}>
            {engineerWorkloads.map((item) => {
              const workloadColor = item.activeCount >= 3 ? '#ef4444' : item.activeCount >= 1 ? '#f59e0b' : '#10b981';
              const isOverloaded = item.activeCount >= 3;

              // Calculate dynamic utilization/billability
              const userTs = approvedTimesheets.filter((t) => t.profile_id === item.profile.id);
              const totalHours = userTs.reduce((acc, curr) => acc + Number(curr.hours_spent), 0);
              const billableHours = userTs.filter((t) => t.is_billable).reduce((acc, curr) => acc + Number(curr.hours_spent), 0);
              const billablePercentage = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
              const fteColor = billablePercentage >= 75 ? '#10b981' : billablePercentage >= 40 ? '#f59e0b' : '#ef4444';

              return (
                <Col xs={24} sm={12} lg={6} key={item.profile.id}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 12,
                      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)',
                      borderTop: `4px solid ${workloadColor}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <Avatar src={item.profile.avatar_url} size={48} style={{ border: '2px solid #e2e8f0' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: 14, color: '#1e293b' }}>{item.profile.full_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.profile.role}</Text>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Aktif Çağrılar</Text>
                      <Text strong style={{ color: workloadColor }}>{item.activeCount} Adet</Text>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Kritik Seviye</Text>
                      <Tag color={item.criticalCount > 0 ? 'red' : 'default'} style={{ margin: 0 }}>
                        {item.criticalCount} Kritik
                      </Tag>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Toplam Çözülen</Text>
                      <Text strong style={{ color: '#64748b' }}>{item.completedCount} Çağrı</Text>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11 }} type="secondary">Doluluk Oranı</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: workloadColor }}>
                          {isOverloaded ? 'Aşırı Yüklü' : item.activeCount > 0 ? 'Normal Yük' : 'Müsait'}
                        </Text>
                      </div>
                      <Progress
                        percent={Math.min(100, item.activeCount * 25)}
                        showInfo={false}
                        strokeColor={workloadColor}
                        trailColor="#e2e8f0"
                        style={{ margin: '0 0 10px 0' }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11 }} type="secondary">Verimlilik Oranı (FTE)</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: fteColor }}>
                          %{billablePercentage}
                        </Text>
                      </div>
                      <Progress
                        percent={billablePercentage}
                        showInfo={false}
                        strokeColor={fteColor}
                        trailColor="#e2e8f0"
                        style={{ margin: 0 }}
                      />
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Engineer Details Table */}
          <Card
            bordered={false}
            title={
              <Space>
                <UserOutlined style={{ color: '#0ea5e9' }} />
                <span>Mühendis Detaylı SLA & İş Listesi Raporu</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
          >
            <Table
              dataSource={engineerWorkloads}
              rowKey={(record) => record.profile.id}
              pagination={false}
              columns={[
                {
                  title: 'Mühendis',
                  key: 'engineer',
                  render: (_, record) => (
                    <Space>
                      <Avatar src={record.profile.avatar_url} size="small" />
                      <Text strong>{record.profile.full_name}</Text>
                    </Space>
                  ),
                },
                {
                  title: 'Rol',
                  dataIndex: ['profile', 'role'],
                  key: 'role',
                  render: (role: string) => <Tag color="blue">{role}</Tag>
                },
                {
                  title: 'Aktif İş Sayısı',
                  dataIndex: 'activeCount',
                  key: 'activeCount',
                  sorter: (a, b) => a.activeCount - b.activeCount,
                  render: (count: number) => (
                    <Text strong style={{ color: count >= 3 ? '#ef4444' : count > 0 ? '#f59e0b' : '#10b981' }}>
                      {count} Açık Çağrı
                    </Text>
                  )
                },
                {
                  title: 'Kritik Seviyeli İş',
                  dataIndex: 'criticalCount',
                  key: 'criticalCount',
                  render: (count: number) => (
                    <Tag color={count > 0 ? 'red' : 'default'}>{count} Kritik</Tag>
                  )
                },
                {
                  title: 'Kapatılan Toplam Çağrı',
                  dataIndex: 'completedCount',
                  key: 'completedCount',
                  sorter: (a, b) => a.completedCount - b.completedCount,
                  render: (count: number) => <Text>{count} Çağrı</Text>
                },
                {
                  title: 'Verimlilik Oranı (FTE)',
                  key: 'billability',
                  sorter: (a, b) => {
                    const getBillability = (profileId: string) => {
                      const userTs = approvedTimesheets.filter((t) => t.profile_id === profileId);
                      const total = userTs.reduce((acc, curr) => acc + Number(curr.hours_spent), 0);
                      const billable = userTs.filter((t) => t.is_billable).reduce((acc, curr) => acc + Number(curr.hours_spent), 0);
                      return total > 0 ? (billable / total) * 100 : 0;
                    };
                    return getBillability(a.profile.id) - getBillability(b.profile.id);
                  },
                  render: (_, record) => {
                    const userTs = approvedTimesheets.filter((t) => t.profile_id === record.profile.id);
                    const total = userTs.reduce((acc, curr) => acc + Number(curr.hours_spent), 0);
                    const billable = userTs.filter((t) => t.is_billable).reduce((acc, curr) => acc + Number(curr.hours_spent), 0);
                    const percent = total > 0 ? Math.round((billable / total) * 100) : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
                        <Progress 
                          percent={percent} 
                          size="small" 
                          showInfo={false} 
                          strokeColor={percent >= 75 ? '#10b981' : percent >= 40 ? '#f59e0b' : '#ef4444'} 
                        />
                        <Text strong style={{ fontSize: 11 }}>%{percent}</Text>
                      </div>
                    );
                  }
                },
                {
                  title: 'Durum Skoru',
                  key: 'status',
                  render: (_, record) => {
                    if (record.activeCount >= 3) {
                      return <Tag color="error">DESTEK GEREKLİ</Tag>;
                    }
                    if (record.activeCount > 0) {
                      return <Tag color="warning">AKTİF ÇALIŞIYOR</Tag>;
                    }
                    return <Tag color="success">YENİ ÇAĞRI ALABİLİR</Tag>;
                  }
                }
              ]}
            />
          </Card>
        </div>
      )}

      {/* TAB 3: FINANCIAL SUMMARIES */}
      {activeTab === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Revenue Breakdown statistics */}
          <Row gutter={[20, 20]} style={{ marginBottom: 8 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>Toplam Operasyonel Gelir</Text>}
                  value={totalRevenue}
                  valueStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Aktif sözleşme + tamamlanan projeler</Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>İş Gücü Maliyeti (COGS)</Text>}
                  value={totalLaborCost}
                  valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                  prefix={<ClockCircleOutlined />}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Onaylı eforların labor maliyet toplamı</Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>Brüt Operasyonel Kâr</Text>}
                  value={totalGrossProfit}
                  valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  prefix={<RiseOutlined />}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Gelir ile iş gücü giderleri farkı</Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>Operasyonel Kâr Marjı</Text>}
                  value={totalMarginPercentage}
                  valueStyle={{ color: totalMarginPercentage >= 50 ? '#10b981' : totalMarginPercentage >= 20 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}
                  prefix={<CrownOutlined />}
                  formatter={(value) => `%${value}`}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Toplam kârın ciroya yüzdesel oranı</Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Customer Financial Breakdown */}
          <Card
            bordered={false}
            title={
              <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Space>
                  <DollarOutlined style={{ color: '#10b981' }} />
                  <span>Müşteri Bazlı Finansal Değer ve Gelir Dağılımı</span>
                </Space>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
          >
            <Table
              dataSource={customerFinancials}
              rowKey={(record) => record.customer.id}
              pagination={false}
              columns={[
                {
                  title: 'Müşteri Adı',
                  dataIndex: ['customer', 'name'],
                  key: 'customerName',
                  render: (text: string) => <Text strong style={{ color: '#0f172a' }}>{text}</Text>,
                },
                {
                  title: 'Toplam Gelir',
                  dataIndex: 'totalSum',
                  key: 'totalSum',
                  sorter: (a, b) => a.totalSum - b.totalSum,
                  render: (val: number) => (
                    <Text strong style={{ color: '#0f172a' }}>
                      ${val.toLocaleString()}
                    </Text>
                  ),
                },
                {
                  title: 'Operasyonel Gider (COGS)',
                  dataIndex: 'customerLaborCost',
                  key: 'customerLaborCost',
                  sorter: (a, b) => a.customerLaborCost - b.customerLaborCost,
                  render: (val: number) => (
                    <Text style={{ color: val > 0 ? '#ef4444' : '#64748b' }}>
                      {val > 0 ? `$${val.toLocaleString()}` : '$0'}
                    </Text>
                  ),
                },
                {
                  title: 'Net Brüt Kâr',
                  dataIndex: 'customerNetProfit',
                  key: 'customerNetProfit',
                  sorter: (a, b) => a.customerNetProfit - b.customerNetProfit,
                  render: (val: number) => (
                    <Text strong style={{ color: val >= 0 ? '#10b981' : '#ef4444' }}>
                      {val >= 0 ? `$${val.toLocaleString()}` : `-$${Math.abs(val).toLocaleString()}`}
                    </Text>
                  ),
                },
                {
                  title: 'Kâr Marjı',
                  key: 'customerMargin',
                  sorter: (a, b) => a.customerMargin - b.customerMargin,
                  render: (_, record) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
                      <Progress 
                        percent={Math.max(0, record.customerMargin)} 
                        size="small" 
                        showInfo={false} 
                        strokeColor={record.customerMargin >= 50 ? '#10b981' : record.customerMargin >= 20 ? '#f59e0b' : '#ef4444'} 
                      />
                      <Text strong style={{ fontSize: 11 }}>%{record.customerMargin}</Text>
                    </div>
                  )
                },
                {
                  title: 'Finansal Sağlık',
                  key: 'health',
                  render: (_, record) => {
                    if (record.customerMargin >= 50) {
                      return <Tag color="success" style={{ fontWeight: 600 }}>YÜKSEK KÂRLI</Tag>;
                    }
                    if (record.customerMargin >= 20) {
                      return <Tag color="warning" style={{ fontWeight: 600 }}>NORMAL MARJ</Tag>;
                    }
                    return <Tag color="error" style={{ fontWeight: 600 }}>RİSKLİ / BÜTÇE AŞIMI</Tag>;
                  }
                },
                {
                  title: 'Gelir Katkı Oranı',
                  key: 'percentage',
                  render: (_, record) => {
                    const totalAll = totalContractRevenue + totalOneOffRevenue;
                    const percentage = totalAll > 0 ? Math.round((record.totalSum / totalAll) * 100) : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
                        <Progress percent={percentage} size="small" showInfo={false} strokeColor="#002b49" />
                        <Text strong style={{ fontSize: 11 }}>%{percentage}</Text>
                      </div>
                    );
                  }
                }
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
