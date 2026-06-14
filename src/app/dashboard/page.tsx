'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Space, Typography, List, Alert, Badge, Rate } from 'antd';
import {
  CustomerServiceOutlined,
  FileProtectOutlined,
  TeamOutlined,
  DollarOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  StarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { useApp, Case, Certificate } from '@/context/AppContext';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, cases, contracts, customers, certificates, oneOffs, profiles, timesheets } = useApp();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  // --- Calculations ---
  const activeCases = cases.filter((c) => c.status === 'Open' || c.status === 'In Progress');
  const criticalCases = activeCases.filter((c) => c.severity === 'Critical');
  const activeContractsCount = contracts.filter((c) => c.status === 'Active').length;
  const totalCustomers = customers.length;
  
  // CSAT Score Calculations
  const feedbackCases = cases.filter((c) => typeof c.rating === 'number' && c.rating > 0);
  const totalCSATCount = feedbackCases.length;
  const averageCSAT = totalCSATCount > 0
    ? parseFloat((feedbackCases.reduce((sum, curr) => sum + (curr.rating || 0), 0) / totalCSATCount).toFixed(2))
    : 0;

  // Revenue/financial calculations
  const totalContractRevenue = contracts.reduce((acc, curr) => acc + (curr.status === 'Active' ? curr.value : 0), 0);
  const totalOneOffRevenue = oneOffs.reduce((acc, curr) => acc + (curr.status === 'Completed' ? curr.amount : 0), 0);
  const totalFinancialVolume = totalContractRevenue + totalOneOffRevenue;

  // Expiring/Expired Certificates
  const expiringOrExpiredCerts = certificates.filter((c) => c.status === 'Expired' || c.status === 'Expiring');

  // RBAC checks
  const isFinanceRestricted = user?.role === 'Presales' || user?.role === 'Postsales';

  // SLA achievement gauge calculation
  const totalClosedCases = cases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const metSlaCases = cases.filter((c) => (c.status === 'Resolved' || c.status === 'Closed') && c.sla_countdown_hours >= 0).length;
  const slaAchievementRate = totalClosedCases > 0 ? Math.round((metSlaCases / totalClosedCases) * 100) : 100;

  // --- Chart Data Processing ---

  // 1. Timesheet Hours by Engineer
  const timesheetChartData = profiles.map((p) => {
    const userTimesheets = timesheets.filter((t) => t.profile_id === p.id);
    const totalHours = userTimesheets.reduce((sum, t) => sum + Number(t.hours_spent), 0);
    return {
      name: p.full_name,
      Saat: parseFloat(totalHours.toFixed(1))
    };
  });

  // 2. Active Cases by Severity
  const severityCounts = {
    Critical: activeCases.filter((c) => c.severity === 'Critical').length,
    High: activeCases.filter((c) => c.severity === 'High').length,
    Medium: activeCases.filter((c) => c.severity === 'Medium').length,
    Low: activeCases.filter((c) => c.severity === 'Low').length
  };
  const caseSeverityChartData = [
    { name: 'Kritik (Critical)', value: severityCounts.Critical, color: '#ef4444' },
    { name: 'Yüksek (High)', value: severityCounts.High, color: '#f97316' },
    { name: 'Orta (Medium)', value: severityCounts.Medium, color: '#eab308' },
    { name: 'Düşük (Low)', value: severityCounts.Low, color: '#3b82f6' }
  ].filter(item => item.value > 0);

  // 3. Customer Financial Volume Breakdown (For non-restricted users)
  const customerFinancialsData = customers.map((c) => {
    const customerContracts = contracts.filter((con) => con.customer_id === c.id && con.status === 'Active');
    const customerOneoffs = oneOffs.filter((o) => o.customer_id === c.id && o.status === 'Completed');
    const contractSum = customerContracts.reduce((sum, con) => sum + Number(con.value), 0);
    const projectSum = customerOneoffs.reduce((sum, o) => sum + Number(o.amount), 0);
    return {
      name: c.name.split(' ')[0], // First word of company name
      'Sözleşme': contractSum,
      'Proje': projectSum
    };
  });

  // --- Table Column Definitions ---

  const caseColumns = [
    {
      title: 'Müşteri',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Case) => (
        <Link href="/cases" style={{ color: '#0ea5e9', fontWeight: 500 }}>
          {text}
        </Link>
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
      title: 'SLA Sayaç',
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
              {hours} sa
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          Open: 'blue',
          'In Progress': 'processing',
          'Awaiting Customer': 'warning',
          'Awaiting Vendor': 'cyan',
          Resolved: 'success',
          Closed: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Hoş Geldiniz, {user?.full_name}
          </Title>
          <Text type="secondary">Tech Services PSA Yönetim Paneli</Text>
        </div>
        <Tag color="geekblue" style={{ padding: '4px 12px', borderRadius: 4, fontSize: 13, fontWeight: 500 }}>
          Rol: {user?.role}
        </Tag>
      </div>

      {/* Critical Cases Warning Alert */}
      {criticalCases.length > 0 && (
        <Alert
          message={
            <Text strong style={{ color: '#7f1d1d' }}>
              Müdahale Bekleyen Kritik Destek Talepleri Var!
            </Text>
          }
          description={`Şu anda çözüm süresi kritik olan ve hemen ilgilenilmesi gereken ${criticalCases.length} adet "CRITICAL" seviyeli talep mevcuttur. Lütfen durumları inceleyin.`}
          type="error"
          showIcon
          icon={<AlertOutlined />}
          style={{ borderRadius: 8, boxShadow: '0 4px 12px 0 rgba(239, 68, 68, 0.05)' }}
        />
      )}

      {/* Metric Cards Grid */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13 }}>Aktif Destek Talepleri</Text>}
              value={activeCases.length}
              prefix={<CustomerServiceOutlined style={{ color: '#0ea5e9', marginRight: 8 }} />}
              valueStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              <Badge status="error" text={`${criticalCases.length} Kritik`} />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13 }}>Aktif Bakım Sözleşmeleri</Text>}
              value={activeContractsCount}
              prefix={<FileProtectOutlined style={{ color: '#10b981', marginRight: 8 }} />}
              valueStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tüm SLA parametreleri devrede</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13 }}>Müşteri Memnuniyeti (CSAT)</Text>}
              value={totalCSATCount > 0 ? averageCSAT : 'Puan Yok'}
              suffix={totalCSATCount > 0 ? '/ 5.0' : ''}
              prefix={<TrophyOutlined style={{ color: '#f59e0b', marginRight: 8 }} />}
              valueStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{totalCSATCount} değerlendirme yapıldı</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13 }}>Toplam Finansal Hacim</Text>}
              value={isFinanceRestricted ? 'Gizli' : totalFinancialVolume}
              formatter={isFinanceRestricted ? undefined : (value) => `$${Number(value).toLocaleString()}`}
              prefix={<DollarOutlined style={{ color: '#f59e0b', marginRight: 8 }} />}
              valueStyle={{ color: isFinanceRestricted ? '#94a3b8' : '#0f172a', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              {isFinanceRestricted ? (
                <Tag color="default">YETKİ SINIRLI</Tag>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>Sözleşme + Biten Projeler</Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Interactive Charts Row */}
      <Row gutter={[20, 20]}>
        {/* Timesheet Hours Bar Chart */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <Space>
                <BarChartOutlined style={{ color: '#0ea5e9' }} />
                <span>Personel Kayıtlı Çalışma Saatleri (Efor)</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
          >
            <div style={{ width: '100%', height: 260 }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timesheetChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 6, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="Saat" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        {/* Case Severity Pie Chart */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <Space>
                <PieChartOutlined style={{ color: '#f59e0b' }} />
                <span>Aktif Vakaların Önem Derecesine Göre Dağılımı</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 260 }}>
              {caseSeverityChartData.length > 0 ? (
                <>
                  <div style={{ width: '50%', height: '100%' }}>
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={caseSeverityChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {caseSeverityChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip contentStyle={{ borderRadius: 6, border: '1px solid #e2e8f0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '40%' }}>
                    {caseSeverityChartData.map((entry, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color }} />
                        <Text style={{ fontSize: 12 }} type="secondary">
                          {entry.name}: <Text strong>{entry.value}</Text>
                        </Text>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <Text type="secondary">Şu anda açık veya işleme alınmış aktif vaka bulunmamaktadır.</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Financial Volume Chart (Conditional RBAC) */}
      {!isFinanceRestricted && (
        <Row gutter={[20, 20]}>
          <Col span={24}>
            <Card
              bordered={false}
              title={
                <Space>
                  <AreaChartOutlined style={{ color: '#10b981' }} />
                  <span>Müşteri Finansal Hacim Analizi (Sözleşme vs. Proje)</span>
                </Space>
              }
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
            >
              <div style={{ width: '100%', height: 280 }}>
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={customerFinancialsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="$" />
                      <ChartTooltip contentStyle={{ borderRadius: 6, border: '1px solid #e2e8f0' }} formatter={(val) => `$${Number(val).toLocaleString()}`} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="Sözleşme" stroke="#10b981" fillOpacity={0.15} fill="url(#colorSözleşme)" />
                      <Area type="monotone" dataKey="Proje" stroke="#0ea5e9" fillOpacity={0.15} fill="url(#colorProje)" />
                      <defs>
                        <linearGradient id="colorSözleşme" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProje" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content Grid */}
      <Row gutter={[20, 20]}>
        {/* Active Support Cases Table */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={
              <Space>
                <CustomerServiceOutlined style={{ color: '#0ea5e9' }} />
                <span>Aktif Destek Talepleri Sırası</span>
              </Space>
            }
            extra={<Link href="/cases" style={{ color: '#0ea5e9' }}>Tümünü Gör</Link>}
            style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
          >
            <Table
              columns={caseColumns}
              dataSource={activeCases.slice(0, 4)}
              rowKey="id"
              pagination={false}
              size="middle"
              locale={{ emptyText: 'Şu anda açık destek talebi yok' }}
            />
          </Card>
        </Col>

        {/* SLA and Expiry Trackers Column */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* SLA Gauge Card */}
            <Card
              bordered={false}
              title="SLA Başarım Oranı"
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                <Progress type="dashboard" percent={slaAchievementRate} strokeColor={{ '0%': '#10b981', '100%': '#0ea5e9' }} />
                <Text type="secondary" style={{ marginTop: 8, textAlign: 'center', fontSize: 12 }}>
                  Kapatılan taleplerin sözleşme limitlerine uygunluk oranı
                </Text>
              </div>
            </Card>

            {/* CSAT Leaderboard Card */}
            <Card
              bordered={false}
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#f59e0b' }} />
                  <span>En Yüksek CSAT Dereceleri</span>
                </Space>
              }
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
            >
              <List
                size="small"
                dataSource={profiles
                  .filter((p) => typeof p.average_csat === 'number' && p.average_csat > 0)
                  .sort((a, b) => (b.average_csat || 0) - (a.average_csat || 0))
                  .slice(0, 3)}
                locale={{ emptyText: 'Henüz müşteri memnuniyet puanı girilmemiş.' }}
                renderItem={(item, index) => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Space>
                        <Badge
                          count={index + 1}
                          style={{
                            backgroundColor: index === 0 ? '#f59e0b' : index === 1 ? '#cbd5e1' : '#b45309',
                            color: '#fff',
                            fontWeight: 'bold',
                            transform: 'scale(0.85)'
                          }}
                        />
                        <Text strong style={{ fontSize: 13, marginLeft: 4 }}>{item.full_name}</Text>
                        <Tag color="geekblue" style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>{item.role}</Tag>
                      </Space>
                      <Space size={4}>
                        <Rate disabled defaultValue={item.average_csat} style={{ fontSize: 10 }} />
                        <Text strong style={{ color: '#002b49', fontSize: 12 }}>
                          {item.average_csat}
                        </Text>
                      </Space>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* Certificate Tracker Card */}
            <Card
              bordered={false}
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#f59e0b' }} />
                  <span>Kritik Sertifika Takibi</span>
                </Space>
              }
              extra={<Link href="/certificates" style={{ color: '#0ea5e9' }}>Tümünü Gör</Link>}
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
            >
              <List
                size="small"
                dataSource={expiringOrExpiredCerts.slice(0, 3)}
                locale={{ emptyText: 'Süresi yaklaşan sertifika yok' }}
                renderItem={(item: Certificate) => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 13 }}>{item.name}</Text>
                        <Tag color={item.status === 'Expired' ? 'red' : 'orange'}>
                          {item.status === 'Expired' ? 'SÜRESİ DOLDU' : 'SON 30 GÜN'}
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.profile_name}</Text>
                        <Text type="danger" style={{ fontSize: 11 }}>Bitiş: {item.expiry_date}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
