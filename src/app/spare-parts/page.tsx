'use client';

import React, { useState, useMemo } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, DatePicker, Switch, Space, Typography, Popconfirm, Row, Col, Statistic, message } from 'antd';
import { ToolOutlined, PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined, ProjectOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useApp, SparePart } from '@/context/AppContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Görsel yaş eşikleri (gün) - ayarlanabilir
const AGE_WARN_DAYS = 90;
const AGE_OLD_DAYS = 180;

const getAgeInfo = (part: SparePart) => {
  const start = dayjs(part.stock_in_date);
  const end = part.stock_out_date ? dayjs(part.stock_out_date) : dayjs();
  const days = Math.max(0, end.diff(start, 'day'));
  let color: string = '#16a34a';
  if (days > AGE_OLD_DAYS) color = '#ef4444';
  else if (days > AGE_WARN_DAYS) color = '#f59e0b';
  return { days, color };
};

export default function SparePartsPage() {
  const { user, spareParts, brands, oneOffs, addSparePart, updateSparePart, deleteSparePart } = useApp();

  const isEditor = user?.role === 'Direktör' || user?.role === 'Müdür';

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [form] = Form.useForm();

  // Filters
  const [searchText, setSearchText] = useState('');
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [poolFilter, setPoolFilter] = useState<string | null>(null);

  const openAddDrawer = () => {
    setSelectedPart(null);
    form.resetFields();
    form.setFieldsValue({ is_pool: false, stock_in_date: dayjs() });
    setDrawerVisible(true);
  };

  const openEditDrawer = (part: SparePart) => {
    setSelectedPart(part);
    form.setFieldsValue({
      name: part.name,
      part_code: part.part_code,
      serial_number: part.serial_number,
      brand_id: part.brand_id || undefined,
      project_id: part.project_id || undefined,
      is_pool: part.is_pool,
      stock_in_date: part.stock_in_date ? dayjs(part.stock_in_date) : undefined,
      stock_out_date: part.stock_out_date ? dayjs(part.stock_out_date) : undefined,
      notes: part.notes,
    });
    setDrawerVisible(true);
  };

  const onSave = async (values: any) => {
    const payload = {
      name: values.name,
      part_code: values.part_code || null,
      serial_number: values.serial_number || null,
      brand_id: values.brand_id || null,
      project_id: values.project_id || null,
      is_pool: !!values.is_pool,
      stock_in_date: values.stock_in_date.format('YYYY-MM-DD'),
      stock_out_date: values.stock_out_date ? values.stock_out_date.format('YYYY-MM-DD') : null,
      notes: values.notes || null,
    };

    if (selectedPart) {
      await updateSparePart(selectedPart.id, payload);
      message.success('Yedek parça başarıyla güncellendi.');
    } else {
      await addSparePart(payload);
      message.success('Yeni yedek parça başarıyla eklendi.');
    }
    setDrawerVisible(false);
    setSelectedPart(null);
  };

  const filteredParts = useMemo(() => {
    return spareParts.filter((p) => {
      const search = searchText.toLowerCase().trim();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search) ||
        (p.serial_number || '').toLowerCase().includes(search) ||
        (p.part_code || '').toLowerCase().includes(search);
      const matchesBrand = !brandFilter || p.brand_id === brandFilter;
      const matchesProject = !projectFilter || p.project_id === projectFilter;
      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesPool =
        !poolFilter || (poolFilter === 'pool' ? p.is_pool : !p.is_pool);
      return matchesSearch && matchesBrand && matchesProject && matchesStatus && matchesPool;
    });
  }, [spareParts, searchText, brandFilter, projectFilter, statusFilter, poolFilter]);

  const stats = useMemo(() => {
    const inStock = spareParts.filter((p) => p.status === 'InStock');
    return {
      total: spareParts.length,
      inStock: inStock.length,
      pool: spareParts.filter((p) => p.is_pool && p.status === 'InStock').length,
      aging: inStock.filter((p) => getAgeInfo(p).days > AGE_OLD_DAYS).length,
    };
  }, [spareParts]);

  const columns = [
    {
      title: 'Parça Adı',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: SparePart, b: SparePart) => a.name.localeCompare(b.name, 'tr'),
      render: (text: string, record: SparePart) => (
        <div>
          <Text strong style={{ fontSize: 13, display: 'block' }}>{text}</Text>
          {record.part_code && (
            <Text type="secondary" style={{ fontSize: 11 }}>{record.part_code}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Seri No',
      dataIndex: 'serial_number',
      key: 'serial_number',
      render: (text: string) => <Text style={{ fontSize: 12, color: '#475569' }}>{text || '-'}</Text>,
    },
    {
      title: 'Marka',
      dataIndex: 'brand_name',
      key: 'brand_name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Proje / Havuz',
      key: 'project',
      render: (record: SparePart) => (
        record.is_pool ? (
          <Tag color="purple" icon={<InboxOutlined />}>Havuz</Tag>
        ) : record.project_name ? (
          <Tag color="geekblue" icon={<ProjectOutlined />}>{record.project_name}</Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        )
      ),
    },
    {
      title: 'Stok Giriş',
      dataIndex: 'stock_in_date',
      key: 'stock_in_date',
      sorter: (a: SparePart, b: SparePart) => a.stock_in_date.localeCompare(b.stock_in_date),
      render: (date: string) => <Text style={{ fontSize: 12, color: '#475569' }}>{date}</Text>,
    },
    {
      title: 'Stok Çıkış',
      dataIndex: 'stock_out_date',
      key: 'stock_out_date',
      render: (date: string) => <Text style={{ fontSize: 12, color: '#475569' }}>{date || '-'}</Text>,
    },
    {
      title: 'Yaş',
      key: 'age',
      sorter: (a: SparePart, b: SparePart) => getAgeInfo(a).days - getAgeInfo(b).days,
      render: (record: SparePart) => {
        const { days, color } = getAgeInfo(record);
        return (
          <Space size={4}>
            <ClockCircleOutlined style={{ color }} />
            <Text style={{ fontSize: 12, color, fontWeight: 500 }}>{days} gün</Text>
          </Space>
        );
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          InStock: { color: 'success', label: 'STOKTA' },
          Out: { color: 'default', label: 'ÇIKIŞ YAPILDI' },
        }[status as 'InStock' | 'Out'] || { color: 'default', label: status };
        return <Tag color={config.color} style={{ fontWeight: 500 }}>{config.label}</Tag>;
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: SparePart) => (
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
            title="Yedek Parçayı Sil"
            description="Bu yedek parça kaydını silmek istediğinize emin misiniz?"
            onConfirm={() => {
              deleteSparePart(record.id);
              message.success('Yedek parça silindi.');
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
            Yedek Parça Yönetimi
          </Title>
          <Text type="secondary">Marka, proje ve havuz bazlı stok takibi; parça giriş/çıkış tarihleri ve yaş yönetimi</Text>
        </div>
        {isEditor && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddDrawer}
            style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
          >
            Yeni Yedek Parça
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic title="Toplam Parça" value={stats.total} prefix={<ToolOutlined style={{ color: '#0ea5e9' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic title="Stokta" value={stats.inStock} valueStyle={{ color: '#16a34a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic title="Havuzda" value={stats.pool} prefix={<InboxOutlined style={{ color: '#a855f7' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
            <Statistic title="Yaşlanan (180+ gün)" value={stats.aging} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters + Table */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Parça adı, seri no veya kod ara..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            placeholder="Marka"
            allowClear
            style={{ width: 160 }}
            value={brandFilter}
            onChange={(v) => setBrandFilter(v)}
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select
            placeholder="Proje"
            allowClear
            style={{ width: 200 }}
            value={projectFilter}
            onChange={(v) => setProjectFilter(v)}
            options={oneOffs.map((o) => ({ value: o.id, label: o.name }))}
          />
          <Select
            placeholder="Durum"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: 'InStock', label: 'Stokta' },
              { value: 'Out', label: 'Çıkış Yapıldı' },
            ]}
          />
          <Select
            placeholder="Havuz"
            allowClear
            style={{ width: 150 }}
            value={poolFilter}
            onChange={(v) => setPoolFilter(v)}
            options={[
              { value: 'pool', label: 'Havuz Parçaları' },
              { value: 'project', label: 'Projeye Bağlı' },
            ]}
          />
        </Space>
        <Table
          columns={columns}
          dataSource={filteredParts}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          size="middle"
        />
      </Card>

      {/* Add / Edit Drawer */}
      <Drawer
        title={selectedPart ? 'Yedek Parçayı Düzenle' : 'Yeni Yedek Parça'}
        width={420}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>İptal</Button>
            <Button type="primary" onClick={() => form.submit()} style={{ backgroundColor: '#002b49' }}>
              {selectedPart ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item
            name="name"
            label="Parça Adı"
            rules={[{ required: true, message: 'Lütfen parça adını girin!' }]}
          >
            <Input placeholder="Örn: Cisco Nexus SFP-10G-SR Modülü" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="part_code" label="Parça Kodu">
                <Input placeholder="Örn: SFP-10G-SR" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serial_number" label="Seri No">
                <Input placeholder="Örn: FDO24120ABC" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="brand_id"
            label="Marka / Üretici"
            rules={[{ required: true, message: 'Lütfen markayı seçin!' }]}
          >
            <Select
              placeholder="Marka Seçin"
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </Form.Item>

          <Form.Item name="project_id" label="İlişkili Proje (opsiyonel)">
            <Select
              placeholder="Proje Seçin"
              allowClear
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={oneOffs.map((o) => ({ value: o.id, label: o.name }))}
            />
          </Form.Item>

          <Form.Item
            name="is_pool"
            label="Havuz Parçası"
            valuePropName="checked"
            tooltip="Belirli bir projeye bağlı olmayan, genel havuzda tutulan yedek parça"
          >
            <Switch checkedChildren="Havuz" unCheckedChildren="Hayır" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="stock_in_date"
                label="Stok Giriş Tarihi"
                rules={[{ required: true, message: 'Lütfen giriş tarihini seçin!' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock_out_date" label="Stok Çıkış Tarihi">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Stokta ise boş" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notlar">
            <TextArea rows={3} placeholder="Parça ile ilgili ek bilgiler..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
