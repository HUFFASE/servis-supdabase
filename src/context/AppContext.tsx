'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assigned_to?: string; // Profile ID
  assigned_name?: string;
  created_at: string;
  sla_countdown_hours: number; // Ticks down
  comments?: Array<{ author: string; text: string; date: string }>;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface AppContextType {
  // Auth state
  user: Profile | null;
  login: (role: UserRole) => Promise<boolean>;
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

  // Database operations
  updateProfile: (id: string, fullName: string, role: UserRole, password?: string) => void;
  
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

  markNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Initial Mock Data ---

const initialProfiles: Profile[] = [
  { id: 'u1', full_name: 'Kemal Yılmaz', email: 'kemal@techservices.com', role: 'Direktör', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kemal', updated_at: new Date().toISOString(), password: '123456' },
  { id: 'u2', full_name: 'Ayşe Kaya', email: 'ayse@techservices.com', role: 'Müdür', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ayse', updated_at: new Date().toISOString(), password: '123456' },
  { id: 'u3', full_name: 'Can Demir', email: 'can@techservices.com', role: 'Presales', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Can', updated_at: new Date().toISOString(), password: '123456' },
  { id: 'u4', full_name: 'Elif Şahin', email: 'elif@techservices.com', role: 'Postsales', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Elif', updated_at: new Date().toISOString(), password: '123456' },
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
      ]);

      if (profilesData) setProfiles(profilesData as Profile[]);
      if (brandsData) setBrands(brandsData as Brand[]);
      if (servicesData) setServices(servicesData as Service[]);
      if (certDefsData) setCertificateDefinitions(certDefsData as CertificateDefinition[]);
      if (certsData) setCertificates(certsData as Certificate[]);
      if (customersData) setCustomers(customersData as Customer[]);
      if (contractsData) setContracts(contractsData as Contract[]);
      if (oneoffsData) setOneOffs(oneoffsData as OneOff[]);

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

        // Check if any critical case reached 0 SLA to create notification alert
        updated.forEach((c) => {
          if (c.sla_countdown_hours === 0 && (c.status === 'Open' || c.status === 'In Progress')) {
            const exists = notifications.some((n) => n.title.includes(c.title) && n.title.includes('SLA Aşıldı'));
            if (!exists) {
              const newAlert = {
                id: `n_${Date.now()}_sla`,
                title: `SLA Aşıldı! - ${c.customer_name || 'Müşteri'}`,
                message: `"${c.title}" başlıklı talebin SLA süresi aşılmıştır!`,
                severity: 'error',
                timestamp: new Date().toISOString(),
                read: false
              };
              supabase.from('notifications').insert(newAlert);
            }
          }
        });

        return updated;
      });
    }, 10000); // every 10s simulates SLA countdown ticks

    return () => clearInterval(interval);
  }, [notifications, customers]);

  // Auth Actions
  const login = async (role: UserRole): Promise<boolean> => {
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
  const updateProfile = async (id: string, fullName: string, role: UserRole, password?: string) => {
    await supabase
      .from('profiles')
      .update({ full_name: fullName, role, updated_at: new Date().toISOString() })
      .eq('id', id);

    // If current user, update state as well
    if (user && user.id === id) {
      const updatedUser = { ...user, full_name: fullName, role };
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
      const newNotification = {
        id: `n_${Date.now()}_cert`,
        title: status === 'Expired' ? 'Sertifika Süresi Doldu' : 'Sertifika Süresi Yaklaşıyor',
        message: `${p?.full_name || 'Personel'} adına kayıtlı "${cert.name}" sertifikası ${status === 'Expired' ? 'geçersiz durumdadır' : 'yakında süresi dolacaktır'}!`,
        severity: status === 'Expired' ? 'error' : 'warning',
        timestamp: new Date().toISOString(),
        read: false
      };
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
    const newAlert = {
      id: `n_${Date.now()}_case`,
      title: `Yeni Destek Talebi [${caseData.severity}]`,
      message: `"${cust?.name || 'Müşteri'}" için yeni bir talep açıldı: "${caseData.title}"`,
      severity: caseData.severity === 'Critical' ? 'error' : caseData.severity === 'High' ? 'warning' : 'info',
      timestamp: new Date().toISOString(),
      read: false
    };
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
      merged.sla_countdown_hours = 0;
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

  const markNotificationsAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
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

  const populatedCases = cases.map((c) => ({
    ...c,
    customer_name: customers.find((cust) => cust.id === c.customer_id)?.name || 'Bilinmeyen Müşteri',
    contract_name: contracts.find((con) => con.id === c.contract_id)?.name || 'Sözleşmesiz',
    assigned_name: profiles.find((p) => p.id === c.assigned_to)?.full_name || 'Atanmamış'
  }));

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        profiles,
        brands: populatedBrands,
        services: populatedServices,
        certificateDefinitions: populatedCertificateDefinitions,
        certificates: populatedCertificates,
        customers,
        contracts: populatedContracts,
        oneOffs: populatedOneOffs,
        cases: populatedCases,
        notifications,
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
        markNotificationsAsRead
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
