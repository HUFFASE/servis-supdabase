-- 1. Create knowledge_articles table
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  views_count INT DEFAULT 0,
  helpful_votes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed mock articles
INSERT INTO knowledge_articles (id, title, content, brand_id, service_id, created_by, tags, views_count, helpful_votes) VALUES
(
  'ka1',
  'Cisco Nexus SFP+ Modül Hataları ve Rx/Tx Güç Kaybı Çözümü',
  '### Sorun Açıklaması\nCisco Nexus omurga anahtarlarında (örn: Nexus 9000 serisi) fiber bağlantılarda paket kaybı yaşanması veya portun sürekli `up/down` konumuna düşmesi.\n\n### Teşhis Adımları\n1. Anahtara SSH ile bağlanıp hata veren portu inceleyin:\n   ```bash\n   show interface ethernet 1/12 transceiver details\n   ```\n2. Optik Rx/Tx güç seviyelerini kontrol edin. Güç seviyesi `-12 dBm` seviyesinden düşükse (örn: `-15 dBm` veya `-40 dBm` Rx power) hat zayıflaması veya arızalı SFP söz konusudur.\n\n### Çözüm Adımları\n- Portu kapatıp (`shutdown`), SFP modülünü yerinden çıkarın.\n- Fiber patch kablonun uçlarını optik temizleme kalemi (One-click cleaner) ile temizleyin.\n- Sorun devam ederse, Tx/Rx değerlerini kontrol ederek SFP modülünü yedek parça ile değiştirin.\n- Portu tekrar açın (`no shutdown`). Hataların durduğunu `show interface counters errors` komutu ile doğrulayın.',
  'b1',
  's1',
  'u4',
  ARRAY['sfp', 'nexus', 'packet-loss', 'cisco', 'fiber'],
  24,
  12
),
(
  'ka2',
  'Fortigate Güvenlik Duvarı SD-WAN ve WAN SLA Kuralları Konfigürasyonu',
  '### Sorun Açıklaması\nİki adet WAN bacağının (örn: WAN1 Telekom, WAN2 Turkcell) aktif-aktif çalıştırılması ve gecikme (latency) veya paket kaybı durumunda trafiğin otomatik olarak sağlıklı WAN bacağına yönlendirilmemesi.\n\n### Çözüm ve Yapılandırma\n1. **SD-WAN Zone Oluşturma:**\n   - `Network > SD-WAN` bölümüne gidin.\n   - `SD-WAN Members` sekmesinde WAN1 ve WAN2 arayüzlerini aynı gruba ekleyin.\n2. **Performance SLA Tanımlama:**\n   - `Performance SLA` sekmesinde `Create New` tıklayın.\n   - Target IP olarak kararlı bir DNS sunucusu (örn: `8.8.8.8`) belirleyin.\n   - SLA Target parametrelerini ayarlayın: `Latency Threshold: 100ms`, `Packet Loss: 2%`.\n3. **SD-WAN Rules Oluşturma:**\n   - Trafiğin hangi kurala göre aktarılacağını seçin (örn: `Lowest Cost (SLA)` veya `Maximize Bandwidth`).\n   - `Performance SLA` olarak az önce oluşturduğunuz kuralı seçin. Bu sayede SLA değeri aşan WAN bacağı otomatik olarak devre dışı bırakılacaktır.',
  'b2',
  's2',
  'u4',
  ARRAY['fortigate', 'sd-wan', 'sla', 'failover', 'firewall'],
  42,
  18
),
(
  'ka3',
  'Azure AD (Entra ID) Kullanıcı Lisans Ataması ve Grup Bazlı Senkronizasyon Hataları',
  '### Sorun Açıklaması\nYerel Active Directory üzerinde oluşturulan kullanıcıların Azure AD (Entra ID) ortamına eşitlendikten sonra, grup tabanlı otomatik Microsoft 365 E5 lisans atama kurallarının çalışmaması.\n\n### Nedenleri ve Teşhis\n- Kullanıcının `Usage Location` (Kullanım Konumu) parametresinin tanımlanmamış olması (Microsoft, konumu olmayan kullanıcılara otomatik lisans atayamaz).\n- Azure AD Connect senkronizasyonunun takılması veya çakışan `UserPrincipalName` (UPN) hataları.\n\n### Çözüm Adımları\n1. **Kullanım Konumu Tanımlama:**\n   - Kullanıcının profilinden `Usage Location` alanını `Turkey (TR)` olarak güncelleyin veya PowerShell ile topluca tanımlayın:\n     ```powershell\n     Get-MsolUser -All | Where-Object {$_.UsageLocation -eq $null} | Set-MsolUser -UsageLocation "TR"\n     ```\n2. **Azure AD Connect Senkronizasyonunu Tetikleme:**\n   - Eşitleme sunucusunda PowerShell açıp delta eşitlemeyi tetikleyin:\n     ```powershell\n     Start-ADSyncSyncCycle -PolicyType Delta\n     ```\n3. Azure AD Portal > Groups > Lisans Atanan Grup > `Reprocess` butonuna tıklayarak lisans kurallarını yeniden uygulayın.',
  'b3',
  's3',
  'u3',
  ARRAY['azure', 'ad-connect', 'licensing', 'office365', 'powershell'],
  15,
  8
)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Realtime Replication for knowledge_articles
DO $$
BEGIN
  alter publication supabase_realtime add table knowledge_articles;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not configure realtime replication. You can enable replication manually in your Supabase dashboard.';
END $$;
