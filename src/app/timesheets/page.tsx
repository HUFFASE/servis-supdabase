'use client';

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Switch,
  Input,
  Space,
  Typography,
  Tabs,
  Badge,
  Tooltip,
  Popconfirm,
  Statistic,
  Divider,
  Empty
} from 'antd';
import { message } from '@/lib/antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SolutionOutlined,
  FileProtectOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useApp, Timesheet, Case, OneOff } from '@/context/AppContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function TimesheetsPage() {
  const {
    user,
    cases,
    oneOffs,
    timesheets,
    addTimesheet,
    updateTimesheet,
    deleteTimesheet,
    approveTimesheet,
    profiles
  } = useApp();

  const [activeTab, setActiveTab] = useState('my-timesheet');
  const [editingRecord, setEditingRecord] = useState<Timesheet | null>(null);
  const [activityType, setActivityType] = useState<'case' | 'project' | 'general'>('general');
  const [form] = Form.useForm();

  if (!user) return null;

  const isManager = user.role === 'Direktör' || user.role === 'Müdür';

  // --- Filtering & Mappings ---
  const myTimesheets = timesheets.filter((t) => t.profile_id === user.id);
  const pendingApprovals = timesheets.filter((t) => t.status === 'Submitted');
  const processedApprovals = timesheets.filter((t) => t.status === 'Approved' || t.status === 'Rejected');

  // Load cases and projects for dropdowns
  const caseOptions = cases
    .filter((c) => c.status === 'Open' || c.status === 'In Progress')
    .map((c) => ({ value: c.id, label: `[Case] ${c.customer_name} - ${c.title}` }));

  const projectOptions = oneOffs
    .filter((o) => o.status === 'Draft' || o.status === 'In Progress')
    .map((o) => ({ value: o.id, label: `[Proje] ${o.customer_name} - ${o.name}` }));

  // Form submission handler
  const onFormSubmit = async (values: any) => {
    try {
      const formattedValues = {
        profile_id: user.id,
        activity_date: values.activity_date.format('YYYY-MM-DD'),
        hours_spent: Number(values.hours_spent),
        description: values.description,
        is_billable: !!values.is_billable,
        case_id: values.activity_source === 'case' ? values.case_id : null,
        oneoff_id: values.activity_source === 'project' ? values.oneoff_id : null
      };

      if (editingRecord) {
        await updateTimesheet(editingRecord.id, formattedValues);
        message.success('Zaman kaydı güncellendi.');
        setEditingRecord(null);
      } else {
        await addTimesheet(formattedValues);
        message.success('Yeni zaman kaydı oluşturuldu (Taslak).');
      }

      form.resetFields();
      form.setFieldsValue({
        activity_date: dayjs(),
        hours_spent: 1,
        is_billable: true,
        activity_source: 'general'
      });
      setActivityType('general');
    } catch (error) {
      message.error('Kayıt işlemi sırasında bir hata oluştu.');
      console.error(error);
    }
  };

  // Switch form to editing mode
  const handleEdit = (record: Timesheet) => {
    setEditingRecord(record);
    let source: 'case' | 'project' | 'general' = 'general';
    if (record.case_id) source = 'case';
    else if (record.oneoff_id) source = 'project';

    setActivityType(source);

    form.setFieldsValue({
      activity_date: dayjs(record.activity_date),
      hours_spent: record.hours_spent,
      activity_source: source,
      case_id: record.case_id,
      oneoff_id: record.oneoff_id,
      is_billable: record.is_billable,
      description: record.description
    });
  };

  // Submit draft for approval
  const handleSubmitForApproval = async (id: string) => {
    await updateTimesheet(id, { status: 'Submitted' });
    message.success('Zaman kaydı yöneticinize gönderildi.');
  };

  // Form source selection trigger
  const handleSourceChange = (val: 'case' | 'project' | 'general') => {
    setActivityType(val);
    if (val === 'case') {
      form.setFieldsValue({ is_billable: true });
    } else if (val === 'general') {
      form.setFieldsValue({ is_billable: false });
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      activity_date: dayjs(),
      hours_spent: 1,
      is_billable: true,
      activity_source: 'general'
    });
    setActivityType('general');
  };

  // --- Timesheet Table Columns ---
  const myColumns = [
    {
      title: 'Tarih',
      dataIndex: 'activity_date',
      key: 'activity_date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#0ea5e9' }} />
          <Text strong style={{ fontSize: 13 }}>{date}</Text>
        </Space>
      ),
      sorter: (a: any, b: any) => dayjs(a.activity_date).unix() - dayjs(b.activity_date).unix(),
    },
    {
      title: 'İlişkili Kaynak / Müşteri',
      key: 'source_customer',
      width: 240,
      render: (record: Timesheet) => {
        let type = 'Genel Hizmet';
        let detail = 'Dahili Operasyon';
        let color = 'default';

        if (record.case_id) {
          type = 'Destek Talebi';
          detail = record.case_title || 'Detay Yok';
          color = 'blue';
        } else if (record.oneoff_id) {
          type = 'Proje';
          detail = record.oneoff_name || 'Detay Yok';
          color = 'purple';
        }

        return (
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }} title={record.customer_name}>
              {record.customer_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Tag color={color} style={{ fontSize: 10, margin: 0, flexShrink: 0 }}>{type}</Tag>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }} title={detail}>
                {detail}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Süre (Saat)',
      dataIndex: 'hours_spent',
      key: 'hours_spent',
      align: 'center' as const,
      render: (hours: number) => <Text strong style={{ color: '#002b49' }}>{hours} sa</Text>,
    },
    {
      title: 'Çalışma Açıklaması',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ fontSize: 13, color: '#475569' }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Faturalandırılabilir',
      dataIndex: 'is_billable',
      key: 'is_billable',
      align: 'center' as const,
      render: (billable: boolean) => (
        <Tag color={billable ? 'success' : 'default'}>
          {billable ? 'EVET' : 'HAYIR'}
        </Tag>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Timesheet) => {
        const colors: Record<string, string> = {
          Draft: 'blue',
          Submitted: 'warning',
          Approved: 'success',
          Rejected: 'error'
        };
        const tr: Record<string, string> = {
          Draft: 'Taslak',
          Submitted: 'Onay Bekliyor',
          Approved: 'Onaylandı',
          Rejected: 'Reddedildi'
        };

        if (status === 'Approved' && record.approved_name) {
          return (
            <Tooltip title={`Onaylayan: ${record.approved_name}`}>
              <Tag color="success">ONAYLANDI ✓</Tag>
            </Tooltip>
          );
        }

        if (status === 'Rejected' && record.approved_name) {
          return (
            <Tooltip title={`Reddeden: ${record.approved_name}`}>
              <Tag color="error">REDDEDİLDİ ✗</Tag>
            </Tooltip>
          );
        }

        return <Tag color={colors[status] || 'default'}>{tr[status]?.toUpperCase() || status}</Tag>;
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Timesheet) => {
        const isEditable = record.status === 'Draft' || record.status === 'Rejected';

        if (!isEditable) {
          return <Text type="secondary" style={{ fontSize: 11 }}>Güncelleme Kilitli</Text>;
        }

        return (
          <Space size={8}>
            <Tooltip title="Düzenle">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#0ea5e9' }} />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>

            <Tooltip title="Onaya Gönder">
              <Button
                type="text"
                size="small"
                icon={<SendOutlined style={{ color: '#f59e0b' }} />}
                onClick={() => handleSubmitForApproval(record.id)}
              />
            </Tooltip>

            <Popconfirm
              title="Kaydı Sil"
              description="Bu zaman kaydını kalıcı olarak silmek istediğinize emin misiniz?"
              onConfirm={() => {
                deleteTimesheet(record.id);
                message.success('Kayıt silindi.');
              }}
              okText="Sil"
              cancelText="İptal"
            >
              <Tooltip title="Sil">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // --- Manager Approvals Table Columns ---
  const approvalColumns = [
    {
      title: 'Mühendis',
      key: 'engineer',
      render: (record: Timesheet) => {
        const engineer = profiles.find((p) => p.id === record.profile_id);
        return (
          <Space orientation="vertical" size={2}>
            <Text strong style={{ fontSize: 13 }}>{record.profile_name}</Text>
            <Text type="secondary" style={{ fontSize: 10 }}>{engineer?.role}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Tarih',
      dataIndex: 'activity_date',
      key: 'activity_date',
      render: (date: string) => <Text style={{ fontSize: 13 }}>{date}</Text>
    },
    {
      title: 'Kaynak / Müşteri',
      key: 'source',
      width: 240,
      render: (record: Timesheet) => {
        let type = 'Genel Hizmet';
        let detail = 'Dahili Operasyon';
        let color = 'default';

        if (record.case_id) {
          type = 'Destek';
          detail = record.case_title || 'Detay Yok';
          color = 'blue';
        } else if (record.oneoff_id) {
          type = 'Proje';
          detail = record.oneoff_name || 'Detay Yok';
          color = 'purple';
        }

        return (
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }} title={record.customer_name}>
              {record.customer_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Tag color={color} style={{ fontSize: 10, margin: 0, flexShrink: 0 }}>{type}</Tag>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }} title={detail}>
                {detail}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Süre (Saat)',
      dataIndex: 'hours_spent',
      key: 'hours_spent',
      align: 'center' as const,
      render: (hours: number) => <Text strong style={{ color: '#002b49' }}>{hours} sa</Text>,
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text style={{ fontSize: 13, color: '#475569' }}>{text}</Text>,
    },
    {
      title: 'Fatura Durumu',
      dataIndex: 'is_billable',
      key: 'is_billable',
      render: (billable: boolean) => (
        <Tag color={billable ? 'success' : 'default'}>
          {billable ? 'FATURALANDIRILABİLİR' : 'DÂHİLİ'}
        </Tag>
      ),
    },
    {
      title: 'Onay Kararı',
      key: 'decision',
      render: (record: Timesheet) => (
        <Space size={8}>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            style={{ backgroundColor: '#10b981', borderColor: '#10b981', borderRadius: 4 }}
            onClick={() => {
              approveTimesheet(record.id, 'Approved');
              message.success(`${record.profile_name} eforu onaylandı.`);
            }}
          >
            Onayla
          </Button>

          <Popconfirm
            title="Red Gerekçesi"
            description="Bu efor kaydını reddetmek istediğinize emin misiniz?"
            onConfirm={() => {
              approveTimesheet(record.id, 'Rejected');
              message.warning(`${record.profile_name} eforu reddedildi.`);
            }}
            okText="Reddet"
            cancelText="İptal"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<CloseOutlined />}
              style={{ borderRadius: 4 }}
            >
              Reddet
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Mühendis',
      key: 'engineer',
      render: (record: Timesheet) => {
        const engineer = profiles.find((p) => p.id === record.profile_id);
        return (
          <Space orientation="vertical" size={2}>
            <Text strong style={{ fontSize: 13 }}>{record.profile_name}</Text>
            <Text type="secondary" style={{ fontSize: 10 }}>{engineer?.role}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Tarih',
      dataIndex: 'activity_date',
      key: 'activity_date',
      render: (date: string) => <Text style={{ fontSize: 13 }}>{date}</Text>
    },
    {
      title: 'Kaynak / Müşteri',
      key: 'source',
      width: 240,
      render: (record: Timesheet) => {
        let type = 'Genel Hizmet';
        let detail = 'Dahili Operasyon';
        let color = 'default';

        if (record.case_id) {
          type = 'Destek';
          detail = record.case_title || 'Detay Yok';
          color = 'blue';
        } else if (record.oneoff_id) {
          type = 'Proje';
          detail = record.oneoff_name || 'Detay Yok';
          color = 'purple';
        }

        return (
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }} title={record.customer_name}>
              {record.customer_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Tag color={color} style={{ fontSize: 10, margin: 0, flexShrink: 0 }}>{type}</Tag>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }} title={detail}>
                {detail}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Süre',
      dataIndex: 'hours_spent',
      key: 'hours_spent',
      align: 'center' as const,
      render: (hours: number) => <Text strong style={{ color: '#002b49' }}>{hours} sa</Text>,
    },
    {
      title: 'Karar',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Approved' ? 'success' : 'error'} style={{ fontWeight: 600 }}>
          {status === 'Approved' ? 'ONAYLANDI' : 'REDDEDİLDİ'}
        </Tag>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Timesheet) => (
        <Button
          type="default"
          size="small"
          icon={<CloseCircleOutlined />}
          style={{ borderRadius: 4 }}
          onClick={async () => {
            await approveTimesheet(record.id, 'Submitted');
            message.info(`${record.profile_name} eforunun kararı geri alındı, bekleyen kuyruğuna taşındı.`);
          }}
        >
          Kararı Geri Al
        </Button>
      )
    }
  ];

  // --- Calculations for Analytics Widget ---
  const myTotalApprovedHours = myTimesheets
    .filter((t) => t.status === 'Approved')
    .reduce((sum, curr) => sum + curr.hours_spent, 0);

  const myTotalSubmittedHours = myTimesheets
    .filter((t) => t.status === 'Submitted')
    .reduce((sum, curr) => sum + curr.hours_spent, 0);

  const myTotalDraftHours = myTimesheets
    .filter((t) => t.status === 'Draft' || t.status === 'Rejected')
    .reduce((sum, curr) => sum + curr.hours_spent, 0);

  const myBillableRatio = myTimesheets.length > 0
    ? Math.round((myTimesheets.filter((t) => t.is_billable).length / myTimesheets.length) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome & Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Zaman Takibi ve Efor Yönetimi
          </Title>
          <Text type="secondary">Destek talepleri, proje iş paketleri ve dahili operasyon sürelerinin efor takibi paneli</Text>
        </div>
        <Tag color="geekblue" style={{ padding: '6px 14px', borderRadius: 4, fontSize: 13, fontWeight: 500 }}>
          Kullanıcı: {user.full_name} ({user.role})
        </Tag>
      </div>

      {/* Analytics Summary Row (Only for the engineer view, but always visible for context) */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>Onaylanan Toplam Saat</Text>}
              value={myTotalApprovedHours}
              suffix="saat"
              prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />}
              styles={{ content: { color: '#0f172a', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>Onay Bekleyen Saat</Text>}
              value={myTotalSubmittedHours}
              suffix="saat"
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 6 }} />}
              styles={{ content: { color: '#0f172a', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>Taslak Eforlarım</Text>}
              value={myTotalDraftHours}
              suffix="saat"
              prefix={<SolutionOutlined style={{ color: '#0ea5e9', marginRight: 6 }} />}
              styles={{ content: { color: '#0f172a', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>Faturalandırılabilirlik Oranı</Text>}
              value={myBillableRatio}
              suffix="%"
              prefix={<FileProtectOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />}
              styles={{ content: { color: '#0f172a', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs Layout */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        style={{ marginTop: 8 }}
        items={[
          {
            key: 'my-timesheet',
            label: (
              <Space>
                <ClockCircleOutlined />
                <span>Zaman Çizelgem</span>
              </Space>
            ),
            children: (
              <Row gutter={[24, 24]}>
                {/* Efor Giriş Formu */}
                <Col xs={24} lg={8}>
                  <Card
                    className="premium-card"
                    variant="borderless"
                    title={
                      <Space>
                        <PlusOutlined style={{ color: '#0ea5e9' }} />
                        <span>{editingRecord ? 'Zaman Kaydını Düzenle' : 'Efor Kaydet'}</span>
                      </Space>
                    }
                    style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
                  >
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={onFormSubmit}
                      initialValues={{
                        activity_date: dayjs(),
                        hours_spent: 1,
                        is_billable: true,
                        activity_source: 'general'
                      }}
                    >
                      <Form.Item
                        name="activity_date"
                        label="Çalışma Tarihi"
                        rules={[{ required: true, message: 'Lütfen tarihi girin!' }]}
                      >
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                      </Form.Item>

                      <Form.Item
                        name="hours_spent"
                        label="Efor Süresi (Saat)"
                        rules={[{ required: true, message: 'Lütfen süreyi girin!' }]}
                      >
                        <InputNumber min={0.5} max={24} step={0.5} style={{ width: '100%' }} placeholder="Örn: 2.5" />
                      </Form.Item>

                      <Form.Item
                        name="activity_source"
                        label="Aktivite Kaynağı"
                        rules={[{ required: true }]}
                      >
                        <Select onChange={handleSourceChange}>
                          <Select.Option value="general">Dahili / Genel Çalışma</Select.Option>
                          <Select.Option value="case">Destek Talebi (Case)</Select.Option>
                          <Select.Option value="project">Müşteri Projesi (One-off)</Select.Option>
                        </Select>
                      </Form.Item>

                      {activityType === 'case' && (
                        <Form.Item
                          name="case_id"
                          label="İlişkili Destek Talebi"
                          rules={[{ required: true, message: 'Lütfen vaka seçin!' }]}
                        >
                          <Select placeholder="Destek Talebini Seçin" options={caseOptions} />
                        </Form.Item>
                      )}

                      {activityType === 'project' && (
                        <Form.Item
                          name="oneoff_id"
                          label="İlişkili Proje Çalışması"
                          rules={[{ required: true, message: 'Lütfen proje seçin!' }]}
                        >
                          <Select placeholder="Proje Seçin" options={projectOptions} />
                        </Form.Item>
                      )}

                      <Form.Item
                        name="is_billable"
                        label="Faturalandırılabilir Çalışma"
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="EVET" unCheckedChildren="HAYIR" />
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label="Çalışma Detayları / Teknik Açıklama"
                        rules={[
                          { required: true, message: 'Lütfen yapılan işe dair açıklama yazın!' },
                          { min: 10, message: 'Açıklama en az 10 karakter olmalıdır.' }
                        ]}
                      >
                        <Input.TextArea
                          rows={4}
                          placeholder="Müşteriye veya yöneticiye sunulmak üzere yapılan teknik çalışmanın detaylarını girin..."
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                          {editingRecord && (
                            <Button onClick={cancelEdit}>Vazgeç</Button>
                          )}
                          <Button
                            type="primary"
                            htmlType="submit"
                            style={{ backgroundColor: '#002b49', borderColor: '#002b49' }}
                            icon={<CheckCircleOutlined />}
                          >
                            {editingRecord ? 'Kaydı Güncelle' : 'Taslak Olarak Kaydet'}
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>

                {/* Efor Geçmişi Tablosu */}
                <Col xs={24} lg={16}>
                  <Card
                    className="premium-card"
                    variant="borderless"
                    title={
                      <Space>
                        <CalendarOutlined style={{ color: '#0ea5e9' }} />
                        <span>Kayıtlı Efor Geçmişim</span>
                      </Space>
                    }
                    style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
                  >
                    <Table
                      columns={myColumns}
                      dataSource={myTimesheets}
                      rowKey="id"
                      pagination={{ pageSize: 6 }}
                      size="middle"
                      locale={{
                        emptyText: <Empty description="Henüz girilmiş bir zaman kaydınız yok." />
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          ...(isManager
            ? [
                {
                  key: 'approvals',
                  label: (
                    <Space>
                      <Badge
                        count={pendingApprovals.length}
                        size="small"
                        offset={[8, -6]}
                        style={{ backgroundColor: '#f59e0b' }}
                      >
                        <SolutionOutlined />
                      </Badge>
                      <span>Efor Onay Masası</span>
                    </Space>
                  ),
                  children: (
                    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
                      <Card
                        className="premium-card"
                        variant="borderless"
                        title={
                          <Space>
                            <SolutionOutlined style={{ color: '#f59e0b' }} />
                            <span>Onay Bekleyen Zaman Çizelgeleri</span>
                          </Space>
                        }
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
                      >
                        <Table
                          columns={approvalColumns}
                          dataSource={pendingApprovals}
                          rowKey="id"
                          pagination={{ pageSize: 8 }}
                          size="middle"
                          locale={{
                            emptyText: <Empty description="Onaylanacak bekleyen zaman kaydı bulunmuyor." />
                          }}
                        />
                      </Card>

                      <Card
                        className="premium-card"
                        variant="borderless"
                        title={
                          <Space>
                            <CheckCircleOutlined style={{ color: '#10b981' }} />
                            <span>Son Efor Onay Geçmişi</span>
                          </Space>
                        }
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
                      >
                        <Table
                          columns={historyColumns}
                          dataSource={processedApprovals}
                          rowKey="id"
                          pagination={{ pageSize: 5 }}
                          size="middle"
                          locale={{
                            emptyText: <Empty description="Henüz sonuçlandırılmış bir efor kaydı bulunmuyor." />
                          }}
                        />
                      </Card>
                    </Space>
                  )
                }
              ]
            : [])
        ]}
      />
    </div>
  );
}
