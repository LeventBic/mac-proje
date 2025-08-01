-- inFlow ERP - PostgreSQL Örnek Veriler
-- Bu dosya PostgreSQL veritabanına örnek verileri yükler
-- MySQL'den PostgreSQL'e geçiş sırasında mevcut veriler korunmuştur

-- =======================
-- ÖRNEK VERİLER
-- =======================

-- Kullanıcılar (varsayılan kullanıcılar)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES 
('admin', 'admin@inflow.com', '$2a$10$cuQ6pIW7CQDt5D0XnG7RjOqmv9VnlHjzQDBzxSqT0AJWGnqtaZzte', 'Admin', 'User', 'admin', TRUE),
('manager', 'manager@inflow.com', '$2a$10$new/vP827QD1NA4MMHH6p.snazQ3dVvSPMILDZnxMcBbmLdCjLFje', 'Manager', 'User', 'manager', TRUE),
('operator', 'operator@inflow.com', '$2a$10$/2rBJfa1HwymhNgXf2xbNeC3G1q0NGvtwkDAORsxEFR4HWb1eMpH6', 'Operator', 'User', 'operator', TRUE),
('viewer', 'viewer@inflow.com', '$2a$10$mNzoqNKZy8J5ZGfs48QpG.7LVkx7xIFcYLwGvW.WALabd3Hpm2gU2', 'Viewer', 'User', 'viewer', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Lokasyonlar (temel lokasyon verileri)
INSERT INTO locations (code, name, type, company_id, address, is_active) VALUES 
('LOC001', 'Ana Depo', 'warehouse', 1, 'Merkez Depo - İstanbul', TRUE),
('LOC002', 'Üretim Sahası', 'production', 1, 'Üretim Alanı - İstanbul', TRUE),
('LOC003', 'Kalite Kontrol', 'quality', 1, 'Kalite Kontrol Laboratuvarı', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Tedarikçiler (MySQL'den taşınan veriler)
INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, tax_number, payment_terms, is_active) VALUES 
('SUP001', 'ABC Çelik San. Tic. Ltd. Şti.', 'Ahmet Yılmaz', 'ahmet@abccelik.com', '+90 212 555 0101', 'Organize Sanayi Bölgesi, İstanbul', '1234567890', 30, TRUE),
('SUP002', 'XYZ Alüminyum A.Ş.', 'Mehmet Demir', 'mehmet@xyzaluminyum.com', '+90 232 555 0202', 'İzmir Serbest Bölge, İzmir', '2345678901', 45, TRUE),
('SUP003', 'Plastik Dünyası Ltd.', 'Ayşe Kaya', 'ayse@plastikdunyasi.com', '+90 312 555 0303', 'Ostim Sanayi Sitesi, Ankara', '3456789012', 30, TRUE),
('SUP004', 'Vida ve Bağlantı Elemanları', 'Fatma Özkan', 'fatma@vidabaglantielemanları.com', '+90 216 555 0404', 'Dudullu OSB, İstanbul', '4567890123', 15, TRUE),
('SUP005', 'Endüstriyel Kimya A.Ş.', 'Ali Şen', 'ali@endustriyelkimya.com', '+90 262 555 0505', 'Gebze Organize Sanayi, Kocaeli', '5678901234', 60, TRUE) 
ON CONFLICT (supplier_code) DO NOTHING;

-- Müşteriler (yeni ERP yapısı için)
INSERT INTO customers (customer_code, name, contact_person, email, phone, address, tax_number, credit_limit, payment_terms, type, is_active) VALUES 
('CUS001', 'Makine Sanayi A.Ş.', 'Hasan Çelik', 'hasan@makinesanayi.com', '+90 212 444 0101', 'Beylikdüzü OSB, İstanbul', '1111222233', 50000.00, 30, 'corporate', TRUE),
('CUS002', 'Hidrolik Sistemler Ltd.', 'Zeynep Aydın', 'zeynep@hidroliksistemler.com', '+90 232 444 0202', 'Atatürk OSB, İzmir', '2222333344', 75000.00, 45, 'corporate', TRUE),
('CUS003', 'Otomasyon Teknolojileri', 'Murat Kılıç', 'murat@otomasyontek.com', '+90 312 444 0303', 'Teknokent, Ankara', '3333444455', 30000.00, 30, 'corporate', TRUE),
('CUS004', 'Endüstriyel Çözümler', 'Elif Yıldız', 'elif@endustriyelcozumler.com', '+90 216 444 0404', 'Tuzla OSB, İstanbul', '4444555566', 25000.00, 15, 'corporate', TRUE),
('CUS005', 'Küçük İşletme Tic.', 'Osman Ak', 'osman@kucukisletme.com', '+90 262 444 0505', 'Merkez, Kocaeli', '5555666677', 10000.00, 30, 'individual', TRUE)
ON CONFLICT (customer_code) DO NOTHING;

-- Ürünler (MySQL'den taşınan ve geliştirilmiş)
INSERT INTO products (sku, name, description, barcode, category_id, product_type_id, supplier_id, unit_price, cost_price, unit, min_stock_level, max_stock_level, reorder_point, reorder_quantity, is_raw_material, is_finished_product, is_active) VALUES 
-- Hammaddeler
('HM001', 'Çelik Levha 2mm', '2mm kalınlığında çelik levha - DIN EN 10025 standardında', '1234567890001', 1, 1, 1, 15.50, 12.00, 'kg', 100, 500, 150, 200, TRUE, FALSE, TRUE),
('HM002', 'Alüminyum Profil 20x20', '20x20mm alüminyum profil - 6063 alaşımı', '1234567890002', 1, 1, 2, 8.75, 6.50, 'm', 50, 300, 75, 100, TRUE, FALSE, TRUE),
('HM003', 'Plastik Granül ABS', 'ABS plastik granül - yüksek darbe dayanımı', '1234567890003', 1, 1, 3, 25.00, 20.00, 'kg', 200, 1000, 300, 400, TRUE, FALSE, TRUE),
('HM004', 'Vida M6x20', 'M6x20 paslanmaz çelik vida - A2 kalite', '1234567890004', 1, 1, 4, 0.15, 0.10, 'adet', 1000, 5000, 1500, 2000, TRUE, FALSE, TRUE),
('HM005', 'Conta NBR 40x50x5', 'NBR kauçuk conta - 70 Shore A sertlik', '1234567890005', 1, 1, 4, 2.50, 1.80, 'adet', 200, 1000, 300, 400, TRUE, FALSE, TRUE),

-- Yarı mamuller
('YM001', 'Çelik Parça A', 'İşlenmiş çelik parça A - CNC torna ile işlenmiş', '1234567890011', 2, 1, NULL, 45.00, 35.00, 'adet', 20, 100, 30, 50, FALSE, FALSE, TRUE),
('YM002', 'Alüminyum Gövde', 'İşlenmiş alüminyum gövde - freze ile işlenmiş', '1234567890012', 2, 1, NULL, 65.00, 50.00, 'adet', 15, 80, 25, 40, FALSE, FALSE, TRUE),
('YM003', 'Plastik Kapak', 'Enjeksiyonla üretilmiş plastik kapak', '1234567890013', 2, 1, NULL, 12.00, 8.50, 'adet', 50, 200, 75, 100, FALSE, FALSE, TRUE),

-- Mamul ürünler
('MM001', 'Hidrolik Silindir HS-100', '100mm çapında hidrolik silindir - 210 bar basınç', '1234567890021', 3, 1, NULL, 450.00, 320.00, 'adet', 5, 25, 8, 15, FALSE, TRUE, TRUE),
('MM002', 'Pnömatik Valf PV-25', '25mm pnömatik valf - 3/2 yollu', '1234567890022', 3, 1, NULL, 180.00, 125.00, 'adet', 10, 50, 15, 25, FALSE, TRUE, TRUE),
('MM003', 'Kompresör Tankı KT-50', '50 litre kompresör tankı - 8 bar çalışma basıncı', '1234567890023', 3, 1, NULL, 850.00, 650.00, 'adet', 3, 15, 5, 10, FALSE, TRUE, TRUE),

-- Ambalaj malzemeleri
('AM001', 'Karton Kutu 30x20x15', 'Karton ambalaj kutusu - 3 mm oluklu karton', '1234567890031', 4, 1, NULL, 2.50, 1.80, 'adet', 100, 500, 150, 200, FALSE, FALSE, TRUE),
('AM002', 'Köpük Koruma', 'Koruyucu köpük malzeme - PE köpük', '1234567890032', 4, 1, NULL, 1.25, 0.90, 'adet', 200, 800, 300, 400, FALSE, FALSE, TRUE),
('AM003', 'Plastik Torba', 'Şeffaf plastik torba - LDPE malzeme', '1234567890033', 4, 1, NULL, 0.35, 0.25, 'adet', 500, 2000, 750, 1000, FALSE, FALSE, TRUE),

-- Yardımcı malzemeler
('YD001', 'Kesme Yağı', 'Metal işleme kesme yağı - sentetik', '1234567890041', 5, 1, 5, 45.00, 35.00, 'lt', 20, 100, 30, 50, FALSE, FALSE, TRUE),
('YD002', 'Temizlik Solüsyonu', 'Endüstriyel temizlik solüsyonu - alkalin bazlı', '1234567890042', 5, 1, 5, 25.00, 18.00, 'lt', 30, 150, 45, 75, FALSE, FALSE, TRUE)
ON CONFLICT (sku) DO NOTHING;

-- Envanter başlangıç stokları (Ana Depo - MAIN)
INSERT INTO inventory (product_id, location_id, available_quantity, reserved_quantity, average_cost, last_cost, last_movement_date) VALUES 
-- Hammaddeler
(1, 1, 250.5, 0, 12.00, 11.50, CURRENT_DATE - INTERVAL '5 days'),  -- Çelik Levha
(2, 1, 150.0, 0, 6.50, 6.00, CURRENT_DATE - INTERVAL '3 days'),   -- Alüminyum Profil
(3, 1, 500.0, 0, 20.00, 19.50, CURRENT_DATE - INTERVAL '7 days'),  -- Plastik Granül
(4, 1, 2500, 0, 0.10, 0.10, CURRENT_DATE - INTERVAL '2 days'),     -- Vida
(5, 1, 450, 0, 1.80, 1.80, CURRENT_DATE - INTERVAL '10 days'),     -- Conta

-- Yarı mamuller
(6, 1, 35, 0, 35.00, 35.00, CURRENT_DATE - INTERVAL '1 day'),      -- Çelik Parça A
(7, 1, 28, 0, 50.00, 50.00, CURRENT_DATE - INTERVAL '2 days'),     -- Alüminyum Gövde
(8, 1, 85, 0, 8.50, 8.50, CURRENT_DATE - INTERVAL '4 days'),       -- Plastik Kapak

-- Mamul ürünler
(9, 1, 12, 0, 320.00, 320.00, CURRENT_DATE - INTERVAL '1 day'),    -- Hidrolik Silindir
(10, 1, 25, 0, 125.00, 125.00, CURRENT_DATE - INTERVAL '1 day'),   -- Pnömatik Valf
(11, 1, 8, 0, 650.00, 650.00, CURRENT_DATE - INTERVAL '6 days'),   -- Kompresör Tankı

-- Ambalaj malzemeleri
(12, 1, 250, 0, 1.80, 1.80, CURRENT_DATE - INTERVAL '8 days'),     -- Karton Kutu
(13, 1, 400, 0, 0.90, 0.90, CURRENT_DATE - INTERVAL '5 days'),     -- Köpük Koruma
(14, 1, 1200, 0, 0.25, 0.25, CURRENT_DATE - INTERVAL '12 days'),   -- Plastik Torba

-- Yardımcı malzemeler
(15, 1, 45.5, 0, 35.00, 35.00, CURRENT_DATE - INTERVAL '15 days'),  -- Kesme Yağı
(16, 1, 62.0, 0, 18.00, 18.00, CURRENT_DATE - INTERVAL '9 days')    -- Temizlik Solüsyonu
ON CONFLICT (product_id, location_id) DO NOTHING;

-- BOM (Bill of Materials) - Malzeme Listeleri
INSERT INTO bom (bom_number, finished_product_id, version, is_active, notes, created_by) VALUES
('BOM-HS100-V1.0', 9, '1.0', TRUE, 'Hidrolik Silindir HS-100 standart üretim reçetesi', 1),  -- Hidrolik Silindir
('BOM-PV25-V1.0', 10, '1.0', TRUE, 'Pnömatik Valf PV-25 standart üretim reçetesi', 1),       -- Pnömatik Valf
('BOM-KT50-V1.0', 11, '1.0', TRUE, 'Kompresör Tankı KT-50 standart üretim reçetesi', 1)      -- Kompresör Tankı
ON CONFLICT (bom_number) DO NOTHING;

-- BOM Kalemleri
INSERT INTO bom_items (bom_id, raw_material_id, quantity, unit, waste_percentage, unit_cost, item_type, notes) VALUES
-- Hidrolik Silindir HS-100 (BOM ID: 1)
(1, 1, 2.5, 'kg', 5.0, 12.00, 'material', 'Silindir gövdesi için çelik levha'),
        (1, 2, 0.8, 'm', 2.0, 6.50, 'material', 'Montaj için alüminyum profil'),
        (1, 4, 8, 'adet', 0, 0.10, 'material', 'Montaj vidaları'),
        (1, 5, 2, 'adet', 0, 1.80, 'material', 'Sızdırmazlık contaları'),
        (1, 15, 0.1, 'lt', 0, 35.00, 'material', 'Montaj için kesme yağı'),

        (2, 1, 1.2, 'kg', 3.0, 12.00, 'material', 'Valf gövdesi için çelik levha'),
        (2, 3, 0.5, 'kg', 8.0, 20.00, 'material', 'Valf kapakları için plastik'),
        (2, 4, 6, 'adet', 0, 0.10, 'material', 'Montaj vidaları'),
        (2, 5, 1, 'adet', 0, 1.80, 'material', 'Ana conta'),

        (3, 1, 8.5, 'kg', 4.0, 12.00, 'material', 'Tank gövdesi için çelik levha'),
        (3, 2, 1.5, 'm', 2.0, 6.50, 'material', 'Destek çerçevesi için alüminyum'),
        (3, 4, 12, 'adet', 0, 0.10, 'material', 'Montaj vidaları'),
        (3, 5, 3, 'adet', 0, 1.80, 'material', 'Çeşitli contalar'),
        (3, 15, 0.2, 'lt', 0, 35.00, 'material', 'İşleme yağı');

-- Örnek üretim emirleri
INSERT INTO production_orders (order_number, bom_id, planned_quantity, produced_quantity, good_quantity, scrap_quantity, status, priority, planned_start_date, planned_end_date, actual_start_date, estimated_cost, actual_cost, production_location_id, assigned_to, notes, created_by) VALUES
('MO-2024-001', 1, 10, 8, 8, 0, 'in_progress', 'high', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE - INTERVAL '2 days', 4500.00, 3600.00, 2, 3, 'Acil sipariş - müşteri bekleniyor', 1),
('MO-2024-002', 2, 25, 25, 25, 0, 'completed', 'medium', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '5 days', 4500.00, 4500.00, 2, 3, 'Stok tamamlama üretimi', 1),
('MO-2024-003', 3, 5, 0, 0, 0, 'planned', 'low', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '7 days', NULL, 4250.00, 0, 2, 3, 'Planlı üretim', 2),
('MO-2024-004', 1, 15, 0, 0, 0, 'planned', 'medium', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '8 days', NULL, 6750.00, 0, 2, 3, 'Büyük sipariş için ön üretim', 1),
('MO-2024-005', 2, 20, 5, 5, 0, 'in_progress', 'high', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 day', 3600.00, 900.00, 2, 3, 'Stok seviyesi düşük - acil üretim', 2);

-- Üretim hareketleri (örnek)
INSERT INTO production_movements (production_order_id, product_id, movement_type, quantity, unit_cost, location_id, notes, created_by) VALUES
-- MO-2024-001 için malzeme tüketimi
(1, 1, 'production_out', 20.0, 12.00, 1, 'Çelik levha tüketimi', 1),
(1, 2, 'production_out', 6.4, 6.50, 1, 'Alüminyum profil tüketimi', 1),
(1, 4, 'production_out', 64, 0.10, 1, 'Vida tüketimi', 1),
-- Üretilen ürün
(1, 9, 'production_in', 8, 320.00, 1, 'Hidrolik silindir üretimi', 1),

-- MO-2024-002 için hareketler (tamamlanmış)
(2, 1, 'production_out', 30.0, 12.00, 1, 'Çelik levha tüketimi', 1),
(2, 3, 'production_out', 12.5, 20.00, 1, 'Plastik granül tüketimi', 1),
(2, 4, 'production_out', 150, 0.10, 1, 'Vida tüketimi', 1),
-- Üretilen ürün
(2, 10, 'production_in', 25, 125.00, 1, 'Pnömatik valf üretimi', 1);

-- Örnek stok hareketleri
INSERT INTO stock_movements (product_id, location_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by) VALUES
-- Hammadde girişleri
(1, 1, 'in', 500.0, 11.50, 'purchase', NULL, 'Tedarikçi ABC''den çelik levha alımı', 1),
(2, 1, 'in', 200.0, 6.00, 'purchase', NULL, 'Tedarikçi XYZ''den alüminyum profil alımı', 1),
(3, 1, 'in', 1000.0, 19.50, 'purchase', NULL, 'Plastik granül toplu alımı', 1),

-- Üretim çıkışları
(9, 1, 'production_in', 25, 320.00, 'production', 2, 'Üretim emri MO-2024-002 tamamlandı', 1),
(10, 1, 'production_in', 8, 125.00, 'production', 1, 'Üretim emri MO-2024-001 kısmi üretim', 1),

-- Satış çıkışları
(9, 1, 'out', 5, 320.00, 'sale', NULL, 'Müşteri siparişi SO-001', 1),
(10, 1, 'out', 8, 125.00, 'sale', NULL, 'Müşteri siparişi SO-002', 1),

-- Stok düzeltmeleri
(4, 1, 'adjustment', -50, 0.10, 'adjustment', NULL, 'Sayım sonucu eksik tespit edildi', 1),
(13, 1, 'adjustment', 100, 0.90, 'adjustment', NULL, 'Sayım sonucu fazla tespit edildi', 1);

-- Örnek satış siparişleri
INSERT INTO sales_orders (order_number, customer_id, order_date, requested_delivery_date, status, priority, subtotal, tax_rate, tax_amount, total_amount, currency, payment_terms, sales_rep_id, notes, created_by) VALUES
('SO-2024-001', 1, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '7 days', 'confirmed', 'high', 2250.00, 18.00, 405.00, 2655.00, 'TRY', 30, 1, 'Acil sipariş - hızlı teslimat gerekli', 1),
('SO-2024-002', 2, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'in_production', 'medium', 1440.00, 18.00, 259.20, 1699.20, 'TRY', 45, 2, 'Standart sipariş', 1),
('SO-2024-003', 3, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '14 days', 'draft', 'low', 850.00, 18.00, 153.00, 1003.00, 'TRY', 30, 1, 'Fiyat teklifi aşamasında', 1);

-- Satış sipariş kalemleri
INSERT INTO sales_order_items (sales_order_id, product_id, description, quantity, unit_price, discount_percentage, requested_delivery_date, notes) VALUES
-- SO-2024-001
(1, 9, 'Hidrolik Silindir HS-100', 5, 450.00, 0, CURRENT_DATE + INTERVAL '7 days', 'Acil teslimat'),

-- SO-2024-002
(2, 10, 'Pnömatik Valf PV-25', 8, 180.00, 0, CURRENT_DATE + INTERVAL '10 days', 'Standart teslimat'),

-- SO-2024-003
(3, 11, 'Kompresör Tankı KT-50', 1, 850.00, 0, CURRENT_DATE + INTERVAL '14 days', 'Özel sipariş');

-- Örnek satın alma siparişleri
INSERT INTO purchase_orders (order_number, supplier_id, order_date, expected_delivery_date, status, priority, subtotal, tax_rate, tax_amount, total_amount, currency, payment_terms, notes, created_by) VALUES
('PO-2024-001', 1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '3 days', 'confirmed', 'high', 6000.00, 18.00, 1080.00, 7080.00, 'TRY', 30, 'Çelik levha acil tedarik', 1),
('PO-2024-002', 2, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 'pending', 'medium', 1300.00, 18.00, 234.00, 1534.00, 'TRY', 45, 'Alüminyum profil rutin tedarik', 1),
('PO-2024-003', 4, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '7 days', 'draft', 'low', 500.00, 18.00, 90.00, 590.00, 'TRY', 15, 'Vida ve bağlantı elemanları', 1);

-- Satın alma sipariş kalemleri
INSERT INTO purchase_order_items (purchase_order_id, product_id, description, quantity, unit_price, expected_delivery_date, notes) VALUES
-- PO-2024-001
(1, 1, 'Çelik Levha 2mm', 500, 12.00, CURRENT_DATE + INTERVAL '3 days', 'Kalite sertifikası ile birlikte'),

-- PO-2024-002
(2, 2, 'Alüminyum Profil 20x20', 200, 6.50, CURRENT_DATE + INTERVAL '5 days', '6 metre boylarında'),

-- PO-2024-003
(3, 4, 'Vida M6x20', 5000, 0.10, CURRENT_DATE + INTERVAL '7 days', 'Paslanmaz çelik A2 kalite');

-- Örnek uyarılar
INSERT INTO alerts (type, title, message, severity, related_entity_type, related_entity_id, assigned_to, created_at) VALUES
('low_stock', 'Düşük Stok Uyarısı', 'Vida M6x20 stok seviyesi minimum seviyenin altına düştü. Mevcut: 950, Minimum: 1000', 'warning', 'product', 4, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('production_delay', 'Üretim Gecikmesi', 'MO-2024-001 numaralı üretim emri planlanandan geç tamamlanıyor.', 'error', 'production_order', 1, 2, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('low_stock', 'Kritik Stok Seviyesi', 'Kompresör Tankı KT-50 stok seviyesi kritik seviyede. Mevcut: 3, Minimum: 3', 'critical', 'product', 11, 1, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('system', 'Sistem Bakımı', 'Haftalık sistem bakımı 15.12.2024 tarihinde yapılacaktır.', 'info', 'system', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
('quality_issue', 'Kalite Kontrolü', 'MO-2024-001 üretim emrinde kalite kontrol anomalisi tespit edildi.', 'warning', 'production_order', 1, 2, CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- Örnek faturalar
INSERT INTO invoices (invoice_number, invoice_type, customer_id, supplier_id, sales_order_id, purchase_order_id, invoice_date, due_date, subtotal, tax_rate, tax_amount, total_amount, currency, status, payment_status, notes, created_by) VALUES
('INV-S-2024-001', 'sales', 1, NULL, 1, NULL, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '28 days', 2250.00, 18.00, 405.00, 2655.00, 'TRY', 'confirmed', 'pending', 'Satış faturası - SO-2024-001', 1),
('INV-P-2024-001', 'purchase', NULL, 1, NULL, 1, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 6000.00, 18.00, 1080.00, 7080.00, 'TRY', 'confirmed', 'pending', 'Satın alma faturası - PO-2024-001', 1);

-- Fatura kalemleri
INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount_percentage) VALUES
-- Satış faturası
(1, 9, 'Hidrolik Silindir HS-100', 5, 450.00, 0),

-- Satın alma faturası
(2, 1, 'Çelik Levha 2mm', 500, 12.00, 0);

-- Örnek ödemeler
INSERT INTO payments (payment_number, payment_type, invoice_id, customer_id, supplier_id, amount, currency, payment_method, payment_date, bank_name, transaction_reference, notes, created_by) VALUES
('PAY-R-2024-001', 'received', 1, 1, NULL, 1000.00, 'TRY', 'bank_transfer', CURRENT_DATE - INTERVAL '1 day', 'Ziraat Bankası', 'TRF123456789', 'Kısmi ödeme alındı', 1),
('PAY-P-2024-001', 'paid', 2, NULL, 1, 7080.00, 'TRY', 'bank_transfer', CURRENT_DATE - INTERVAL '3 days', 'İş Bankası', 'TRF987654321', 'Tedarikçi ödemesi yapıldı', 1);

-- Veri yükleme tamamlandı
SELECT 'PostgreSQL ERP örnek verileri başarıyla yüklendi!' as status,
       (SELECT COUNT(*) FROM products) as toplam_urun,
       (SELECT COUNT(*) FROM inventory) as stok_kaydi,
       (SELECT COUNT(*) FROM production_orders) as uretim_emri,
       (SELECT COUNT(*) FROM sales_orders) as satis_siparisi,
       (SELECT COUNT(*) FROM purchase_orders) as satin_alma_siparisi,
       (SELECT COUNT(*) FROM alerts) as uyari_sayisi,
       (SELECT COUNT(*) FROM customers) as musteri_sayisi,
       (SELECT COUNT(*) FROM suppliers) as tedarikci_sayisi;