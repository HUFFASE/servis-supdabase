'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Drawer,
  Tooltip,
  message,
  Popconfirm,
  List,
  Divider,
  Empty,
  Badge
} from 'antd';
import {
  BookOutlined,
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  LikeOutlined,
  CalendarOutlined,
  UserOutlined,
  TagsOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { useApp, KnowledgeArticle } from '@/context/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

function KnowledgePageContent() {
  const {
    user,
    brands,
    services,
    knowledgeArticles,
    addKnowledgeArticle,
    updateKnowledgeArticle,
    deleteKnowledgeArticle,
    incrementViews,
    voteHelpful,
    cases
  } = useApp();

  const searchParams = useSearchParams();
  const router = useRouter();

  // --- States ---
  const [searchText, setSearchText] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [readerArticle, setReaderArticle] = useState<KnowledgeArticle | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [editorMarkdown, setEditorMarkdown] = useState('');
  const [form] = Form.useForm();

  if (!user) return null;

  // --- Case to KB Pre-filling logic ---
  useEffect(() => {
    const prefillCaseId = searchParams.get('prefillCaseId');
    if (prefillCaseId) {
      const c = cases.find((item) => item.id === prefillCaseId);
      if (c) {
        setEditingArticle(null);
        form.resetFields();
        
        // Construct pre-filled markdown content from case details and comments
        const commentsMarkdown = c.comments && c.comments.length > 0
          ? `### İletişim Geçmişi ve Çözüm Aşamaları\n` + c.comments.map(comment => `- **${comment.author}** (${new Date(comment.date).toLocaleDateString()}): ${comment.text}`).join('\n')
          : '';

        const prefilledContent = `### Sorun Açıklaması\n${c.description || ''}\n\n### Uygulanan Çözüm\n[Lütfen uyguladığınız nihai çözüm adımlarını buraya detaylandırın...]\n\n${commentsMarkdown}`;

        form.setFieldsValue({
          title: `${c.customer_name} - ${c.title} Çözümü`,
          brand_id: c.contract_name !== 'Sözleşmesiz' ? brands.find(b => c.title.toLowerCase().includes(b.name.toLowerCase()))?.id : null,
          tags: ['vaka-cozumu', c.severity.toLowerCase()],
          content: prefilledContent
        });
        setEditorMarkdown(prefilledContent);
        setDrawerVisible(true);

        // Clear query parameter
        router.replace('/knowledge');
        message.info('Destek talebinden makale taslağı başarıyla oluşturuldu.');
      }
    }
  }, [searchParams, cases, brands, form, router]);

  // --- Filters & Searching logic ---
  const allTags = Array.from(
    new Set(knowledgeArticles.flatMap((a) => a.tags || []))
  );

  const filteredArticles = knowledgeArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchText.toLowerCase()) ||
      article.content.toLowerCase().includes(searchText.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()));

    const matchesBrand = selectedBrand ? article.brand_id === selectedBrand : true;
    const matchesService = selectedService ? article.service_id === selectedService : true;
    const matchesTag = selectedTag ? article.tags.includes(selectedTag) : true;

    return matchesSearch && matchesBrand && matchesService && matchesTag;
  });

  // --- Reading Article Handler ---
  const openReader = (article: KnowledgeArticle) => {
    setReaderArticle(article);
    incrementViews(article.id);
  };

  // --- Writing / Editing Article ---
  const openAddDrawer = () => {
    setEditingArticle(null);
    form.resetFields();
    setEditorMarkdown('');
    setDrawerVisible(true);
  };

  const openEditDrawer = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    form.setFieldsValue({
      title: article.title,
      brand_id: article.brand_id,
      service_id: article.service_id,
      tags: article.tags,
      content: article.content
    });
    setEditorMarkdown(article.content);
    setDrawerVisible(true);
  };

  const onSave = async (values: any) => {
    try {
      const data = {
        title: values.title,
        content: values.content,
        brand_id: values.brand_id || null,
        service_id: values.service_id || null,
        created_by: editingArticle ? editingArticle.created_by : user.id,
        tags: values.tags || []
      };

      if (editingArticle) {
        await updateKnowledgeArticle(editingArticle.id, data);
        message.success('Makale başarıyla güncellendi.');
      } else {
        await addKnowledgeArticle(data);
        message.success('Yeni makale Bilgi Bankasına başarıyla eklendi.');
      }

      setDrawerVisible(false);
      setEditingArticle(null);
      form.resetFields();
    } catch (error) {
      message.error('Kayıt sırasında bir hata oluştu.');
    }
  };

  // Vote helpful trigger
  const handleVote = async (id: string) => {
    await voteHelpful(id);
    message.success('Geri bildiriminiz için teşekkürler! (Makale faydalı olarak oylandı)');
    if (readerArticle && readerArticle.id === id) {
      setReaderArticle({
        ...readerArticle,
        helpful_votes: readerArticle.helpful_votes + 1
      });
    }
  };

  // Markdown parser simulated styling renderer
  const renderMarkdown = (text: string) => {
    if (!text) return '';
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <Title level={4} key={index} style={{ marginTop: 16, marginBottom: 8, color: '#002b49' }}>{line.replace('### ', '')}</Title>;
      }
      if (line.startsWith('## ')) {
        return <Title level={3} key={index} style={{ marginTop: 20, marginBottom: 10, color: '#002b49' }}>{line.replace('## ', '')}</Title>;
      }
      if (line.startsWith('# ')) {
        return <Title level={2} key={index} style={{ marginTop: 24, marginBottom: 12, color: '#002b49' }}>{line.replace('# ', '')}</Title>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} style={{ marginLeft: 16, marginBottom: 4, color: '#334155' }}>{line.substring(2)}</li>;
      }
      if (line.startsWith('```')) {
        if (line === '```' || line.startsWith('```bash') || line.startsWith('```powershell')) {
          return null; // hide fences
        }
      }
      // Simple code block detector
      const codeMatch = line.match(/^ {3,4}(.+)/) || line.startsWith('   ');
      if (codeMatch) {
        return (
          <pre key={index} style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', borderLeft: '3px solid #64748b', margin: '4px 0' }}>
            <code>{line}</code>
          </pre>
        );
      }

      return <Paragraph key={index} style={{ color: '#334155', lineHeight: 1.6, marginBottom: 12 }}>{line}</Paragraph>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Kurumsal Bilgi Bankası (Knowledge Base Wiki)
          </Title>
          <Text type="secondary">Teknik çözümler, ağ ve sistem konfigürasyon şablonları, hata teşhis kütüphanesi</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddDrawer}
          style={{ backgroundColor: '#002b49', height: 40, borderRadius: 6 }}
        >
          Makale Yaz
        </Button>
      </div>

      {/* Search Input Bar */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#0ea5e9', marginRight: 8 }} />}
          placeholder="Makale başlığı, içerik veya teknik etiketlerde arama yapın..."
          allowClear
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ borderRadius: 6 }}
        />
      </Card>

      <Row gutter={[24, 24]}>
        {/* Left Side: Filter Panels */}
        <Col xs={24} lg={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Brands Filter */}
            <Card
              bordered={false}
              title={
                <Space>
                  <TagsOutlined style={{ color: '#0ea5e9' }} />
                  <span>Markalara Göre</span>
                </Space>
              }
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
            >
              <List
                size="small"
                dataSource={[{ id: null, name: 'Tüm Markalar' }, ...brands]}
                renderItem={(item: any) => {
                  const isSelected = selectedBrand === item.id;
                  const count = item.id
                    ? knowledgeArticles.filter((a) => a.brand_id === item.id).length
                    : knowledgeArticles.length;

                  return (
                    <List.Item
                      onClick={() => {
                        setSelectedBrand(item.id);
                        setSelectedTag(null);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: 6,
                        backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                        color: isSelected ? '#0ea5e9' : '#475569',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        border: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 2
                      }}
                    >
                      <span>{item.name}</span>
                      <Badge count={count} color={isSelected ? '#0ea5e9' : '#94a3b8'} style={{ transform: 'scale(0.85)' }} />
                    </List.Item>
                  );
                }}
              />
            </Card>

            {/* Services Filter */}
            <Card
              bordered={false}
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#10b981' }} />
                  <span>Hizmet Türüne Göre</span>
                </Space>
              }
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
            >
              <Select
                placeholder="Hizmet Tipi Seçin"
                allowClear
                style={{ width: '100%' }}
                onChange={(val) => {
                  setSelectedService(val);
                  setSelectedTag(null);
                }}
                options={services.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Card>

            {/* Popular Tags Filter */}
            <Card
              bordered={false}
              title={
                <Space>
                  <TagsOutlined style={{ color: '#8b5cf6' }} />
                  <span>Teknik Etiketler</span>
                </Space>
              }
              style={{ borderRadius: 12, boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Tag
                  color={selectedTag === null ? 'geekblue' : 'default'}
                  style={{ cursor: 'pointer', padding: '3px 8px', borderRadius: 4 }}
                  onClick={() => setSelectedTag(null)}
                >
                  Tümü
                </Tag>
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <Tag
                      key={tag}
                      color={isSelected ? 'geekblue' : 'default'}
                      style={{ cursor: 'pointer', padding: '3px 8px', borderRadius: 4 }}
                      onClick={() => setSelectedTag(tag)}
                    >
                      #{tag}
                    </Tag>
                  );
                })}
              </div>
            </Card>
          </div>
        </Col>

        {/* Right Side: Articles List */}
        <Col xs={24} lg={18}>
          {filteredArticles.length === 0 ? (
            <Card bordered={false} style={{ borderRadius: 12, padding: '40px 0', textAlign: 'center' }}>
              <Empty description="Aradığınız kriterlere uygun makale bulunamadı." />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredArticles.map((article) => (
                <Col xs={24} key={article.id}>
                  <Card
                    bordered={false}
                    hoverable
                    onClick={() => openReader(article)}
                    style={{
                      borderRadius: 12,
                      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)',
                      borderLeft: '4px solid #002b49'
                    }}
                    extra={
                      (user.role === 'Direktör' || user.role === 'Müdür' || article.created_by === user.id) && (
                        <Space onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: '#0ea5e9' }} />}
                            onClick={() => openEditDrawer(article)}
                          />
                          <Popconfirm
                            title="Makaleyi Sil"
                            description="Bu teknik makaleyi silmek istediğinize emin misiniz?"
                            onConfirm={() => {
                              deleteKnowledgeArticle(article.id);
                              message.success('Makale silindi.');
                            }}
                            okText="Sil"
                            cancelText="İptal"
                          >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      )
                    }
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Title level={4} style={{ margin: 0, color: '#002b49' }}>
                        {article.title}
                      </Title>

                      <Space size={16} style={{ flexWrap: 'wrap' }}>
                        <Tag color="blue">{article.brand_name}</Tag>
                        <Space size={4}>
                          <UserOutlined style={{ color: '#94a3b8' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>{article.author_name}</Text>
                        </Space>
                        <Space size={4}>
                          <CalendarOutlined style={{ color: '#94a3b8' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(article.created_at).toLocaleDateString()}
                          </Text>
                        </Space>
                        <Space size={4}>
                          <EyeOutlined style={{ color: '#94a3b8' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>{article.views_count} okuma</Text>
                        </Space>
                        <Space size={4}>
                          <LikeOutlined style={{ color: '#94a3b8' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>{article.helpful_votes} faydalı</Text>
                        </Space>
                      </Space>

                      {/* Brief preview */}
                      <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, color: '#475569', fontSize: 13 }}>
                        {article.content.replace(/[#*`\-]/g, '').substring(0, 200)}...
                      </Paragraph>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {article.tags.slice(0, 4).map((t) => (
                            <Tag key={t} style={{ borderRadius: 4, background: '#f8fafc', color: '#64748b' }}>#{t}</Tag>
                          ))}
                        </div>
                        <Button type="link" icon={<ArrowRightOutlined />} style={{ padding: 0, color: '#0ea5e9' }}>
                          Okumaya Başla
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      {/* 1. Article Reader Drawer */}
      <Drawer
        title={
          <Space>
            <BookOutlined style={{ color: '#002b49' }} />
            <span>Teknik İnceleme & Çözüm Detayı</span>
          </Space>
        }
        width={720}
        onClose={() => setReaderArticle(null)}
        open={readerArticle !== null}
        destroyOnClose
        extra={
          readerArticle && (
            <Space>
              <Button
                type="primary"
                icon={<LikeOutlined />}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', borderRadius: 4 }}
                onClick={() => handleVote(readerArticle.id)}
              >
                Faydalı Buldum ({readerArticle.helpful_votes})
              </Button>
            </Space>
          )
        }
      >
        {readerArticle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Title level={3} style={{ color: '#002b49', margin: 0 }}>
              {readerArticle.title}
            </Title>

            <Space size={16} style={{ flexWrap: 'wrap' }} split={<Divider type="vertical" />}>
              <Tag color="geekblue">{readerArticle.brand_name}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>Yazar: {readerArticle.author_name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Tarih: {new Date(readerArticle.created_at).toLocaleDateString()}</Text>
              <Space size={4}>
                <EyeOutlined />
                <Text type="secondary" style={{ fontSize: 12 }}>{readerArticle.views_count} Okunma</Text>
              </Space>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            <div className="markdown-body" style={{ minHeight: 200 }}>
              {renderMarkdown(readerArticle.content)}
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Etiketler:</Text>
              {readerArticle.tags.map((t) => (
                <Tag key={t} color="default" style={{ borderRadius: 4, padding: '3px 8px' }}>#{t}</Tag>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* 2. Article Writer & Editor Drawer */}
      <Drawer
        title={editingArticle ? 'Makaleyi Düzenle' : 'Yeni Bilgi Bankası Makalesi Yaz'}
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>İptal</Button>
            <Button type="primary" onClick={() => form.submit()} style={{ backgroundColor: '#002b49' }}>
              Yayınla
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item
            name="title"
            label="Makale Başlığı"
            rules={[{ required: true, message: 'Lütfen makale başlığı girin!' }]}
          >
            <Input placeholder="Örn: Cisco Nexus SFP+ Rx/Tx Optik Güç Kaybı Hatası Teşhisi" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brand_id" label="İlişkili Üretici / Marka">
                <Select placeholder="Marka Seçin" options={brands.map((b) => ({ value: b.id, label: b.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="service_id" label="İlişkili Servis Tipi">
                <Select placeholder="Servis Seçin" options={services.map((s) => ({ value: s.id, label: s.name }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tags" label="Arama Etiketleri (Tags)">
            <Select mode="tags" placeholder="Anahtar kelimeler ekleyin (#sfp, #azure vb.)" style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={24}>
            {/* Editor Area */}
            <Col xs={24} lg={12}>
              <Form.Item
                name="content"
                label="Makale İçeriği (Markdown Desteği)"
                rules={[{ required: true, message: 'Lütfen makale içeriği yazın!' }]}
              >
                <Input.TextArea
                  rows={14}
                  value={editorMarkdown}
                  onChange={(e) => setEditorMarkdown(e.target.value)}
                  placeholder="### Sorun Açıklaması&#10;Hata belirtileri ve loglar...&#10;&#10;### Teşhis Adımları&#10;1. show interface ethernet...&#10;&#10;### Çözüm Adımları&#10;- SFP temizlenir..."
                />
              </Form.Item>
            </Col>

            {/* Live Preview Area */}
            <Col xs={24} lg={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#475569' }}>
                Canlı Ön İzleme (Live Preview)
              </Text>
              <Card
                style={{
                  background: '#f8fafc',
                  borderRadius: 8,
                  height: 310,
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  padding: 8
                }}
              >
                {editorMarkdown ? (
                  renderMarkdown(editorMarkdown)
                ) : (
                  <Empty description="Yazmaya başladığınızda makale ön izlemesi burada belirecektir." />
                )}
              </Card>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', padding: 50 }}>
        <Typography.Text type="secondary">Yükleniyor...</Typography.Text>
      </div>
    }>
      <KnowledgePageContent />
    </Suspense>
  );
}
