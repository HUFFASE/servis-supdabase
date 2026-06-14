'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as actions from '@/lib/actions';
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
  
  addBrand: (brand: Omit<Brand, 'id'>) => Promise<void>;
  updateBrand: (id: string, brand: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;

  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  addCertificateDefinition: (certDef: Omit<CertificateDefinition, 'id'>) => Promise<void>;
  updateCertificateDefinition: (id: string, certDef: Partial<CertificateDefinition>) => Promise<void>;
  deleteCertificateDefinition: (id: string) => Promise<void>;

  addCertificate: (cert: Omit<Certificate, 'id' | 'status'>) => Promise<void>;
  updateCertificate: (id: string, cert: Partial<Certificate>) => Promise<void>;
  deleteCertificate: (id: string) => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addContract: (contract: Omit<Contract, 'id'>) => Promise<void>;
  updateContract: (id: string, contract: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  addOneOff: (oneOff: Omit<OneOff, 'id'>) => Promise<void>;
  updateOneOff: (id: string, oneOff: Partial<OneOff>) => Promise<void>;
  deleteOneOff: (id: string) => Promise<void>;

  addCase: (caseData: Omit<Case, 'id' | 'created_at' | 'sla_countdown_hours'>) => Promise<void>;
  updateCase: (id: string, caseData: Partial<Case>) => Promise<void>;
  addCaseComment: (id: string, text: string) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
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

  markNotificationsAsRead: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Initial Mock Data (Fallback) ---

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

  // Database Tables State
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

  // Fetch dynamic data from database via Server Actions
  const fetchInitialData = async () => {
    try {
      const data = await actions.getInitialData();
      
      setProfiles(data.profiles as Profile[]);
      setBrands(data.brands as Brand[]);
      setServices(data.services as Service[]);
      setCertificateDefinitions(data.certificateDefinitions as CertificateDefinition[]);
      setCertificates(data.certificates as Certificate[]);
      setCustomers(data.customers as Customer[]);
      setContracts(data.contracts as Contract[]);
      setOneOffs(data.oneOffs as OneOff[]);
      setCases(data.cases as any[]);
      setNotifications(data.notifications as AppNotification[]);
      setTimesheets(data.timesheets as Timesheet[]);
      setSpareParts(data.spareParts as SparePart[]);
      setCaseFeedbacks(data.caseFeedbacks as CaseFeedback[]);
      setKnowledgeArticles(data.knowledgeArticles as KnowledgeArticle[]);
    } catch (error) {
      console.error('Error fetching initial database data:', error);
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

    // Client-side Polling: poll database updates every 10 seconds (fully database-agnostic realtime replacement)
    const interval = setInterval(() => {
      fetchInitialData();
    }, 10000);

    return () => {
      clearInterval(interval);
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
            
            // Sync tick to database in background
            actions.updateCaseInDb(c.id, { sla_countdown_hours: finalVal });
            
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
                  title: `🔴 SLA İhlali! - ${c.customer_name || 'Müşteri'}`,
                  message: `"${c.title}" başlıklı talebin SLA süresi aşılmıştır! Bölüm Direktörü (Kemal Yılmaz) ve teknik operasyon ekibi alarma geçirildi.`,
                  severity: 'error'
                };
                actions.addNotificationInDb(newAlert);
              }
            } else if (percentage <= 25) {
              // Orange Alert
              const exists = notifications.some((n) => n.title.includes(c.title) && n.title.includes('SLA Kritik Seviye'));
              if (!exists) {
                const newAlert = {
                  title: `🚨 SLA Kritik Seviye (%75) - ${c.customer_name || 'Müşteri'}`,
                  message: `"${c.title}" başlıklı talebin kalan SLA süresi %25'in altına inmiştir! Bölüm Müdürü (Ayşe Kaya) eskalasyon zincirine dahil edildi.`,
                  severity: 'error'
                };
                actions.addNotificationInDb(newAlert);
              }
            } else if (percentage <= 50) {
              // Yellow Alert
              const exists = notifications.some((n) => n.title.includes(c.title) && n.title.includes('SLA Uyarısı'));
              if (!exists) {
                const newAlert = {
                  title: `⚠️ SLA Uyarısı (%50) - ${c.customer_name || 'Müşteri'}`,
                  message: `"${c.title}" başlıklı vakanın SLA süresi %50'nin altına indi! Sorumlu mühendis eskalasyonu tetiklendi.`,
                  severity: 'warning'
                };
                actions.addNotificationInDb(newAlert);
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
      try {
        const verifiedProfile = await actions.verifyLogin(email, password);
        if (verifiedProfile) {
          setUser(verifiedProfile as Profile);
          localStorage.setItem('psa_user', JSON.stringify(verifiedProfile));
          return true;
        }
      } catch (err) {
        console.error('Error verifying login:', err);
      }
      return false;
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

  // DB CRUD Operations synced to Database via Server Actions
  const updateProfile = async (id: string, fullName: string, role: UserRole, password?: string, hourlyCost?: number, email?: string) => {
    try {
      await actions.updateProfileInDb(id, fullName, role, password, hourlyCost, email);
      
      // Update local state if current logged user
      if (user && user.id === id) {
        const updatedUser = { ...user, full_name: fullName, role };
        if (hourlyCost !== undefined) updatedUser.hourly_cost = hourlyCost;
        if (email !== undefined) updatedUser.email = email;
        setUser(updatedUser);
        localStorage.setItem('psa_user', JSON.stringify(updatedUser));
      }
      
      await fetchInitialData();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      message.error(`Profil güncellenirken hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
    }
  };

  const addBrand = async (brand: Omit<Brand, 'id'>) => {
    await actions.addBrandInDb(brand);
    await fetchInitialData();
  };

  const updateBrand = async (id: string, brandData: Partial<Brand>) => {
    await actions.updateBrandInDb(id, brandData);
    await fetchInitialData();
  };

  const deleteBrand = async (id: string) => {
    await actions.deleteBrandInDb(id);
    await fetchInitialData();
  };

  const addService = async (service: Omit<Service, 'id'>) => {
    await actions.addServiceInDb(service);
    await fetchInitialData();
  };

  const updateService = async (id: string, serviceData: Partial<Service>) => {
    await actions.updateServiceInDb(id, serviceData);
    await fetchInitialData();
  };

  const deleteService = async (id: string) => {
    await actions.deleteServiceInDb(id);
    await fetchInitialData();
  };

  const addCertificate = async (cert: Omit<Certificate, 'id' | 'status'>) => {
    await actions.addCertificateInDb(cert);
    await fetchInitialData();
  };

  const updateCertificate = async (id: string, certData: Partial<Certificate>) => {
    await actions.updateCertificateInDb(id, certData);
    await fetchInitialData();
  };

  const deleteCertificate = async (id: string) => {
    await actions.deleteCertificateInDb(id);
    await fetchInitialData();
  };

  const addCertificateDefinition = async (certDef: Omit<CertificateDefinition, 'id'>) => {
    await actions.addCertificateDefinitionInDb(certDef);
    await fetchInitialData();
  };

  const updateCertificateDefinition = async (id: string, certDefData: Partial<CertificateDefinition>) => {
    await actions.updateCertificateDefinitionInDb(id, certDefData);
    await fetchInitialData();
  };

  const deleteCertificateDefinition = async (id: string) => {
    await actions.deleteCertificateDefinitionInDb(id);
    await fetchInitialData();
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    await actions.addCustomerInDb(customer);
    await fetchInitialData();
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    await actions.updateCustomerInDb(id, customerData);
    await fetchInitialData();
  };

  const deleteCustomer = async (id: string) => {
    await actions.deleteCustomerInDb(id);
    await fetchInitialData();
  };

  const addContract = async (contract: Omit<Contract, 'id'>) => {
    await actions.addContractInDb(contract);
    await fetchInitialData();
  };

  const updateContract = async (id: string, contractData: Partial<Contract>) => {
    await actions.updateContractInDb(id, contractData);
    await fetchInitialData();
  };

  const deleteContract = async (id: string) => {
    await actions.deleteContractInDb(id);
    await fetchInitialData();
  };

  const addOneOff = async (oneOff: Omit<OneOff, 'id'>) => {
    await actions.addOneOffInDb(oneOff);
    await fetchInitialData();
  };

  const updateOneOff = async (id: string, oneOffData: Partial<OneOff>) => {
    await actions.updateOneOffInDb(id, oneOffData);
    await fetchInitialData();
  };

  const deleteOneOff = async (id: string) => {
    await actions.deleteOneOffInDb(id);
    await fetchInitialData();
  };

  const addSparePart = async (sparePart: Omit<SparePart, 'id' | 'status'>) => {
    await actions.addSparePartInDb(sparePart);
    await fetchInitialData();
  };

  const updateSparePart = async (id: string, sparePartData: Partial<SparePart>) => {
    await actions.updateSparePartInDb(id, sparePartData);
    await fetchInitialData();
  };

  const deleteSparePart = async (id: string) => {
    await actions.deleteSparePartInDb(id);
    await fetchInitialData();
  };

  const addCase = async (caseData: Omit<Case, 'id' | 'created_at' | 'sla_countdown_hours'>) => {
    await actions.addCaseInDb(caseData as any);
    await fetchInitialData();
  };

  const updateCase = async (id: string, caseData: Partial<Case>) => {
    await actions.updateCaseInDb(id, caseData as any);
    await fetchInitialData();
  };

  const addCaseComment = async (caseId: string, commentText: string) => {
    const authorName = user?.full_name || 'Sistem';
    await actions.addCaseCommentInDb(caseId, authorName, commentText);
    await fetchInitialData();
  };

  const deleteCase = async (id: string) => {
    await actions.deleteCaseInDb(id);
    await fetchInitialData();
  };

  const addTimesheet = async (t: Omit<Timesheet, 'id' | 'status' | 'created_at'>) => {
    await actions.addTimesheetInDb(t);
    await fetchInitialData();
  };

  const updateTimesheet = async (id: string, data: Partial<Timesheet>) => {
    await actions.updateTimesheetInDb(id, data);
    await fetchInitialData();
  };

  const deleteTimesheet = async (id: string) => {
    await actions.deleteTimesheetInDb(id);
    await fetchInitialData();
  };

  const approveTimesheet = async (id: string, status: 'Approved' | 'Rejected' | 'Submitted') => {
    const original = timesheets.find((t) => t.id === id);
    if (!original) return;

    await actions.approveTimesheetInDb(id, status, status === 'Submitted' ? null : (user?.id || null));

    if (status !== 'Submitted') {
      await actions.addNotificationInDb({
        title: status === 'Approved' ? 'Efor Onaylandı' : 'Efor Reddedildi',
        message: `${user?.full_name || 'Yönetici'}, "${original.description.substring(0, 30)}..." açıklamalı efor kaydınızı ${status === 'Approved' ? 'onayladı' : 'reddetti'}.`,
        severity: status === 'Approved' ? 'info' : 'error',
      });
    } else {
      await actions.addNotificationInDb({
        title: 'Efor Kararı Geri Alındı',
        message: `${user?.full_name || 'Yönetici'}, "${original.description.substring(0, 30)}..." açıklamalı efor kaydınızın onay kararını geri aldı ve kaydı inceleme sırasına döndürdü.`,
        severity: 'warning',
      });
    }
    await fetchInitialData();
  };

  const voteHelpful = async (id: string) => {
    await actions.voteHelpfulInDb(id);
    await fetchInitialData();
  };

  const addCaseFeedback = async (feedback: Omit<CaseFeedback, 'id' | 'created_at'>) => {
    await actions.addCaseFeedbackInDb(feedback);
    
    // Create notification alert
    const targetCase = cases.find((c) => c.id === feedback.case_id);
    await actions.addNotificationInDb({
      title: `Yeni Müşteri Geri Bildirimi [⭐ ${feedback.rating}]`,
      message: `"${targetCase?.title || 'Destek Talebi'}" için müşteri oylaması yapıldı: "${feedback.comments || 'Yorumsuz'}"`,
      severity: feedback.rating >= 4 ? 'info' : 'warning',
    });
    await fetchInitialData();
  };

  const deleteCaseFeedback = async (id: string) => {
    await actions.deleteCaseFeedbackInDb(id);
    await fetchInitialData();
  };

  const markNotificationsAsRead = async () => {
    await actions.markNotificationsAsReadInDb();
    await fetchInitialData();
  };

  const markNotificationAsRead = async (id: string) => {
    await actions.markNotificationAsReadInDb(id);
    await fetchInitialData();
  };

  const addKnowledgeArticle = async (article: Omit<KnowledgeArticle, 'id' | 'views_count' | 'helpful_votes' | 'created_at' | 'updated_at'>) => {
    await actions.addKnowledgeArticleInDb(article);
    await fetchInitialData();
  };

  const updateKnowledgeArticle = async (id: string, articleData: Partial<KnowledgeArticle>) => {
    await actions.updateKnowledgeArticleInDb(id, articleData);
    await fetchInitialData();
  };

  const deleteKnowledgeArticle = async (id: string) => {
    await actions.deleteKnowledgeArticleInDb(id);
    await fetchInitialData();
  };

  const incrementViews = async (id: string) => {
    await actions.incrementViewsInDb(id);
    await fetchInitialData();
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
