const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data in reverse order of dependencies
  await prisma.caseComment.deleteMany();
  await prisma.caseFeedback.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.sparePart.deleteMany();
  await prisma.case.deleteMany();
  await prisma.oneOff.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificateDefinition.deleteMany();
  await prisma.service.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.appNotification.deleteMany();
  await prisma.profile.deleteMany();

  // 2. Profiles
  const profiles = [
    { id: 'u1', full_name: 'Kemal Yılmaz', email: 'kemal@techservices.com', role: 'Direktor', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kemal', password: bcrypt.hashSync('123456', 10), hourly_cost: 120.00 },
    { id: 'u2', full_name: 'Ayşe Kaya', email: 'ayse@techservices.com', role: 'Mudur', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ayse', password: bcrypt.hashSync('123456', 10), hourly_cost: 90.00 },
    { id: 'u3', full_name: 'Can Demir', email: 'can@techservices.com', role: 'Presales', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Can', password: bcrypt.hashSync('123456', 10), hourly_cost: 60.00 },
    { id: 'u4', full_name: 'Elif Şahin', email: 'elif@techservices.com', role: 'Postsales', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Elif', password: bcrypt.hashSync('123456', 10), hourly_cost: 45.00 },
  ];
  for (const p of profiles) {
    await prisma.profile.create({ data: p });
  }
  console.log('Profiles seeded.');

  // 3. Brands
  const brands = [
    { id: 'b1', name: 'Cisco', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=CS', description: 'Network ve güvenlik sistemleri lideri.' },
    { id: 'b2', name: 'Fortinet', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=FT', description: 'Yeni nesil siber güvenlik ve SD-WAN çözümleri.' },
    { id: 'b3', name: 'Microsoft', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=MS', description: 'Bulut altyapı, işletim sistemleri ve kurumsal çözümler.' },
    { id: 'b4', name: 'VMware', logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=VM', description: 'Sanallaştırma ve çoklu bulut yönetimi teknolojileri.' },
  ];
  for (const b of brands) {
    await prisma.brand.create({ data: b });
  }
  console.log('Brands seeded.');

  // 4. Services
  const services = [
    { id: 's1', name: 'Kurulum ve Konfigürasyon', brand_id: 'b1', description: 'Cisco omurga ve kenar anahtarların kurulumu ve konfigürasyonu.', price_per_hour: 150.00 },
    { id: 's2', name: 'Firewall Kural Denetimi ve Güvenlik Sıkılaştırma', brand_id: 'b2', description: 'Fortigate güvenlik duvarı kurallarının optimizasyonu.', price_per_hour: 180.00 },
    { id: 's3', name: 'Azure Bulut Migrasyon Danışmanlığı', brand_id: 'b3', description: 'Yerel sunucuların Azure bulut ortamına taşınması tasarımı.', price_per_hour: 220.00 },
    { id: 's4', name: 'vSphere Küme Kurulumu ve Optimizasyonu', brand_id: 'b4', description: 'VMware sanallaştırma altyapısının yedekli kurulumu.', price_per_hour: 200.00 },
  ];
  for (const s of services) {
    await prisma.service.create({ data: s });
  }
  console.log('Services seeded.');

  // 5. Certificate Definitions
  const certDefs = [
    { id: 'cd1', name: 'CCIE Enterprise Infrastructure', brand_id: 'b1' },
    { id: 'cd2', name: 'NSE 8 Network Security Expert', brand_id: 'b2' },
    { id: 'cd3', name: 'Azure Solutions Architect Expert', brand_id: 'b3' },
  ];
  for (const cd of certDefs) {
    await prisma.certificateDefinition.create({ data: cd });
  }
  console.log('Certificate Definitions seeded.');

  // 6. Certificates
  const certificates = [
    { id: 'c1', name: 'CCIE Enterprise Infrastructure', brand_id: 'b1', profile_id: 'u4', issue_date: new Date('2024-05-15'), expiry_date: new Date('2026-05-15'), status: 'Expired' },
    { id: 'c2', name: 'NSE 8 Network Security Expert', brand_id: 'b2', profile_id: 'u4', issue_date: new Date('2023-09-10'), expiry_date: new Date('2026-06-10'), status: 'Expiring' },
    { id: 'c3', name: 'Azure Solutions Architect Expert', brand_id: 'b3', profile_id: 'u3', issue_date: new Date('2025-01-20'), expiry_date: new Date('2027-01-20'), status: 'Active' },
  ];
  for (const c of certificates) {
    await prisma.certificate.create({ data: c });
  }
  console.log('Certificates seeded.');

  // 7. Customers
  const customers = [
    { id: 'cust1', name: 'Turkcell İletişim Hizmetleri', industry: 'Telekomünikasyon', contact_person: 'Ahmet Aksoy', email: 'ahmet.aksoy@turkcell.com.tr', phone: '0532 111 2233' },
    { id: 'cust2', name: 'Garanti BBVA Teknoloji', industry: 'Finans / Bankacılık', contact_person: 'Zeynep Balcı', email: 'zeynep.balci@garantibbva.com.tr', phone: '0212 555 4433' },
    { id: 'cust3', name: 'Eczacıbaşı Holding', industry: 'Holding', contact_person: 'Murat Can', email: 'murat.can@eczacibasi.com.tr', phone: '0212 444 3322' },
  ];
  for (const cust of customers) {
    await prisma.customer.create({ data: cust });
  }
  console.log('Customers seeded.');

  // 8. Contracts
  const contracts = [
    { id: 'con1', customer_id: 'cust1', name: 'Turkcell Cisco Network Destek Sözleşmesi', start_date: new Date('2026-01-01'), end_date: new Date('2026-12-31'), value: 85000.00, sla_details: '7/24 Destek, Kritik Durumlarda 2 Saat Müdahale Süresi', status: 'Active' },
    { id: 'con2', customer_id: 'cust2', name: 'Garanti Fortinet Firewall Bakım Anlaşması', start_date: new Date('2025-07-01'), end_date: new Date('2026-07-01'), value: 64000.00, sla_details: '5/9 Destek, Kritik Durumlarda 4 Saat Müdahale Süresi', status: 'Active' },
    { id: 'con3', customer_id: 'cust3', name: 'Eczacıbaşı VMware Altyapı Desteği', start_date: new Date('2025-01-01'), end_date: new Date('2025-12-31'), value: 45000.00, sla_details: '8/5 Destek, 8 Saat Müdahale Süresi', status: 'Expired' },
  ];
  for (const con of contracts) {
    await prisma.contract.create({ data: con });
  }
  console.log('Contracts seeded.');

  // 9. OneOffs
  const oneOffs = [
    { id: 'o1', customer_id: 'cust1', name: 'Turkcell Kartal Veri Merkezi Migrasyonu', amount: 120000.00, status: 'InProgress' },
    { id: 'o2', customer_id: 'cust2', name: 'Garanti Şube SD-WAN Dönüşüm Projesi', amount: 95000.00, status: 'Draft' },
    { id: 'o3', customer_id: 'cust3', name: 'Eczacıbaşı Active Directory Yenileme Projesi', amount: 35000.00, status: 'Completed' },
  ];
  for (const o of oneOffs) {
    await prisma.oneOff.create({ data: o });
  }
  console.log('OneOffs seeded.');

  // 10. Cases
  const cases = [
    {
      id: 't1',
      customer_id: 'cust1',
      contract_id: 'con1',
      title: 'Kartal Omurga Anahtarında Paket Kaybı',
      description: 'Veri merkezindeki Cisco Nexus anahtarda arayüz hataları gözlenmekte ve paket kaybı yaşanmaktadır. Trafik olumsuz etkilenmektedir.',
      severity: 'Critical',
      status: 'InProgress',
      assigned_to: 'u4',
      created_at: new Date(Date.now() - 3600000 * 3),
      sla_countdown_hours: 1.80,
    },
    {
      id: 't2',
      customer_id: 'cust2',
      contract_id: 'con2',
      title: 'Fortigate Firewall Kural Değişikliği Talebi',
      description: 'Yeni açılacak test sunucusu için DMZ bölgesinden dış dünyaya yönelik belirli portların (80, 443) erişime açılması talep edilmektedir.',
      severity: 'Medium',
      status: 'Open',
      created_at: new Date(Date.now() - 3600000 * 1),
      sla_countdown_hours: 24.00,
    },
    {
      id: 't3',
      customer_id: 'cust3',
      contract_id: null,
      title: 'Azure AD Lisans Aktivasyon Sorunu',
      description: 'Active Directory yenileme projesinin ardından bazı kullanıcıların E5 lisansları aktifleşmemektedir.',
      severity: 'High',
      status: 'Resolved',
      assigned_to: 'u3',
      created_at: new Date(Date.now() - 3600000 * 24),
      sla_countdown_hours: 0.00,
    }
  ];
  for (const c of cases) {
    await prisma.case.create({ data: c });
  }
  console.log('Cases seeded.');

  // 11. Case Comments
  const comments = [
    { id: 'cc1', case_id: 't1', author: 'Can Demir', text: 'İlk incelemede fiber kablo hatası veya SFP modül arızası olabileceği tespit edildi. Fiziksel kontrol talep edildi.', date: new Date(Date.now() - 3600000 * 2.5) },
    { id: 'cc2', case_id: 't1', author: 'Elif Şahin', text: 'SFP modülü yedek parça ile değiştirildi, arayüz hataları durdu. Paket kaybı gözlenmiyor, izlemeye alındı.', date: new Date(Date.now() - 3600000 * 1) },
    { id: 'cc3', case_id: 't3', author: 'Can Demir', text: 'Microsoft portalındaki lisans atama kuralları güncellendi. Senkronizasyon tetiklendi ve sorun çözüldü.', date: new Date(Date.now() - 3600000 * 20) },
  ];
  for (const comment of comments) {
    await prisma.caseComment.create({ data: comment });
  }
  console.log('Comments seeded.');

  // 12. App Notifications
  const notifications = [
    { id: 'n1', title: 'Kritik Sertifika Süresi Doldu', message: 'Elif Şahin\'e ait "CCIE Enterprise" sertifikasının süresi dolmuştur!', severity: 'error', timestamp: new Date(Date.now() - 3600000 * 2), read: false },
    { id: 'n2', title: 'Yeni Kritik Destek Talebi', message: 'Turkcell için "Kartal Omurga Anahtarında Paket Kaybı" başlıklı CRITICAL talep açılmıştır.', severity: 'warning', timestamp: new Date(Date.now() - 3600000 * 3), read: false },
  ];
  for (const n of notifications) {
    await prisma.appNotification.create({ data: n });
  }
  console.log('Notifications seeded.');

  // 13. Spare Parts
  const spareParts = [
    { id: 'sp1', name: 'Cisco Nexus SFP-10G-SR Modülü', part_code: 'SFP-10G-SR', serial_number: 'FDO24120ABC', brand_id: 'b1', project_id: 'o1', is_pool: false, stock_in_date: new Date('2026-01-15'), stock_out_date: null, status: 'InStock', notes: 'Turkcell Kartal migrasyonu için yedek optik modül.' },
    { id: 'sp2', name: 'Fortinet FortiGate Güç Kaynağı Ünitesi', part_code: 'FG-PSU-460', serial_number: 'SN-PSU-7781', brand_id: 'b2', project_id: null, is_pool: true, stock_in_date: new Date('2025-08-10'), stock_out_date: null, status: 'InStock', notes: 'Havuz yedeği - acil arıza durumları için.' },
    { id: 'sp3', name: 'VMware Sunucu RAID Denetleyici Kartı', part_code: 'RAID-9460-16i', serial_number: 'SV-RC-55012', brand_id: 'b4', project_id: null, is_pool: true, stock_in_date: new Date('2025-03-01'), stock_out_date: new Date('2026-04-20'), status: 'Out', notes: 'Eczacıbaşı sahasında arızalı kart yerine kullanıldı.' },
    { id: 'sp4', name: 'Microsoft Surface Yedek Batarya', part_code: 'SRF-BAT-65W', serial_number: 'MS-BAT-90233', brand_id: 'b3', project_id: 'o2', is_pool: false, stock_in_date: new Date('2026-05-05'), stock_out_date: null, status: 'InStock', notes: 'Garanti SD-WAN projesi saha ekibi için.' },
  ];
  for (const sp of spareParts) {
    await prisma.sparePart.create({ data: sp });
  }
  console.log('Spare Parts seeded.');

  // 14. Timesheets
  const timesheets = [
    {
      id: 'tms1',
      profile_id: 'u4',
      case_id: 't1',
      activity_date: new Date('2026-05-26'),
      hours_spent: 2.50,
      description: 'Cisco Nexus omurga anahtarında fiber kablo ve SFP modülü değişimi yapıldı. Paket kaybı gözlenmiyor.',
      is_billable: true,
      status: 'Approved',
      approved_by: 'u2',
      created_at: new Date(Date.now() - 86400000)
    },
    {
      id: 'tms2',
      profile_id: 'u4',
      case_id: 't2',
      activity_date: new Date('2026-05-27'),
      hours_spent: 1.00,
      description: 'Fortigate firewall kurallarının optimizasyonu ve DMZ-WAN izinlerinin yazılması.',
      is_billable: true,
      status: 'Submitted',
      created_at: new Date(Date.now() - 3600000 * 2)
    },
    {
      id: 'tms3',
      profile_id: 'u3',
      oneoff_id: 'o1',
      activity_date: new Date('2026-05-27'),
      hours_spent: 4.50,
      description: 'Turkcell Kartal veri merkezi migrasyonu kapsamında sunucu taşıma planı hazırlandı.',
      is_billable: false,
      status: 'Draft',
      created_at: new Date()
    }
  ];
  for (const tms of timesheets) {
    await prisma.timesheet.create({ data: tms });
  }
  console.log('Timesheets seeded.');

  // 15. Case Feedbacks
  await prisma.caseFeedback.create({
    data: {
      id: 'cf1',
      case_id: 't3',
      rating: 5,
      comments: 'Can Demir yerel Active Directory ve portal eşitleme problemlerimizi çok hızlı ve profesyonelce çözdü. Çok teşekkürler!',
      created_at: new Date(Date.now() - 3600000 * 20)
    }
  });
  console.log('Case Feedbacks seeded.');

  // 16. Knowledge Articles
  const articles = [
    {
      id: 'ka1',
      title: 'Cisco Nexus SFP+ Modül Hataları ve Rx/Tx Güç Kaybı Çözümü',
      content: '### Sorun Açıklaması\nCisco Nexus omurga anahtarlarında (örn: Nexus 9000 serisi) fiber bağlantılarda paket kaybı yaşanması veya portun sürekli `up/down` konumuna düşmesi.\n\n### Teşhis Adımları\n1. Anahtara SSH ile bağlanıp hata veren portu inceleyin:\n   ```bash\n   show interface ethernet 1/12 transceiver details\n   ```\n2. Optik Rx/Tx güç seviyelerini kontrol edin. Güç seviyesi `-12 dBm` seviyesinden düşükse (örn: `-15 dBm` veya `-40 dBm` Rx power) hat zayıflaması veya arızalı SFP söz konusudur.\n\n### Çözüm Adımları\n- Portu kapatıp (`shutdown`), SFP modülünü yerinden çıkarın.\n- Fiber patch kablonun uçlarını optik temizleme kalemi (One-click cleaner) ile temizleyin.\n- Sorun devam ederse, Tx/Rx değerlerini kontrol ederek SFP modülünü yedek parça ile değiştirin.\n- Portu tekrar açın (`no shutdown`). Hataların durduğunu `show interface counters errors` komutu ile doğrulayın.',
      brand_id: 'b1',
      service_id: 's1',
      created_by: 'u4',
      tags: JSON.stringify(['sfp', 'nexus', 'packet-loss', 'cisco', 'fiber']),
      views_count: 24,
      helpful_votes: 12,
      created_at: new Date(Date.now() - 86400000 * 5),
      updated_at: new Date(Date.now() - 86400000 * 5)
    },
    {
      id: 'ka2',
      title: 'Fortigate Güvenlik Duvarı SD-WAN ve WAN SLA Kuralları Konfigürasyonu',
      content: '### Sorun Açıklaması\nİki adet WAN bacağının (örn: WAN1 Telekom, WAN2 Turkcell) aktif-aktif çalıştırılması ve gecikme (latency) veya paket kaybı durumunda trafiğin otomatik olarak sağlıklı WAN bacağına yönlendirilmemesi.\n\n### Çözüm ve Yapılandırma\n1. **SD-WAN Zone Oluşturma:**\n   - `Network > SD-WAN` bölümüne gidin.\n   - `SD-WAN Members` sekmesinde WAN1 ve WAN2 arayüzlerini aynı gruba ekleyin.\n2. **Performance SLA Tanımlama:**\n   - `Performance SLA` sekmesinde `Create New` tıklayın.\n   - Target IP olarak kararlı bir DNS sunucusu (örn: `8.8.8.8`) belirleyin.\n   - SLA Target parametrelerini ayarlayın: `Latency Threshold: 100ms`, `Packet Loss: 2%`.\n3. **SD-WAN Rules Oluşturma:**\n   - Trafiğin hangi kurala göre aktarılacağını seçin (örn: `Lowest Cost (SLA)` veya `Maximize Bandwidth`).\n   - `Performance SLA` olarak az önce oluşturduğunuz kuralı seçin. Bu sayede SLA değeri aşan WAN bacağı otomatik olarak devre dışı bırakılacaktır.',
      brand_id: 'b2',
      service_id: 's2',
      created_by: 'u4',
      tags: JSON.stringify(['fortigate', 'sd-wan', 'sla', 'failover', 'firewall']),
      views_count: 42,
      helpful_votes: 18,
      created_at: new Date(Date.now() - 86400000 * 3),
      updated_at: new Date(Date.now() - 86400000 * 3)
    },
    {
      id: 'ka3',
      title: 'Azure AD (Entra ID) Kullanıcı Lisans Ataması ve Grup Bazlı Senkronizasyon Hataları',
      content: '### Sorun Açıklaması\nYerel Active Directory üzerinde oluşturulan kullanıcıların Azure AD (Entra ID) ortamına eşitlendikten sonra, grup tabanlı otomatik Microsoft 365 E5 lisans atama kurallarının çalışmaması.\n\n### Nedenleri ve Teşhis\n- Kullanıcının `Usage Location` (Kullanım Konumu) parametresinin tanımlanmamış olması (Microsoft, konumu olmayan kullanıcılara otomatik lisans atayamaz).\n- Azure AD Connect senkronizasyonunun takılması veya çakışan `UserPrincipalName` (UPN) hataları.\n\n### Çözüm Adımları\n1. **Kullanım Konumu Tanımlama:**\n   - Kullanıcının profilinden `Usage Location` alanını `Turkey (TR)` olarak güncelleyin veya PowerShell ile topluca tanımlayın:\n     ```powershell\n     Get-MsolUser -All | Where-Object {$_.UsageLocation -eq $null} | Set-MsolUser -UsageLocation "TR"\n     ```\n2. **Azure AD Connect Senkronizasyonunu Tetikleme:**\n   - Eşitleme sunucusunda PowerShell açıp delta eşitlemeyi tetikleyin:\n     ```powershell\n     Start-ADSyncSyncCycle -PolicyType Delta\n     ```\n3. Azure AD Portal > Groups > Lisans Atanan Grup > `Reprocess` butonuna tıklayarak lisans kurallarını yeniden uygulayın.',
      brand_id: 'b3',
      service_id: 's3',
      created_by: 'u3',
      tags: JSON.stringify(['azure', 'ad-connect', 'licensing', 'office365', 'powershell']),
      views_count: 15,
      helpful_votes: 8,
      created_at: new Date(Date.now() - 86400000 * 1),
      updated_at: new Date(Date.now() - 86400000 * 1)
    }
  ];
  for (const art of articles) {
    await prisma.knowledgeArticle.create({ data: art });
  }
  console.log('Knowledge Articles seeded.');

  console.log('All mock data seeded successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
