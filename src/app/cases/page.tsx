'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, Space, Typography, Popconfirm, Avatar, Badge, Input as AntdInput, Tooltip, Divider, Row, Col, Rate, Steps, Progress } from 'antd';
import { message } from '@/lib/antd';
import { 
  CustomerServiceOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  SendOutlined, 
  BookOutlined, 
  ShareAltOutlined, 
  StarOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ArrowDownOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useApp, Case, Profile } from '@/context/AppContext';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function CasesPage() {
  const { 
    user, 
    cases, 
    customers, 
    contracts, 
    profiles, 
    addCase, 
    updateCase, 
    addCaseComment, 
    deleteCase, 
    knowledgeArticles, 
    brands, 
    addCaseFeedback 
  } = useApp();
  
  const router = useRouter();
  
  // Custom states matching screenshots
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsCase, setDetailsCase] = useState<Case | null>(null);
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [csatRatings, setCsatRatings] = useState<Record<string, number>>({});
  const [csatComments, setCsatComments] = useState<Record<string, string>>({});
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

  // Filter cases based on state selectors and text search
  const filteredCases = cases.filter((c) => {
    const matchSev = filterSeverity ? c.severity === filterSeverity : true;
    const matchStatus = filterStatus ? c.status === filterStatus : true;
    
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = searchQuery
      ? (c.title?.toLowerCase().includes(searchLower) ||
         c.customer_name?.toLowerCase().includes(searchLower) ||
         c.id?.toLowerCase().includes(searchLower) ||
         c.description?.toLowerCase().includes(searchLower))
      : true;
      
    return matchSev && matchStatus && matchSearch;
  });

  // Track the details case reactively from context cases state
  const activeDetailsCase = cases.find(c => c.id === detailsCase?.id) || detailsCase;

  // --- Detailed Content Renderer (Shared between Table and Kanban Drawer) ---
  const renderDetailedContent = (record: Case) => {
    const brand = brands.find((b) => record.title.toLowerCase().includes(b.name.toLowerCase()));
    const recommendedArticles = knowledgeArticles.filter((article) => {
      const titleWords = record.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const titleMatch = titleWords.some(word => article.title.toLowerCase().includes(word));
      const brandMatch = brand ? article.brand_id === brand.id : false;
      return titleMatch || brandMatch;
    });

    const isResolved = record.status === 'Resolved' || record.status === 'Closed';

    const initialSlaMap: Record<string, number> = {
      Critical: 2.0,
      High: 4.0,
      Medium: 24.0,
      Low: 72.0
    };
    const initialLimit = initialSlaMap[record.severity] || 24.0;
    const percentage = (record.sla_countdown_hours / initialLimit) * 100;
    const isPaused = record.status === 'Awaiting Customer' || record.status === 'Awaiting Vendor';

    return (
      <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={16}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                Talep Açıklaması:
              </Text>
              <Text style={{ color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 13 }}>
                {record.description}
              </Text>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: '#334155' }}>
                  İletişim Geçmişi & Mühendis Notları ({record.comments?.length || 0}):
                </Text>
                
                {/* Hızlı Durum Seçici */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Hızlı Durum:</Text>
                  <Select
                    value={record.status}
                    onChange={(val) => {
                      updateCase(record.id, { status: val });
                      message.success('Durum güncellendi.');
                    }}
                    size="small"
                    style={{ width: 140 }}
                    options={[
                      { value: 'Open', label: 'Open' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Awaiting Customer', label: 'Awaiting Customer' },
                      { value: 'Awaiting Vendor', label: 'Awaiting Vendor' },
                      { value: 'Resolved', label: 'Resolved' },
                      { value: 'Closed', label: 'Closed' },
                    ]}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(record.comments || []).length === 0 ? (
                  <div style={{ color: '#94a3b8', padding: '12px 0', fontSize: 13 }}>Talebine ilişkin henüz yorum veya not eklenmemiş.</div>
                ) : (
                  (record.comments || []).map((item: any, idx: number) => (
                    <div key={idx} style={{ padding: '8px 0', borderBottom: '1px dotted #e2e8f0', display: 'flex', gap: 12 }}>
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
                  ))
                )}
              </div>
            </div>

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
            
            {/* Alt İşlem Butonları (Düzenle & Sil) */}
            <Divider style={{ margin: '20px 0' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setDetailsCase(null);
                  openEditDrawer(record);
                }}
                style={{ flex: 1, height: 38 }}
              >
                Bilgileri Düzenle
              </Button>
              <Popconfirm
                title="Destek Talebini Sil"
                description="Bu talebi silmek istediğinize emin misiniz? Tüm iletişim geçmişi silinecektir."
                onConfirm={() => {
                  deleteCase(record.id);
                  message.success('Destek talebi silindi.');
                  setDetailsCase(null);
                }}
                okText="Sil"
                cancelText="İptal"
              >
                <Button danger icon={<DeleteOutlined />} style={{ flex: 1, height: 38 }}>
                  Talebi Sil
                </Button>
              </Popconfirm>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SLA & Escalation Flow Card */}
              <Card
                size="small"
                title={
                  <Space>
                    <ClockCircleOutlined style={{ color: isPaused ? '#3b82f6' : percentage <= 25 ? '#ef4444' : percentage <= 50 ? '#f59e0b' : '#10b981' }} />
                    <Text strong style={{ fontSize: 13, color: '#1e293b' }}>SLA & Eskalasyon Akışı</Text>
                  </Space>
                }
                style={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.01)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {isPaused ? (
                    <div style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <PauseCircleOutlined style={{ color: '#2563eb', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: '#1e3a8a', fontSize: 12, display: 'block' }}>SLA Sayacı Duraklatıldı</Text>
                        <Text style={{ color: '#2563eb', fontSize: 11 }}>
                          {record.status === 'Awaiting Customer' ? 'Müşteri yanıtı bekleniyor.' : 'Üretici/Vendor desteği bekleniyor.'}
                        </Text>
                      </div>
                    </div>
                  ) : isResolved ? (
                    <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <PlayCircleOutlined style={{ color: '#059669', fontSize: 18 }} />
                      <div>
                        <Text strong style={{ color: '#064e3b', fontSize: 12, display: 'block' }}>SLA Süresi Donduruldu (Çözüldü)</Text>
                        <Text style={{ color: '#059669', fontSize: 11 }}>
                          {record.sla_countdown_hours > 0 
                            ? `Kalan süre (${record.sla_countdown_hours} sa) başarıyla korunmuştur.` 
                            : 'Süresi dolduktan sonra çözülmüştür (SLA İhlali).'}
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Kalan SLA Süresi:</Text>
                        <Text strong style={{ fontSize: 11, color: percentage <= 25 ? '#ef4444' : percentage <= 50 ? '#f59e0b' : '#10b981' }}>
                          {record.sla_countdown_hours} saat (%{Math.round(percentage)})
                        </Text>
                      </div>
                      <Progress 
                        percent={Math.round(percentage)} 
                        showInfo={false}
                        strokeColor={percentage <= 25 ? '#ef4444' : percentage <= 50 ? '#f59e0b' : '#10b981'}
                        railColor="#e2e8f0"
                        size="small"
                      />
                    </div>
                  )}

                  <Divider style={{ margin: '8px 0' }} />

                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      Eskalasyon Basamakları ve Bildirim Seviyeleri:
                    </Text>
                    <Steps
                      direction="vertical"
                      size="small"
                      style={{ marginTop: 8 }}
                      current={
                        record.sla_countdown_hours === 0 ? 3 :
                        percentage <= 25 ? 2 :
                        percentage <= 50 ? 1 : 0
                      }
                      status={
                        record.sla_countdown_hours === 0 ? 'error' :
                        percentage <= 25 ? 'error' : 'process'
                      }
                      items={[
                        {
                          title: <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Normal Başlangıç (%100 - %50)</span>,
                          description: <span style={{ fontSize: 10, color: '#64748b' }}>Mühendis standart çalışma sürdürüyor.</span>,
                        },
                        {
                          title: <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Mühendis Uyarısı (&lt; %50)</span>,
                          description: <span style={{ fontSize: 10, color: '#64748b' }}>Push & E-posta uyarısı tetiklendi.</span>,
                        },
                        {
                          title: <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Müdür Eskalasyonu (&lt; %25)</span>,
                          description: <span style={{ fontSize: 10, color: '#64748b' }}>Müdür eskalasyon zincirine katıldı.</span>,
                        },
                        {
                          title: <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>SLA İhlali (Süre Bitti)</span>,
                          description: <span style={{ fontSize: 10, color: '#64748b' }}>Direktör alarm uyarısı iletildi.</span>,
                        }
                      ]}
                    />
                  </div>
                </div>
              </Card>

              {/* CSAT Card */}
              {isResolved && (
                record.rating ? (
                  <Card size="small" style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: 8, boxShadow: '0 4px 12px 0 rgba(16, 185, 129, 0.05)' }}>
                    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: '#065f46', fontSize: 13 }}>Müşteri Memnuniyeti</Text>
                        <Rate disabled defaultValue={record.rating} style={{ fontSize: 13 }} />
                      </div>
                      <Text style={{ fontSize: 12, color: '#047857', fontStyle: 'italic', display: 'block', padding: '4px 0' }}>
                        "{record.feedback_comments || 'Müşteri yorum bırakmadı.'}"
                      </Text>
                    </Space>
                  </Card>
                ) : (
                  <Card size="small" style={{ background: '#fffbeb', border: '1px dashed #d97706', borderRadius: 8 }}>
                    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                      <div>
                        <Text strong style={{ color: '#b45309', fontSize: 13, display: 'block', marginBottom: 2 }}>
                          Müşteri Memnuniyetini Kaydedin
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Bu vaka için müşteriden aldığınız memnuniyet puanını ve yorumu sisteme işleyin.
                        </Text>
                      </div>
                      <Rate
                        value={csatRatings[record.id] || 0}
                        onChange={(val) => setCsatRatings({ ...csatRatings, [record.id]: val })}
                        style={{ fontSize: 18 }}
                      />
                      <AntdInput.TextArea
                        rows={2}
                        value={csatComments[record.id] || ''}
                        onChange={(e) => setCsatComments({ ...csatComments, [record.id]: e.target.value })}
                        placeholder="Müşterinin çözüm hakkındaki yorumlarını buraya ekleyin..."
                        style={{ fontSize: 12, borderRadius: 4 }}
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<StarOutlined />}
                        style={{ backgroundColor: '#d97706', borderColor: '#d97706', borderRadius: 4, width: '100%' }}
                        onClick={() => {
                          const r = csatRatings[record.id];
                          if (!r || r === 0) {
                            message.warning('Lütfen bir yıldız derecelendirmesi seçin!');
                            return;
                          }
                          const c = csatComments[record.id] || '';
                          addCaseFeedback({ case_id: record.id, rating: r, comments: c });
                          message.success('Müşteri memnuniyet geri bildirimi başarıyla kaydedildi.');
                        }}
                      >
                        Geri Bildirimi Kaydet
                      </Button>
                    </Space>
                  </Card>
                )
              )}

              {/* Share to KB quick action */}
              {isResolved && (
                <Card size="small" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Text strong style={{ color: '#334155', fontSize: 13 }}>
                      Çözüm Deneyimini Paylaşın!
                    </Text>
                    <Text style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                      Bu vakanın çözüm adımlarını tek tıkla Bilgi Bankası makalesine dönüştürebilirsiniz.
                    </Text>
                    <Button
                      type="primary"
                      icon={<ShareAltOutlined />}
                      style={{ backgroundColor: '#002b49', borderColor: '#002b49', borderRadius: 4 }}
                      onClick={() => {
                        setDetailsCase(null);
                        router.push(`/knowledge?prefillCaseId=${record.id}`);
                      }}
                    >
                      Bilgi Bankasında Yayınla
                    </Button>
                  </div>
                </Card>
              )}

              <Card
                size="small"
                title={
                  <Space>
                    <BookOutlined style={{ color: '#0ea5e9' }} />
                    <Text strong style={{ fontSize: 12 }}>Akıllı KB Önerileri</Text>
                  </Space>
                }
                style={{ borderRadius: 8 }}
              >
                {recommendedArticles.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Bu vaka başlığına uygun otomatik çözüm makalesi bulunamadı.
                  </Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recommendedArticles.slice(0, 3).map((article: any) => (
                      <div key={article.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Button
                          type="link"
                          onClick={() => {
                            setDetailsCase(null);
                            router.push(`/knowledge`);
                          }}
                          style={{ padding: 0, textAlign: 'left', fontSize: 12, height: 'auto', fontWeight: 500, color: '#0ea5e9' }}
                        >
                          {article.title}
                        </Button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <Tag color="blue" style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>
                            {article.brand_name}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            {article.helpful_votes} faydalı oy
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  // --- Kanban Card Renderer ---
  const renderKanbanCard = (c: Case) => {
    const prof = profiles.find((p) => p.id === c.assigned_to);
    const initials = prof
      ? prof.full_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'AT'; // AT = Atanmamış

    const isResolved = c.status === 'Resolved' || c.status === 'Closed';
    const isPaused = c.status === 'Awaiting Customer' || c.status === 'Awaiting Vendor';

    // Severity mapping for colors and names (turkish labels)
    const severityMap: Record<string, { label: string; bg: string; text: string }> = {
      Critical: { label: 'Kritik', bg: '#fee2e2', text: '#ef4444' },
      High: { label: 'Yüksek', bg: '#fff7ed', text: '#ea580c' },
      Medium: { label: 'Orta', bg: '#fef9c3', text: '#ca8a04' },
      Low: { label: 'Düşük', bg: '#eff6ff', text: '#2563eb' }
    };
    const sev = severityMap[c.severity] || { label: c.severity, bg: '#f1f5f9', text: '#64748b' };

    return (
      <div
        key={c.id}
        onClick={() => setDetailsCase(c)}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: 14,
          cursor: 'pointer',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
        }}
      >
        {/* Card Header: Severity Pill & Ref ID */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 12,
            backgroundColor: sev.bg,
            color: sev.text,
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            {sev.label}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            #{c.id.toUpperCase()}
          </span>
        </div>

        {/* Card Body: Title & Customer Name */}
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13, color: '#1e293b', display: 'block', lineHeight: 1.4, margin: 0 }}>
            {c.title}
          </Text>
          <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block', fontWeight: 500 }}>
            {c.customer_name}
          </Text>
        </div>

        <Divider style={{ margin: '8px 0', borderStyle: 'dashed' }} />

        {/* Card Footer: Assignee Initials & SLA Remaining */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Avatar and Initials */}
          <Tooltip title={prof ? `${prof.full_name} (${prof.role})` : 'Atanmamış'}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Avatar
                size={22}
                src={prof?.avatar_url}
                style={{
                  backgroundColor: prof ? '#0ea5e9' : '#94a3b8',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600
                }}
              >
                {initials}
              </Avatar>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 500 }}>{initials}</Text>
            </div>
          </Tooltip>

          {/* SLA Countdown Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isResolved ? (
              <Tag color="success" style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 600 }}>KAPANDI</Tag>
            ) : isPaused ? (
              <Tag color="warning" style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 600 }}>BEKLEMEDE</Tag>
            ) : (
              <>
                <ClockCircleOutlined style={{ color: c.sla_countdown_hours < 4 ? '#ef4444' : '#64748b', fontSize: 11 }} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: c.sla_countdown_hours < 4 ? '#ef4444' : '#64748b'
                  }}
                >
                  {c.sla_countdown_hours}s
                </Text>
                <ArrowDownOutlined style={{ color: '#94a3b8', fontSize: 10 }} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Kanban Column Configuration ---
  const kanbanColumns = [
    { key: 'Open', title: 'Açık', color: '#3b82f6', bg: '#eff6ff', items: ['Open'] },
    { key: 'In Progress', title: 'İşlemde', color: '#8b5cf6', bg: '#f5f3ff', items: ['In Progress'] },
    { key: 'Awaiting', title: 'Beklemede', color: '#f59e0b', bg: '#fffbeb', items: ['Awaiting Customer', 'Awaiting Vendor'] },
    { key: 'Resolved', title: 'Çözüldü', color: '#10b981', bg: '#ecfdf5', items: ['Resolved', 'Closed'] },
  ];

  // --- Table Columns for List View ---
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
          'Awaiting Customer': 'warning',
          'Awaiting Vendor': 'cyan',
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
              e.stopPropagation();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Vaka Yönetimi (Cases Desk)
          </Title>
          <Text type="secondary">Tüm servis taleplerini, SLA sayaçlarını ve müşteri eskalasyonlarını yönetin.</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddDrawer}
          style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
        >
          Yeni Vaka Aç
        </Button>
      </div>

      {/* Arama & Filtre & Görünüm Değiştirici Kontrol Paneli */}
      <Card
        className="premium-card"
        size="small"
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.015)', background: '#fff' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          {/* Arama Barı ve Filtreler */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, flex: 1, alignItems: 'center' }}>
            <Input
              placeholder="Vaka, müşteri veya #no ara..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 260, borderRadius: 6 }}
              allowClear
            />
            
            <Select
              allowClear
              placeholder="Öneme Göre"
              style={{ width: 140 }}
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
              placeholder="Duruma Göre"
              style={{ width: 140 }}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Awaiting Customer', label: 'Awaiting Customer' },
                { value: 'Awaiting Vendor', label: 'Awaiting Vendor' },
                { value: 'Resolved', label: 'Resolved' },
                { value: 'Closed', label: 'Closed' },
              ]}
            />

            {searchQuery || filterSeverity || filterStatus ? (
              <Button type="link" onClick={() => {
                setSearchQuery('');
                setFilterSeverity(null);
                setFilterStatus(null);
              }} style={{ padding: 0 }}>
                Filtreleri Temizle
              </Button>
            ) : null}
          </div>

          {/* Görünüm Değiştirici Düğmeleri (Liste / Kanban) */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Button
              type="text"
              icon={<UnorderedListOutlined style={{ color: viewMode === 'list' ? '#0ea5e9' : '#64748b' }} />}
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? '#eff6ff' : '#fff',
                border: '1px solid',
                borderColor: viewMode === 'list' ? '#bfdbfe' : '#e2e8f0',
                borderRadius: 6,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Button
              type="text"
              icon={<AppstoreOutlined style={{ color: viewMode === 'kanban' ? '#0ea5e9' : '#64748b' }} />}
              onClick={() => setViewMode('kanban')}
              style={{
                background: viewMode === 'kanban' ? '#eff6ff' : '#fff',
                border: '1px solid',
                borderColor: viewMode === 'kanban' ? '#bfdbfe' : '#e2e8f0',
                borderRadius: 6,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
        </div>
      </Card>

      {/* --- ANA GÖSTERİM ALANI --- */}
      {viewMode === 'list' ? (
        /* 1. LİSTE GÖRÜNÜMÜ */
        <Card
          className="premium-card"
          variant="borderless"
          style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={columns}
            dataSource={filteredCases}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            size="middle"
            expandable={{
              expandedRowRender: (record: Case) => renderDetailedContent(record),
              rowExpandable: () => true,
            }}
          />
        </Card>
      ) : (
        /* 2. KANBAN PANO GÖRÜNÜMÜ */
        <Row gutter={[16, 16]} style={{ minHeight: 560 }}>
          {kanbanColumns.map((col) => {
            const colCases = filteredCases.filter((c) => col.items.includes(c.status));
            return (
              <Col xs={24} sm={12} lg={6} key={col.key}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 14,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01)',
                  minHeight: 450
                }}>
                  {/* Kolon Başlığı */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Space size={6}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }} />
                      <Text strong style={{ fontSize: 13, color: '#334155' }}>{col.title}</Text>
                    </Space>
                    <Tag 
                      variant="filled" 
                      style={{ 
                        borderRadius: 12, 
                        fontWeight: 700, 
                        color: col.color, 
                        backgroundColor: col.bg,
                        margin: 0,
                        fontSize: 11
                      }}
                    >
                      {colCases.length} vaka
                    </Tag>
                  </div>

                  {/* Sütun İçi Kart Listesi */}
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 10, 
                    overflowY: 'auto',
                    paddingBottom: 10
                  }}>
                    {colCases.length === 0 ? (
                      <div style={{
                        border: '1px dashed #cbd5e1',
                        borderRadius: 8,
                        padding: '24px 12px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: 12,
                        background: '#ffffff',
                        margin: '4px 0'
                      }}>
                        Boş
                      </div>
                    ) : (
                      colCases.map((c) => renderKanbanCard(c))
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      {/* --- Drawer 1: Vaka Ekleme / Düzenleme Drawer'ı --- */}
      <Drawer
        title={selectedCase ? 'Talebi Düzenle' : 'Yeni Destek Talebi Aç'}
        size={420}
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
                  { value: 'Awaiting Customer', label: 'Awaiting Customer' },
                  { value: 'Awaiting Vendor', label: 'Awaiting Vendor' },
                  { value: 'Resolved', label: 'Resolved' },
                  { value: 'Closed', label: 'Closed' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Drawer>

      {/* --- Drawer 2: Kanban Kart Detaylarını Gösteren Drawer --- */}
      <Drawer
        title={activeDetailsCase ? `${activeDetailsCase.customer_name || 'Vaka'} - #${activeDetailsCase.id.toUpperCase()}` : 'Vaka Detayı'}
        size={850}
        onClose={() => setDetailsCase(null)}
        open={detailsCase !== null}
        destroyOnHidden
        styles={{ body: { padding: '16px 20px', background: '#f8fafc' } }}
      >
        {activeDetailsCase && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <Space orientation="vertical" size={2}>
                <Title level={4} style={{ margin: 0, color: '#002b49' }}>{activeDetailsCase.title}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Müşteri: <Text strong>{activeDetailsCase.customer_name}</Text></Text>
              </Space>
              <Tag color={activeDetailsCase.status === 'Resolved' || activeDetailsCase.status === 'Closed' ? 'success' : 'processing'}>
                {activeDetailsCase.status}
              </Tag>
            </div>
            {renderDetailedContent(activeDetailsCase)}
          </div>
        )}
      </Drawer>
    </div>
  );
}
