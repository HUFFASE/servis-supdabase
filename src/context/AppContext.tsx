'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { message } from 'antd';

// --- Type Definitions ---

export type UserRole = 'Direktör' | 'Müdür' | 'Presales' | 'Postsales';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  email: string;
  updated_at: string;
  password?: string;
  average_csat?: number;
  feedbacks_count?: number;
  hourly_cost?: number;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string;
  description: string;
  services_count?: number;
}

export interface Service {
  id: string;
  name: string;
  brand_id: string;
  brand_name?: string;
  description: string;
  price_per_hour: number;
}

export interface CertificateDefinition {
  id: string;
  name: string;
  brand_id: string;
  brand_name?: string;
}

export interface Certificate {
  id: string;
  name: string;
  brand_id: string;
  brand_name?: string;
  profile_id: string;
  profile_name?: string;
  issue_date: string;
  expiry_date: string;
  status: 'Active' | 'Expiring' | 'Expired';
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  contact_person: string;
  email: string;
  phone: string;
}

export interface Contract {
  id: string;
  customer_id: string;
  customer_name?: string;
  name: string;
  start_date: string;
  end_date: string;
  value: number; // Confidential for Presales/Postsales
  sla_details: string;
  status: 'Active' | 'Pending' | 'Expired';
}

export interface OneOff {
  id: string;
  customer_id: string;
  customer_name?: string;
  name: string;
  amount: number;
  status: 'Draft' | 'In Progress' | 'Completed';
}

export interface Case {
  id: string;
  customer_id: string;
  customer_name?: string;
  contract_id?: string;
  contract_name?: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Awaiting Customer' | 'Awaiting Vendor' | 'Resolved' | 'Closed';
  assigned_to?: string; // Profile ID
  assigned_name?: string;
  created_at: string;
  sla_countdown_hours: number; // Ticks down
  comments?: Array<{ author: string; text: string; date: string }>;
  rating?: number;
  feedback_comments?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface Timesheet {
  id: string;
  profile_id: string;
  profile_name?: string;
  case_id?: string | null;
  case_title?: string;
  oneoff_id?: string | null;
  oneoff_name?: string;
  customer_name?: string; // computed from case or one-off
  activity_date: string;
  hours_spent: number;
  description: string;
  is_billable: boolean;
  status: TimesheetStatus;
  approved_by?: string | null;
  approved_name?: string;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  brand_id?: string | null;
  brand_name?: string;
  service_id?: string | null;
  service_name?: string;
  created_by?: string | null;
  author_name?: string;
  tags: string[];
  views_count: number;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface CaseFeedback {
  id: string;
  case_id: string;
  rating: number;
  comments?: string;
  created_at: string;
}

export interface SparePart {
  id: string;
  name: string;
  part_code?: string;
  serial_number?: string;
  brand_id?: string | null;
  brand_name?: string;
  project_id?: string | null;
  project_name?: string;
  is_pool: boolean;
  stock_in_date: string;
  stock_out_date?: string | null;
  status: 'InStock' | 'Out';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface AppContextType {
  // Auth state
  user: Profile | null;
  login: (role: UserRole, email?: string, password?: string) => Promise<boolean>;
  logout: () => void;

  // DB tables (state)
  profiles: Profile[];
  brands: Brand[];
  services: Service[];
  certificateDefinitions: CertificateDefinition[];
  certificates: Certificate[];
  customers: Customer[];
  contracts: Contract[];
  oneOffs: OneOff[];
  cases: Case[];
  notifications: AppNotification[];
  timesheets: Timesheet[];
  knowledgeArticles: KnowledgeArticle[];
  caseFeedbacks: CaseFeedback[];
  spareParts: SparePart[];

  // Database operations
  updateProfile: (id: string, fullName: string, role: UserRole, password?: string, hourlyCost?: number, email?: string) => Promise<void>;
  
  addBrand: (brand: Omit<Brand, 'id'>) => void;
  updateBrand: (id: string, brand: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;

  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;

  addCertificateDefinition: (certDef: Omit<CertificateDefinition, 'id'>) => void;
  updateCertificateDefinition: (id: string, certDef: Partial<CertificateDefinition>) => void;
  deleteCertificateDefinition: (id: string) => void;

  addCertificate: (cert: Omit<Certificate, 'id' | 'status'>) => void;
  updateCertificate: (id: string, cert: Partial<Certificate>) => void;
  deleteCertificate: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addContract: (contract: Omit<Contract, 'id'>) => void;
  updateContract: (id: string, contract: Partial<Contract>) => void;
  deleteContract: (id: string) => void;

  addOneOff: (oneOff: Omit<OneOff, 'id'>) => void;
  updateOneOff: (id: string, oneOff: Partial<OneOff>) => void;
  deleteOneOff: (id: string) => void;

  addCase: (caseData: Omit<Case, 'id' | 'created_at' | 'sla_countdown_hours'>) => void;
  updateCase: (id: string, caseData: Partial<Case>) => void;
  addCaseComment: (id: string, text: string) => void;
  deleteCase: (id: string) => void;
  addTimesheet: (timesheet: Omit<Timesheet, 'id' | 'status' | 'created_at'>) => Promise<void>;
  updateTimesheet: (id: string, timesheet: Partial<Timesheet>) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
  approveTimesheet: (id: string, status: 'Approved' | 'Rejected' | 'Submitted') => Promise<void>;
  addKnowledgeArticle: (article: Omit<KnowledgeArticle, 'id' | 'views_count' | 'helpful_votes' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateKnowledgeArticle: (id: string, article: Partial<KnowledgeArticle>) => Promise<void>;
  deleteKnowledgeArticle: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  voteHelpful: (id: string) => Promise<void>;
  addCaseFeedback: (feedback: Omit<CaseFeedback, 'id' | 'created_at'>) => Promise<void>;
  deleteCaseFeedback: (id: string) => Promise<void>;

  addSparePart: (sparePart: Omit<SparePart, 'id' | 'status'>) => Promise<void>;
  updateSparePart: (id: string, sparePart: Partial<SparePart>) => Promise<void>;
  deleteSparePart: (id: string) => Promise<void>;

  markNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Initial Mock Data ---

const initialProfiles: Profile[] = [
  { id: 'u1', full_name: 'Kemal Yılmaz', email: 'kemal@techservices.com', role: 'Direktör', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kemal', updated_at: new Date().toISOString(), password: '123456', hourly_cost: 120 },
  { id: 'u2', full_name: 'Ayşe Kaya', email: 'ayse@techservices.com', role: 'Müdür', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ayse', updated_at: new Date().toISOString(), password: '123456', hourly_cost: 90 },
  { id: 'u3', full_name: 'Can Demir', email: 'can@techservices.com', role: 'Presales', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Can', updated_at: new Date().toISOString(), password: '123456', hourly_cost: 60 },
  { id: 'u4', full_name: 'Elif Şahin', email: 'elif@techservices.com', role: 'Postsales', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Elif', updated_at: new Date().toISOString(), password: '123456', hourly_cost: 45 },
];

const initialBrands: Brand[] = [
  { id: 'b1', name: 'Cisco', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=CS', description: 'Network ve güvenlik sistemleri lideri.' },
  { id: 'b2', name: 'Fortinet', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=FT', description: 'Yeni nesil siber güvenlik ve SD-WAN çözümleri.' },
  { id: 'b3', name: 'Microsoft', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=MS', description: 'Bulut altyapı, işletim sistemleri ve kurumsal çözümler.' },
  { id: 'b4', name: 'VMware', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=VM', description: 'Sanallaştırma ve çoklu bulut yönetimi teknolojileri.' },
];

const initialServices: Service[] = [
  { id: 's1', name: 'Kurulum ve Konfigürasyon', brand_id: 'b1', description: 'Cisco omurga ve kenar anahtarların kurulumu ve konfigürasyonu.', price_per_hour: 150 },
  { id: 's2', name: 'Firewall Kural Denetimi ve Güvenlik Sıkılaştırma', brand_id: 'b2', description: 'Fortigate güvenlik duvarı kurallarının optimizasyonu.', price_per_hour: 180 },
  { id: 's3', name: 'Azure Bulut Migrasyon Danışmanlığı', brand_id: 'b3', description: 'Yerel sunucuların Azure bulut ortamına taşınması tasarımı.', price_per_hour: 220 },
  { id: 's4', name: 'vSphere Küme Kurulumu ve Optimizasyonu', brand_id: 'b4', description: 'VMware sanallaştırma altyapısının yedekli kurulumu.', price_per_hour: 200 },
];

const initialCertificateDefinitions: CertificateDefinition[] = [
  { id: 'cd1', name: 'CCIE Enterprise Infrastructure', brand_id: 'b1' },
  { id: 'cd2', name: 'NSE 8 Network Security Expert', brand_id: 'b2' },
  { id: 'cd3', name: 'Azure Solutions Architect Expert', brand_id: 'b3' },
];

const initialCertificates: Certificate[] = [
  { id: 'c1', name: 'CCIE Enterprise Infrastructure', brand_id: 'b1', profile_id: 'u4', issue_date: '2024-05-15', expiry_date: '2026-05-15', status: 'Expired' },
  { id: 'c2', name: 'NSE 8 Network Security Expert', brand_id: 'b2', profile_id: 'u4', issue_date: '2023-09-10', expiry_date: '2026-06-10', status: 'Expiring' },
  { id: 'c3', name: 'Azure Solutions Architect Expert', brand_id: 'b3', profile_id: 'u3', issue_date: '2025-01-20', expiry_date: '2027-01-20', status: 'Active' },
];

const initialCustomers: Customer[] = [
  { id: 'cust1', name: 'Turkcell İletişim Hizmetleri', industry: 'Telekomünikasyon', contact_person: 'Ahmet Aksoy', email: 'ahmet.aksoy@turkcell.com.tr', phone: '0532 111 2233' },
  { id: 'cust2', name: 'Garanti BBVA Teknoloji', industry: 'Finans / Bankacılık', contact_person: 'Zeynep Balcı', email: 'zeynep.balci@garantibbva.com.tr', phone: '0212 555 4433' },
  { id: 'cust3', name: 'Eczacıbaşı Holding', industry: 'Holding', contact_person: 'Murat Can', email: 'murat.can@eczacibasi.com.tr', phone: '0212 444 3322' },
];

const initialContracts: Contract[] = [
  { id: 'con1', customer_id: 'cust1', name: 'Turkcell Cisco Network Destek Sözleşmesi', start_date: '2026-01-01', end_date: '2026-12-31', value: 85000, sla_details: '7/24 Destek, Kritik Durumlarda 2 Saat Müdahale Süresi', status: 'Active' },
  { id: 'con2', customer_id: 'cust2', name: 'Garanti Fortinet Firewall Bakım Anlaşması', start_date: '2025-07-01', end_date: '2026-07-01', value: 64000, sla_details: '5/9 Destek, Kritik Durumlarda 4 Saat Müdahale Süresi', status: 'Active' },
  { id: 'con3', customer_id: 'cust3', name: 'Eczacıbaşı VMware Altyapı Desteği', start_date: '2025-01-01', end_date: '2025-12-31', value: 45000, sla_details: '8/5 Destek, 8 Saat Müdahale Süresi', status: 'Expired' },
];

const initialOneOffs: OneOff[] = [
  { id: 'o1', customer_id: 'cust1', name: 'Turkcell Kartal Veri Merkezi Migrasyonu', amount: 120000, status: 'In Progress' },
  { id: 'o2', customer_id: 'cust2', name: 'Garanti Şube SD-WAN Dönüşüm Projesi', amount: 95000, status: 'Draft' },
  { id: 'o3', customer_id: 'cust3', name: 'Eczacıbaşı Active Directory Yenileme Projesi', amount: 35000, status: 'Completed' },
];

const initialCases: Case[] = [
  {
    id: 't1',
    customer_id: 'cust1',
    contract_id: 'con1',
    title: 'Kartal Omurga Anahtarında Paket Kaybı',
    description: 'Veri merkezindeki Cisco Nexus anahtarda arayüz hataları gözlenmekte ve paket kaybı yaşanmaktadır. Trafik olumsuz etkilenmektedir.',
    severity: 'Critical',
    status: 'In Progress',
    assigned_to: 'u4',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    sla_countdown_hours: 1.8,
    comments: [
      { author: 'Can Demir', text: 'İlk incelemede fiber kablo hatası veya SFP modül arızası olabileceği tespit edildi. Fiziksel kontrol talep edildi.', date: new Date(Date.now() - 3600000 * 2.5).toISOString() },
      { author: 'Elif Şahin', text: 'SFP modülü yedek parça ile değiştirildi, arayüz hataları durdu. Paket kaybı gözlenmiyor, izlemeye alındı.', date: new Date(Date.now() - 3600000 * 1).toISOString() }
    ]
  },
  {
    id: 't2',
    customer_id: 'cust2',
    contract_id: 'con2',
    title: 'Fortigate Firewall Kural Değişikliği Talebi',
    description: 'Yeni açılacak test sunucusu için DMZ bölgesinden dış dünyaya yönelik belirli portların (80, 443) erişime açılması talep edilmektedir.',
    severity: 'Medium',
    status: 'Open',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
    sla_countdown_hours: 24.0,
    comments: []
  },
  {
    id: 't3',
    customer_id: 'cust3',
    title: 'Azure AD Lisans Aktivasyon Sorunu',
    description: 'Active Directory yenileme projesinin ardından bazı kullanıcıların E5 lisansları aktifleşmemektedir.',
    severity: 'High',
    status: 'Resolved',
    assigned_to: 'u3',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    sla_countdown_hours: 0,
    comments: [
      { author: 'Can Demir', text: 'Microsoft portalındaki lisans atama kuralları güncellendi. Senkronizasyon tetiklendi ve sorun çözüldü.', date: new Date(Date.now() - 3600000 * 20).toISOString() }
    ]
  }
];

const initialNotifications: AppNotification[] = [
  { id: 'n1', title: 'Kritik Sertifika Süresi Doldu', message: 'Elif Şahin\'e ait "CCIE Enterprise" sertifikasının süresi dolmuştur!', severity: 'error', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), read: false },
  { id: 'n2', title: 'Yeni Kritik Destek Talebi', message: 'Turkcell için "Kartal Omurga Anahtarında Paket Kaybı" başlıklı CRITICAL talep açılmıştır.', severity: 'warning', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), read: false },
];

const initialTimesheets: Timesheet[] = [
  {
    id: 'tms1',
    profile_id: 'u4',
    case_id: 't1',
    activity_date: '2026-05-26',
    hours_spent: 2.50,
    description: 'Cisco Nexus omurga anahtarında fiber kablo ve SFP modülü değişimi yapıldı. Paket kaybı gözlenmiyor.',
    is_billable: true,
    status: 'Approved',
    approved_by: 'u2',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'tms2',
    profile_id: 'u4',
    case_id: 't2',
    activity_date: '2026-05-27',
    hours_spent: 1.00,
    description: 'Fortigate firewall kurallarının optimizasyonu ve DMZ-WAN izinlerinin yazılması.',
    is_billable: true,
    status: 'Submitted',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'tms3',
    profile_id: 'u3',
    oneoff_id: 'o1',
    activity_date: '2026-05-27',
    hours_spent: 4.50,
    description: 'Turkcell Kartal veri merkezi migrasyonu kapsamında sunucu taşıma planı hazırlandı.',
    is_billable: false,
    status: 'Draft',
    created_at: new Date().toISOString()
  }
];

const initialKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'ka1',
    title: 'Cisco Nexus SFP+ Modül Hataları ve Rx/Tx Güç Kaybı Çözümü',
    content: '### Sorun Açıklaması\nCisco Nexus omurga anahtarlarında (örn: Nexus 9000 serisi) fiber bağlantılarda paket kaybı yaşanması veya portun sürekli `up/down` konumuna düşmesi.\n\n### Teşhis Adımları\n1. Anahtara SSH ile bağlanıp hata veren portu inceleyin:\n   ```bash\n   show interface ethernet 1/12 transceiver details\n   ```\n2. Optik Rx/Tx güç seviyelerini kontrol edin. Güç seviyesi `-12 dBm` seviyesinden düşükse (örn: `-15 dBm` veya `-40 dBm` Rx power) hat zayıflaması veya arızalı SFP söz konusudur.\n\n### Çözüm Adımları\n- Portu kapatıp (`shutdown`), SFP modülünü yerinden çıkarın.\n- Fiber patch kablonun uçlarını optik temizleme kalemi (One-click cleaner) ile temizleyin.\n- Sorun devam ederse, Tx/Rx değerlerini kontrol ederek SFP modülünü yedek parça ile değiştirin.\n- Portu tekrar açın (`no shutdown`). Hataların durduğunu `show interface counters errors` komutu ile doğrulayın.',
    brand_id: 'b1',
    service_id: 's1',
    created_by: 'u4',
    tags: ['sfp', 'nexus', 'packet-loss', 'cisco', 'fiber'],
    views_count: 24,
    helpful_votes: 12,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'ka2',
    title: 'Fortigate Güvenlik Duvarı SD-WAN ve WAN SLA Kuralları Konfigürasyonu',
    content: '### Sorun Açıklaması\nİki adet WAN bacağının (örn: WAN1 Telekom, WAN2 Turkcell) aktif-aktif çalıştırılması ve gecikme (latency) veya paket kaybı durumunda trafiğin otomatik olarak sağlıklı WAN bacağına yönlendirilmemesi.\n\n### Çözüm ve Yapılandırma\n1. **SD-WAN Zone Oluşturma:**\n   - `Network > SD-WAN` bölümüne gidin.\n   - `SD-WAN Members` sekmesinde WAN1 ve WAN2 arayüzlerini aynı gruba ekleyin.\n2. **Performance SLA Tanımlama:**\n   - `Performance SLA` sekmesinde `Create New` tıklayın.\n   - Target IP olarak kararlı bir DNS sunucusu (örn: `8.8.8.8`) belirleyin.\n   - SLA Target parametrelerini ayarlayın: `Latency Threshold: 100ms`, `Packet Loss: 2%`.\n3. **SD-WAN Rules Oluşturma:**\n   - Trafiğin hangi kurala göre aktarılacağını seçin (örn: `Lowest Cost (SLA)` veya `Maximize Bandwidth`).\n   - `Performance SLA` olarak az önce oluşturduğunuz kuralı seçin. Bu sayede SLA değeri aşan WAN bacağı otomatik olarak devre dışı bırakılacaktır.',
    brand_id: 'b2',
    service_id: 's2',
    created_by: 'u4',
    tags: ['fortigate', 'sd-wan', 'sla', 'failover', 'firewall'],
    views_count: 42,
    helpful_votes: 18,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'ka3',
    title: 'Azure AD (Entra ID) Kullanıcı Lisans Ataması ve Grup Bazlı Senkronizasyon Hataları',
    content: '### Sorun Açıklaması\nYerel Active Directory üzerinde oluşturulan kullanıcıların Azure AD (Entra ID) ortamına eşitlendikten sonra, grup tabanlı otomatik Microsoft 365 E5 lisans atama kurallarının çalışmaması.\n\n### Nedenleri ve Teşhis\n- Kullanıcının `Usage Location` (Kullanım Konumu) parametresinin tanımlanmamış olması (Microsoft, konumu olmayan kullanıcılara otomatik lisans atayamaz).\n- Azure AD Connect senkronizasyonunun takılması veya çakışan `UserPrincipalName` (UPN) hataları.\n\n### Çözüm Adımları\n1. **Kullanım Konumu Tanımlama:**\n   - Kullanıcının profilinden `Usage Location` alanını `Turkey (TR)` olarak güncelleyin veya PowerShell ile topluca tanımlayın:\n     ```powershell\n     Get-MsolUser -All | Where-Object {$_.UsageLocation -eq $null} | Set-MsolUser -UsageLocation "TR"\n     ```\n2. **Azure AD Connect Senkronizasyonunu Tetikleme:**\n   - Eşitleme sunucusunda PowerShell açıp delta eşitlemeyi tetikleyin:\n     ```powershell\n     Start-ADSyncSyncCycle -PolicyType Delta\n     ```\n3. Azure AD Portal > Groups > Lisans Atanan Grup > `Reprocess` butonuna tıklayarak lisans kurallarını yeniden uygulayın.',
    brand_id: 'b3',
    service_id: 's3',
    created_by: 'u3',
    tags: ['azure', 'ad-connect', 'licensing', 'office365', 'powershell'],
    views_count: 15,
    helpful_votes: 8,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

const initialCaseFeedbacks: CaseFeedback[] = [
  { id: 'cf1', case_id: 't3', rating: 5, comments: 'Can Demir yerel Active Directory ve portal eşitleme problemlerimizi çok hızlı ve profesyonelce çözdü. Çok teşekkürler!', created_at: new Date(Date.now() - 3600000 * 20).toISOString() }
];

const initialSpareParts: SparePart[] = [
  { id: 'sp1', name: 'Cisco Nexus SFP-10G-SR Modülü', part_code: 'SFP-10G-SR', serial_number: 'FDO24120ABC', brand_id: 'b1', project_id: 'o1', is_pool: false, stock_in_date: '2026-01-15', stock_out_date: null, status: 'InStock', notes: 'Turkcell Kartal migrasyonu için yedek optik modül.' },
  { id: 'sp2', name: 'Fortinet FortiGate Güç Kaynağı Ünitesi', part_code: 'FG-PSU-460', serial_number: 'SN-PSU-7781', brand_id: 'b2', project_id: null, is_pool: true, stock_in_date: '2025-08-10', stock_out_date: null, status: 'InStock', notes: 'Havuz yedeği - acil arıza durumları için.' },
  { id: 'sp3', name: 'VMware Sunucu RAID Denetleyici Kartı', part_code: 'RAID-9460-16i', serial_number: 'SV-RC-55012', brand_id: 'b4', project_id: null, is_pool: true, stock_in_date: '2025-03-01', stock_out_date: '2026-04-20', status: 'Out', notes: 'Eczacıbaşı sahasında arızalı kart yerine kullanıldı.' },
  { id: 'sp4', name: 'Microsoft Surface Yedek Batarya', part_code: 'SRF-BAT-65W', serial_number: 'MS-BAT-90233', brand_id: 'b3', project_id: 'o2', is_pool: false, stock_in_date: '2026-05-05', stock_out_date: null, status: 'InStock', notes: 'Garanti SD-WAN projesi saha ekibi için.' },
];

// --- Context Provider Component ---

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Authentication State
  const [user, setUser] = useState<Profile | null>(null);

  // Database Tables State (initialized from mock data or local storage if exists)
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [certificateDefinitions, setCertificateDefinitions] = useState<CertificateDefinition[]>(initialCertificateDefinitions);
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [oneOffs, setOneOffs] = useState<OneOff[]>(initialOneOffs);
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [timesheets, setTimesheets] = useState<Timesheet[]>(initialTimesheets);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(initialKnowledgeArticles);
  const [caseFeedbacks, setCaseFeedbacks] = useState<CaseFeedback[]>(initialCaseFeedbacks);
  const [spareParts, setSpareParts] = useState<SparePart[]>(initialSpareParts);

  // Fetch dynamic data from Supabase
  const fetchInitialData = async () => {
    try {
      const [
        { data: profilesData },
        { data: brandsData },
        { data: servicesData },
        { data: certDefsData },
        { data: certsData },
        { data: customersData },
        { data: contractsData },
        { data: oneoffsData },
        { data: casesData },
        { data: commentsData },
        { data: notificationsData },
        { data: timesheetsData },
        { data: knowledgeArticlesData },
        { data: feedbacksData },
        { data: sparePartsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('brands').select('*'),
        supabase.from('services').select('*'),
        supabase.from('certificate_definitions').select('*'),
        supabase.from('certificates').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('contracts').select('*'),
        supabase.from('oneoffs').select('*'),
        supabase.from('cases').select('*'),
        supabase.from('case_comments').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('timesheets').select('*'),
        supabase.from('knowledge_articles').select('*'),
        supabase.from('case_feedbacks').select('*'),
        supabase.from('spare_parts').select('*'),
      ]);

      if (profilesData) setProfiles(profilesData as Profile[]);
      if (brandsData) setBrands(brandsData as Brand[]);
      if (servicesData) setServices(servicesData as Service[]);
      if (certDefsData) setCertificateDefinitions(certDefsData as CertificateDefinition[]);
      if (certsData) setCertificates(certsData as Certificate[]);
      if (customersData) setCustomers(customersData as Customer[]);
      if (contractsData) setContracts(contractsData as Contract[]);
      if (oneoffsData) setOneOffs(oneoffsData as OneOff[]);
      if (timesheetsData) setTimesheets(timesheetsData as Timesheet[]);
      if (knowledgeArticlesData) setKnowledgeArticles(knowledgeArticlesData as KnowledgeArticle[]);
      if (feedbacksData) setCaseFeedbacks(feedbacksData as CaseFeedback[]);
      if (sparePartsData) setSpareParts(sparePartsData as SparePart[]);

      if (casesData) {
        const mappedCases = (casesData as Case[]).map((c) => ({
          ...c,
          comments: (commentsData || [])
            .filter((comment: any) => comment.case_id === c.id)
            .map((comment: any) => ({
              author: comment.author,
              text: comment.text,
              date: comment.date,
            })),
        }));
        setCases(mappedCases);
      }

      if (notificationsData) setNotifications(notificationsData as AppNotification[]);
    } catch (error) {
      console.error('Error fetching initial Supabase data:', error);
    }
  };

  // Sync auth and database on start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('psa_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }

    fetchInitialData();

    // Setup Supabase Realtime Channel
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          fetchInitialData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime tick SLA Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const initialSlaMap = {
        Critical: 2.0,
        High: 4.0,
        Medium: 24.0,
        Low: 72.0
      };

      // 1. Tick down SLA counter on open/in-progress cases
      setCases((prevCases) => {
        const updated = prevCases.map((c) => {
          if ((c.status === 'Open' || c.status === 'In Progress') && c.sla_countdown_hours > 0) {
            const nextVal = parseFloat((c.sla_countdown_hours - 0.05).toFixed(2));
            const finalVal = nextVal < 0 ? 0 : nextVal;
            
            // Sync tick to Supabase periodically in background
            supabase.from('cases').update({ sla_countdown_hours: finalVal }).eq('id', c.id);
            
            return { ...c, sla_countdown_hours: finalVal };
          }
          return c;
        });

        // 2. Escalation trigger and check for each case
        updated.forEach((c) => {
          if (c.status === 'Open' || c.status === 'In Progress') {
            const initialLimit = initialSlaMap[c.severity] || 24.0;
            const remainingRatio = c.sla_countdown_hours / initialLimit;
            const percentage = remainingRatio * 100;

            if (c.sla_countdown_hours === 0) {
              // Red Alert
              const exists = notifications.some((n) => n.title.includes(c.title) && n.title.includes('SLA İhlali'));
              if (!exists) {
                const newAlert = {
                  id: `n_${Date.now()}_sla_red`,
                  title: `🔴 SLA İhlali! - ${c.customer_name || 'Müşteri'}`,
                  message: `"${c.title}" başlıklı talebin SLA süresi aşılmıştır! Bölüm Direktörü (Kemal Yılmaz) ve teknik operasyon ekibi alarma geçirildi.`,
                  severity: 'error' as const,
                  timestamp: new Date().toISOString(),
                  read: false
                };
                setNotifications((prev) => [newAlert, ...prev]);
                supabase.from('notifications').insert(newAlert);
              }
            } else if (percentage <= 25) {
              // Orange Alert
              const exists = notifications.some((n) => n.title.includes(c.title) && n.title.includes('SLA Kritik Seviye'));
              if (!exists) {
                const newAlert = {
                  id: `n_${Date.now()}_sla_orange`,
                  title: `🚨 SLA Kritik Seviye (%75) - ${c.customer_name || 'Müşteri'}`,
                  message: `"${c.title}" başlıklı talebin kalan SLA süresi %25'in altına inmiştir! Bölüm Müdürü (Ayşe Kaya) eskalasyon zincirine dahil edildi.`,
                  severity: 'error' as const,
                  timestamp: new Date().toISOString(),
                  read: false
                };
                setNotifications((prev) => [newAlert, ...prev]);
                supabase.from('notifications').insert(newAlert);
              }
            } else if (percentage <= 50) {
              // Yellow Alert
              const exists = notifications.some((n) => n.title.includes(c.title) && n.title.includes('SLA Uyarısı'));
              if (!exists) {
                const newAlert = {
                  id: `n_${Date.now()}_sla_yellow`,
                  title: `⚠️ SLA Uyarısı (%50) - ${c.customer_name || 'Müşteri'}`,
                  message: `"${c.title}" başlıklı vakanın SLA süresi %50'nin altına indi! Sorumlu mühendis eskalasyonu tetiklendi.`,
                  severity: 'warning' as const,
                  timestamp: new Date().toISOString(),
                  read: false
                };
                setNotifications((prev) => [newAlert, ...prev]);
                supabase.from('notifications').insert(newAlert);
              }
            }
          }
        });

        return updated;
      });
    }, 10000); // every 10s simulates SLA countdown ticks

    return () => clearInterval(interval);
  }, [notifications, customers]);

  // Auth Actions
  const login = async (role: UserRole, email?: string, password?: string): Promise<boolean> => {
    // 1. Try real authentication with email and password first if provided
    if (email && password) {
      const matched = profiles.find((p) => p.email === email && p.password === password);
      if (matched) {
        setUser(matched);
        localStorage.setItem('psa_user', JSON.stringify(matched));
        return true;
      }
    }

    // 2. Fallback to role-based simulation quick login
    const selectedProfile = profiles.find((p) => p.role === role);
    if (selectedProfile) {
      setUser(selectedProfile);
      localStorage.setItem('psa_user', JSON.stringify(selectedProfile));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('psa_user');
  };

  // DB CRUD Operations synced to Supabase
  const updateProfile = async (id: string, fullName: string, role: UserRole, password?: string, hourlyCost?: number, email?: string) => {
    // 1. Prepare main profile data (columns GUARANTEED to exist in base schema.sql)
    const updateData: any = { full_name: fullName, role, updated_at: new Date().toISOString() };
    if (email !== undefined) {
      updateData.email = email;
    }

    // Update local profiles state optimistically for instant UI updates
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, full_name: fullName, role, updated_at: updateData.updated_at };
          if (hourlyCost !== undefined) updated.hourly_cost = hourlyCost;
          if (password) updated.password = password;
          if (email !== undefined) updated.email = email;
          return updated;
        }
        return p;
      })
    );

    // 2. Update main profile fields in database (Ad Soyad, E-posta, Yetki Rolü)
    const { error: mainError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (mainError) {
      console.error('Error updating main profile fields in Supabase:', {
        message: mainError.message,
        code: mainError.code,
        details: mainError.details,
        hint: mainError.hint,
      });
      message.error(`Profil bilgileri güncellenirken veritabanı hatası oluştu: ${mainError.message || 'Bilinmeyen hata'}`);
      return;
    }

    // 3. Try to update hourly_cost in an isolated query (may fail if financials.sql was not run yet)
    if (hourlyCost !== undefined) {
      const { error: costError } = await supabase
        .from('profiles')
        .update({ hourly_cost: hourlyCost })
        .eq('id', id);
        
      if (costError) {
        console.warn('hourly_cost column does not exist in your Supabase schema yet. Run financials.sql migration in Supabase console!', costError);
      }
    }

    // 4. Try to update password in a separate, isolated query (may fail if add_password.sql was not run yet)
    if (password !== undefined) {
      const { error: passError } = await supabase
        .from('profiles')
        .update({ password })
        .eq('id', id);
        
      if (passError) {
        console.warn('Password column does not exist in your Supabase schema yet. Run add_password.sql migration in Supabase console!', passError);
      }
    }

    // If current user, update state as well
    if (user && user.id === id) {
      const updatedUser = { ...user, full_name: fullName, role };
      if (hourlyCost !== undefined) {
        updatedUser.hourly_cost = hourlyCost;
      }
      if (email !== undefined) {
        updatedUser.email = email;
      }
      setUser(updatedUser);
      localStorage.setItem('psa_user', JSON.stringify(updatedUser));
    }
  };

  const addBrand = async (brand: Omit<Brand, 'id'>) => {
    const newBrand = { ...brand, id: `b_${Date.now()}` };
    await supabase.from('brands').insert(newBrand);
  };

  const updateBrand = async (id: string, brandData: Partial<Brand>) => {
    await supabase.from('brands').update(brandData).eq('id', id);
  };

  const deleteBrand = async (id: string) => {
    await supabase.from('brands').delete().eq('id', id);
  };

  const addService = async (service: Omit<Service, 'id'>) => {
    const newService = { ...service, id: `s_${Date.now()}` };
    await supabase.from('services').insert(newService);
  };

  const updateService = async (id: string, serviceData: Partial<Service>) => {
    await supabase.from('services').update(serviceData).eq('id', id);
  };

  const deleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
  };

  const addCertificate = async (cert: Omit<Certificate, 'id' | 'status'>) => {
    const exp = new Date(cert.expiry_date);
    const now = new Date();
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const status = daysLeft < 0 ? 'Expired' : daysLeft <= 30 ? 'Expiring' : 'Active';

    const newCert = { ...cert, id: `c_${Date.now()}`, status };
    await supabase.from('certificates').insert(newCert);

    if (status !== 'Active') {
      const p = profiles.find((p) => p.id === cert.profile_id);
      const newNotification: AppNotification = {
        id: `n_${Date.now()}_cert`,
        title: status === 'Expired' ? 'Sertifika Süresi Doldu' : 'Sertifika Süresi Yaklaşıyor',
        message: `${p?.full_name || 'Personel'} adına kayıtlı "${cert.name}" sertifikası ${status === 'Expired' ? 'geçersiz durumdadır' : 'yakında süresi dolacaktır'}!`,
        severity: status === 'Expired' ? 'error' : 'warning',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications((prev) => [newNotification, ...prev]);
      await supabase.from('notifications').insert(newNotification);
    }
  };

  const updateCertificate = async (id: string, certData: Partial<Certificate>) => {
    const original = certificates.find((c) => c.id === id);
    if (!original) return;

    const merged = { ...original, ...certData };
    if (certData.expiry_date) {
      const exp = new Date(merged.expiry_date);
      const now = new Date();
      const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      merged.status = daysLeft < 0 ? 'Expired' : daysLeft <= 30 ? 'Expiring' : 'Active';
    }

    await supabase
      .from('certificates')
      .update({
        name: merged.name,
        brand_id: merged.brand_id,
        profile_id: merged.profile_id,
        issue_date: merged.issue_date,
        expiry_date: merged.expiry_date,
        status: merged.status
      })
      .eq('id', id);
  };

  const deleteCertificate = async (id: string) => {
    await supabase.from('certificates').delete().eq('id', id);
  };

  const addCertificateDefinition = async (certDef: Omit<CertificateDefinition, 'id'>) => {
    const newDef = { ...certDef, id: `cd_${Date.now()}` };
    await supabase.from('certificate_definitions').insert(newDef);
  };

  const updateCertificateDefinition = async (id: string, certDefData: Partial<CertificateDefinition>) => {
    await supabase.from('certificate_definitions').update(certDefData).eq('id', id);
  };

  const deleteCertificateDefinition = async (id: string) => {
    await supabase.from('certificate_definitions').delete().eq('id', id);
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    const newCustomer = { ...customer, id: `cust_${Date.now()}` };
    await supabase.from('customers').insert(newCustomer);
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    await supabase.from('customers').update(customerData).eq('id', id);
  };

  const deleteCustomer = async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
  };

  const addContract = async (contract: Omit<Contract, 'id'>) => {
    const newContract = { ...contract, id: `con_${Date.now()}` };
    await supabase.from('contracts').insert(newContract);
  };

  const updateContract = async (id: string, contractData: Partial<Contract>) => {
    await supabase.from('contracts').update(contractData).eq('id', id);
  };

  const deleteContract = async (id: string) => {
    await supabase.from('contracts').delete().eq('id', id);
  };

  const addOneOff = async (oneOff: Omit<OneOff, 'id'>) => {
    const newOneOff = { ...oneOff, id: `o_${Date.now()}` };
    await supabase.from('oneoffs').insert(newOneOff);
  };

  const updateOneOff = async (id: string, oneOffData: Partial<OneOff>) => {
    await supabase.from('oneoffs').update(oneOffData).eq('id', id);
  };

  const deleteOneOff = async (id: string) => {
    await supabase.from('oneoffs').delete().eq('id', id);
  };

  const addSparePart = async (sparePart: Omit<SparePart, 'id' | 'status'>) => {
    const status: SparePart['status'] = sparePart.stock_out_date ? 'Out' : 'InStock';
    const newSparePart = {
      ...sparePart,
      id: `sp_${Date.now()}`,
      status,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('spare_parts').insert(newSparePart);
  };

  const updateSparePart = async (id: string, sparePartData: Partial<SparePart>) => {
    const original = spareParts.find((sp) => sp.id === id);
    const merged = { ...original, ...sparePartData };
    const status: SparePart['status'] = merged.stock_out_date ? 'Out' : 'InStock';
    await supabase
      .from('spare_parts')
      .update({ ...sparePartData, status, updated_at: new Date().toISOString() })
      .eq('id', id);
  };

  const deleteSparePart = async (id: string) => {
    await supabase.from('spare_parts').delete().eq('id', id);
  };

  const addCase = async (caseData: Omit<Case, 'id' | 'created_at' | 'sla_countdown_hours'>) => {
    let slaVal = 24.0;
    if (caseData.severity === 'Critical') slaVal = 2.0;
    else if (caseData.severity === 'High') slaVal = 4.0;
    else if (caseData.severity === 'Low') slaVal = 72.0;

    const newCase = {
      ...caseData,
      id: `t_${Date.now()}`,
      created_at: new Date().toISOString(),
      sla_countdown_hours: slaVal
    };
    await supabase.from('cases').insert(newCase);

    const cust = customers.find((c) => c.id === caseData.customer_id);
    const newAlert: AppNotification = {
      id: `n_${Date.now()}_case`,
      title: `Yeni Destek Talebi [${caseData.severity}]`,
      message: `"${cust?.name || 'Müşteri'}" için yeni bir talep açıldı: "${caseData.title}"`,
      severity: caseData.severity === 'Critical' ? 'error' : caseData.severity === 'High' ? 'warning' : 'info',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newAlert, ...prev]);
    await supabase.from('notifications').insert(newAlert);
  };

  const updateCase = async (id: string, caseData: Partial<Case>) => {
    const original = cases.find((c) => c.id === id);
    if (!original) return;

    const merged = { ...original, ...caseData };
    if (caseData.severity && original.status === 'Open') {
      let slaVal = 24.0;
      if (caseData.severity === 'Critical') slaVal = 2.0;
      else if (caseData.severity === 'High') slaVal = 4.0;
      else if (caseData.severity === 'Low') slaVal = 72.0;
      merged.sla_countdown_hours = slaVal;
    }
    if (caseData.status === 'Resolved' || caseData.status === 'Closed') {
      merged.sla_countdown_hours = original.sla_countdown_hours;
    }

    await supabase
      .from('cases')
      .update({
        title: merged.title,
        description: merged.description,
        severity: merged.severity,
        status: merged.status,
        assigned_to: merged.assigned_to,
        sla_countdown_hours: merged.sla_countdown_hours
      })
      .eq('id', id);
  };

  const addCaseComment = async (caseId: string, commentText: string) => {
    const newComment = {
      id: `cc_${Date.now()}`,
      case_id: caseId,
      author: user?.full_name || 'Sistem',
      text: commentText,
      date: new Date().toISOString()
    };
    await supabase.from('case_comments').insert(newComment);
  };

  const deleteCase = async (id: string) => {
    await supabase.from('cases').delete().eq('id', id);
  };

  const addTimesheet = async (t: Omit<Timesheet, 'id' | 'status' | 'created_at'>) => {
    const newTimesheet = {
      ...t,
      id: `tms_${Date.now()}`,
      status: 'Draft' as TimesheetStatus,
      created_at: new Date().toISOString()
    };
    setTimesheets((prev) => [newTimesheet, ...prev]);
    await supabase.from('timesheets').insert(newTimesheet);
  };

  const updateTimesheet = async (id: string, data: Partial<Timesheet>) => {
    setTimesheets((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    await supabase.from('timesheets').update(data).eq('id', id);
  };

  const deleteTimesheet = async (id: string) => {
    setTimesheets((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('timesheets').delete().eq('id', id);
  };

  const approveTimesheet = async (id: string, status: 'Approved' | 'Rejected' | 'Submitted') => {
    const original = timesheets.find((t) => t.id === id);
    if (!original) return;

    const data = {
      status,
      approved_by: status === 'Submitted' ? null : (user?.id || null)
    };

    setTimesheets((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    await supabase.from('timesheets').update(data).eq('id', id);

    if (status !== 'Submitted') {
      // Create notification for engineer if approved or rejected
      const newAlert: AppNotification = {
        id: `n_${Date.now()}_tms`,
        title: status === 'Approved' ? 'Efor Onaylandı' : 'Efor Reddedildi',
        message: `${user?.full_name || 'Yönetici'}, "${original.description.substring(0, 30)}..." açıklamalı efor kaydınızı ${status === 'Approved' ? 'onayladı' : 'reddetti'}.`,
        severity: status === 'Approved' ? 'info' : 'error',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications((prev) => [newAlert, ...prev]);
      await supabase.from('notifications').insert(newAlert);
    } else {
      // Create notification for engineer that decision was reverted
      const newAlert: AppNotification = {
        id: `n_${Date.now()}_tms`,
        title: 'Efor Kararı Geri Alındı',
        message: `${user?.full_name || 'Yönetici'}, "${original.description.substring(0, 30)}..." açıklamalı efor kaydınızın onay kararını geri aldı ve kaydı inceleme sırasına döndürdü.`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications((prev) => [newAlert, ...prev]);
      await supabase.from('notifications').insert(newAlert);
    }
  };

  const voteHelpful = async (id: string) => {
    setKnowledgeArticles((prev) => prev.map((a) => (a.id === id ? { ...a, helpful_votes: a.helpful_votes + 1 } : a)));
    const original = knowledgeArticles.find((a) => a.id === id);
    if (original) {
      await supabase.from('knowledge_articles').update({ helpful_votes: original.helpful_votes + 1 }).eq('id', id);
    }
  };

  const addCaseFeedback = async (feedback: Omit<CaseFeedback, 'id' | 'created_at'>) => {
    const newFeedback = {
      ...feedback,
      id: `cf_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setCaseFeedbacks((prev) => [...prev, newFeedback]);
    await supabase.from('case_feedbacks').insert(newFeedback);

    // Create notification alert
    const targetCase = cases.find((c) => c.id === feedback.case_id);
    const newAlert: AppNotification = {
      id: `n_${Date.now()}_csat`,
      title: `Yeni Müşteri Geri Bildirimi [⭐ ${feedback.rating}]`,
      message: `"${targetCase?.title || 'Destek Talebi'}" için müşteri oylaması yapıldı: "${feedback.comments || 'Yorumsuz'}"`,
      severity: feedback.rating >= 4 ? 'info' : 'warning',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newAlert, ...prev]);
    await supabase.from('notifications').insert(newAlert);
  };

  const deleteCaseFeedback = async (id: string) => {
    setCaseFeedbacks((prev) => prev.filter((f) => f.id !== id));
    await supabase.from('case_feedbacks').delete().eq('id', id);
  };

  const markNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('read', false);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const addKnowledgeArticle = async (article: Omit<KnowledgeArticle, 'id' | 'views_count' | 'helpful_votes' | 'created_at' | 'updated_at'>) => {
    const newArticle = {
      ...article,
      id: `ka_${Date.now()}`,
      views_count: 0,
      helpful_votes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setKnowledgeArticles((prev) => [newArticle, ...prev]);
    await supabase.from('knowledge_articles').insert(newArticle);
  };

  const updateKnowledgeArticle = async (id: string, articleData: Partial<KnowledgeArticle>) => {
    const updated = {
      ...articleData,
      updated_at: new Date().toISOString()
    };
    setKnowledgeArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    await supabase.from('knowledge_articles').update(updated).eq('id', id);
  };

  const deleteKnowledgeArticle = async (id: string) => {
    setKnowledgeArticles((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('knowledge_articles').delete().eq('id', id);
  };

  const incrementViews = async (id: string) => {
    setKnowledgeArticles((prev) => prev.map((a) => (a.id === id ? { ...a, views_count: a.views_count + 1 } : a)));
    const original = knowledgeArticles.find((a) => a.id === id);
    if (original) {
      await supabase.from('knowledge_articles').update({ views_count: original.views_count + 1 }).eq('id', id);
    }
  };

  // Inject computed names for relational mapping on output variables
  const populatedBrands = brands.map((b) => ({
    ...b,
    services_count: services.filter((s) => s.brand_id === b.id).length
  }));

  const populatedServices = services.map((s) => ({
    ...s,
    brand_name: brands.find((b) => b.id === s.brand_id)?.name || 'Bilinmeyen Marka'
  }));

  const populatedCertificateDefinitions = certificateDefinitions.map((cd) => ({
    ...cd,
    brand_name: brands.find((b) => b.id === cd.brand_id)?.name || 'Bilinmeyen Marka'
  }));

  const populatedCertificates = certificates.map((c) => ({
    ...c,
    brand_name: brands.find((b) => b.id === c.brand_id)?.name || 'Bilinmeyen Marka',
    profile_name: profiles.find((p) => p.id === c.profile_id)?.full_name || 'Bilinmeyen Personel'
  }));

  const populatedContracts = contracts.map((c) => ({
    ...c,
    customer_name: customers.find((cust) => cust.id === c.customer_id)?.name || 'Bilinmeyen Müşteri'
  }));

  const populatedOneOffs = oneOffs.map((o) => ({
    ...o,
    customer_name: customers.find((cust) => cust.id === o.customer_id)?.name || 'Bilinmeyen Müşteri'
  }));

  const populatedProfiles = profiles.map((p) => {
    const userCases = cases.filter((c) => c.assigned_to === p.id);
    const userFeedbacks = caseFeedbacks.filter((f) => userCases.some((c) => c.id === f.case_id));
    const count = userFeedbacks.length;
    const avg = count > 0 ? parseFloat((userFeedbacks.reduce((sum, curr) => sum + curr.rating, 0) / count).toFixed(2)) : 0;
    return {
      ...p,
      average_csat: avg,
      feedbacks_count: count
    };
  });

  const populatedCases = cases.map((c) => {
    const feedback = caseFeedbacks.find((f) => f.case_id === c.id);
    return {
      ...c,
      customer_name: customers.find((cust) => cust.id === c.customer_id)?.name || 'Bilinmeyen Müşteri',
      contract_name: contracts.find((con) => con.id === c.contract_id)?.name || 'Sözleşmesiz',
      assigned_name: profiles.find((p) => p.id === c.assigned_to)?.full_name || 'Atanmamış',
      rating: feedback?.rating,
      feedback_comments: feedback?.comments
    };
  });

  const populatedTimesheets = timesheets.map((t) => {
    const profile = profiles.find((p) => p.id === t.profile_id);
    const c = cases.find((caseItem) => caseItem.id === t.case_id);
    const o = oneOffs.find((oneOffItem) => oneOffItem.id === t.oneoff_id);
    const approver = profiles.find((p) => p.id === t.approved_by);

    let customerName = 'Genel Hizmet';
    if (c) {
      customerName = customers.find((cust) => cust.id === c.customer_id)?.name || 'Bilinmeyen Müşteri';
    } else if (o) {
      customerName = customers.find((cust) => cust.id === o.customer_id)?.name || 'Bilinmeyen Müşteri';
    }

    return {
      ...t,
      profile_name: profile?.full_name || 'Bilinmeyen Mühendis',
      case_title: c?.title || undefined,
      oneoff_name: o?.name || undefined,
      customer_name: customerName,
      approved_name: approver?.full_name || undefined
    };
  });

  const populatedSpareParts = spareParts.map((sp) => ({
    ...sp,
    brand_name: brands.find((b) => b.id === sp.brand_id)?.name || 'Genel',
    project_name: oneOffs.find((o) => o.id === sp.project_id)?.name || undefined,
  }));

  const populatedKnowledgeArticles = knowledgeArticles.map((ka) => {
    const brand = brands.find((b) => b.id === ka.brand_id);
    const service = services.find((s) => s.id === ka.service_id);
    const author = profiles.find((p) => p.id === ka.created_by);

    return {
      ...ka,
      brand_name: brand?.name || 'Genel',
      service_name: service?.name || 'Dahili Hizmet',
      author_name: author?.full_name || 'Bilinmeyen Yazar'
    };
  });

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        profiles: populatedProfiles,
        brands: populatedBrands,
        services: populatedServices,
        certificateDefinitions: populatedCertificateDefinitions,
        certificates: populatedCertificates,
        customers,
        contracts: populatedContracts,
        oneOffs: populatedOneOffs,
        cases: populatedCases,
        notifications,
        timesheets: populatedTimesheets,
        knowledgeArticles: populatedKnowledgeArticles,
        caseFeedbacks,
        spareParts: populatedSpareParts,
        updateProfile,
        addBrand,
        updateBrand,
        deleteBrand,
        addService,
        updateService,
        deleteService,
        addCertificate,
        updateCertificate,
        deleteCertificate,
        addCertificateDefinition,
        updateCertificateDefinition,
        deleteCertificateDefinition,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addContract,
        updateContract,
        deleteContract,
        addOneOff,
        updateOneOff,
        deleteOneOff,
        addCase,
        updateCase,
        addCaseComment,
        deleteCase,
        addTimesheet,
        updateTimesheet,
        deleteTimesheet,
        approveTimesheet,
        addKnowledgeArticle,
        updateKnowledgeArticle,
        deleteKnowledgeArticle,
        incrementViews,
        voteHelpful,
        addCaseFeedback,
        deleteCaseFeedback,
        addSparePart,
        updateSparePart,
        deleteSparePart,
        markNotificationsAsRead,
        markNotificationAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
