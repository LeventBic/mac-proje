-- inFlow Stok ve Üretim Yönetimi - MySQL Örnek Veriler
-- Bu dosya MySQL veritabanına örnek verileri yükler

USE inflow_db;

-- =======================
-- ÖRNEK VERİLER
-- =======================

-- Ürün kategorileri
INSERT INTO product_categories (name, description) VALUES
('Hammadde', 'Üretimde kullanılan hammaddeler'),
('Yarı Mamul', 'İşlenmiş ama henüz bitmiş olmayan ürünler'),
('Mamul', 'Satışa hazır bitmiş ürünler'),
('Ambalaj', 'Ambalajlama malzemeleri'),
('Yardımcı Malzeme', 'Üretimde kullanılan yardımcı malzemeler');

-- Örnek ürünler
INSERT INTO products (sku, name, description, barcode, category_id, unit_price, cost_price, unit, location, min_stock_level, max_stock_level, is_raw_material, is_finished_product) VALUES
-- Hammaddeler
('HM001', 'Çelik Levha 2mm', '2mm kalınlığında çelik levha', '1234567890001', 1, 15.50, 12.00, 'kg', 'A-01-001', 100, 500, TRUE, FALSE),
('HM002', 'Alüminyum Profil 20x20', '20x20mm alüminyum profil', '1234567890002', 1, 8.75, 6.50, 'm', 'A-01-002', 50, 300, TRUE, FALSE),
('HM003', 'Plastik Granül ABS', 'ABS plastik granül', '1234567890003', 1, 25.00, 20.00, 'kg', 'A-02-001', 200, 1000, TRUE, FALSE),
('HM004', 'Vida M6x20', 'M6x20 paslanmaz çelik vida', '1234567890004', 1, 0.15, 0.10, 'adet', 'A-03-001', 1000, 5000, TRUE, FALSE),
('HM005', 'Conta NBR 40x50x5', 'NBR kauçuk conta', '1234567890005', 1, 2.50, 1.80, 'adet', 'A-03-002', 200, 1000, TRUE, FALSE),

-- Yarı mamuller
('YM001', 'Çelik Parça A', 'İşlenmiş çelik parça A', '1234567890011', 2, 45.00, 35.00, 'adet', 'B-01-001', 20, 100, FALSE, FALSE),
('YM002', 'Alüminyum Gövde', 'İşlenmiş alüminyum gövde', '1234567890012', 2, 65.00, 50.00, 'adet', 'B-01-002', 15, 80, FALSE, FALSE),
('YM003', 'Plastik Kapak', 'Enjeksiyonla üretilmiş plastik kapak', '1234567890013', 2, 12.00, 8.50, 'adet', 'B-02-001', 50, 200, FALSE, FALSE),

-- Mamul ürünler
('MM001', 'Hidrolik Silindir HS-100', '100mm çapında hidrolik silindir', '1234567890021', 3, 450.00, 320.00, 'adet', 'C-01-001', 5, 25, FALSE, TRUE),
('MM002', 'Pnömatik Valf PV-25', '25mm pnömatik valf', '1234567890022', 3, 180.00, 125.00, 'adet', 'C-01-002', 10, 50, FALSE, TRUE),
('MM003', 'Kompresör Tankı KT-50', '50 litre kompresör tankı', '1234567890023', 3, 850.00, 650.00, 'adet', 'C-02-001', 3, 15, FALSE, TRUE),

-- Ambalaj malzemeleri
('AM001', 'Karton Kutu 30x20x15', 'Karton ambalaj kutusu', '1234567890031', 4, 2.50, 1.80, 'adet', 'D-01-001', 100, 500, FALSE, FALSE),
('AM002', 'Köpük Koruma', 'Koruyucu köpük malzeme', '1234567890032', 4, 1.25, 0.90, 'adet', 'D-01-002', 200, 800, FALSE, FALSE),
('AM003', 'Plastik Torba', 'Şeffaf plastik torba', '1234567890033', 4, 0.35, 0.25, 'adet', 'D-01-003', 500, 2000, FALSE, FALSE),

-- Yardımcı malzemeler
('YD001', 'Kesme Yağı', 'Metal işleme kesme yağı', '1234567890041', 5, 45.00, 35.00, 'lt', 'E-01-001', 20, 100, FALSE, FALSE),
('YD002', 'Temizlik Solüsyonu', 'Endüstriyel temizlik solüsyonu', '1234567890042', 5, 25.00, 18.00, 'lt', 'E-01-002', 30, 150, FALSE, FALSE);

-- Envanter başlangıç stokları
INSERT INTO inventory (product_id, location, available_quantity) VALUES
-- Hammaddeler
(1, 'A-01-001', 250.5),  -- Çelik Levha
(2, 'A-01-002', 150.0),  -- Alüminyum Profil
(3, 'A-02-001', 500.0),  -- Plastik Granül
(4, 'A-03-001', 2500),   -- Vida
(5, 'A-03-002', 450),    -- Conta

-- Yarı mamuller
(6, 'B-01-001', 35),     -- Çelik Parça A
(7, 'B-01-002', 28),     -- Alüminyum Gövde
(8, 'B-02-001', 85),     -- Plastik Kapak

-- Mamul ürünler
(9, 'C-01-001', 12),     -- Hidrolik Silindir
(10, 'C-01-002', 25),    -- Pnömatik Valf
(11, 'C-02-001', 8),     -- Kompresör Tankı

-- Ambalaj malzemeleri
(12, 'D-01-001', 250),   -- Karton Kutu
(13, 'D-01-002', 400),   -- Köpük Koruma
(14, 'D-01-003', 1200),  -- Plastik Torba

-- Yardımcı malzemeler
(15, 'E-01-001', 45.5),  -- Kesme Yağı
(16, 'E-01-002', 62.0);  -- Temizlik Solüsyonu

-- BOM (Bill of Materials) - Malzeme Listeleri
INSERT INTO bom (finished_product_id, version, notes, created_by) VALUES
(9, '1.0', 'Hidrolik Silindir HS-100 standart üretim reçetesi', 1),  -- Hidrolik Silindir
(10, '1.0', 'Pnömatik Valf PV-25 standart üretim reçetesi', 1),      -- Pnömatik Valf
(11, '1.0', 'Kompresör Tankı KT-50 standart üretim reçetesi', 1);    -- Kompresör Tankı

-- BOM Kalemleri
INSERT INTO bom_items (bom_id, raw_material_id, quantity, unit, waste_percentage, notes) VALUES
-- Hidrolik Silindir HS-100 (BOM ID: 1)
(1, 1, 2.5, 'kg', 5.0, 'Silindir gövdesi için çelik levha'),
(1, 2, 0.8, 'm', 2.0, 'Montaj için alüminyum profil'),
(1, 4, 8, 'adet', 0, 'Montaj vidaları'),
(1, 5, 2, 'adet', 0, 'Sızdırmazlık contaları'),
(1, 15, 0.1, 'lt', 0, 'Montaj için kesme yağı'),

-- Pnömatik Valf PV-25 (BOM ID: 2)
(2, 1, 1.2, 'kg', 3.0, 'Valf gövdesi için çelik levha'),
(2, 3, 0.5, 'kg', 8.0, 'Valf kapakları için plastik'),
(2, 4, 6, 'adet', 0, 'Montaj vidaları'),
(2, 5, 1, 'adet', 0, 'Ana conta'),

-- Kompresör Tankı KT-50 (BOM ID: 3)
(3, 1, 8.5, 'kg', 4.0, 'Tank gövdesi için çelik levha'),
(3, 2, 1.5, 'm', 2.0, 'Destek çerçevesi için alüminyum'),
(3, 4, 12, 'adet', 0, 'Montaj vidaları'),
(3, 5, 3, 'adet', 0, 'Çeşitli contalar'),
(3, 15, 0.2, 'lt', 0, 'İşleme yağı');

-- Örnek üretim emirleri
INSERT INTO production_orders (order_number, bom_id, planned_quantity, produced_quantity, status, priority, planned_start_date, planned_end_date, estimated_cost, notes, created_by) VALUES
('ÜE-2024-001', 1, 10, 8, 'in_progress', 'high', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 4500.00, 'Acil sipariş - müşteri bekleniyor', 1),
('ÜE-2024-002', 2, 25, 25, 'completed', 'medium', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 4500.00, 'Stok tamamlama üretimi', 1),
('ÜE-2024-003', 3, 5, 0, 'planned', 'low', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), 4250.00, 'Planlı üretim', 2),
('ÜE-2024-004', 1, 15, 0, 'planned', 'medium', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 8 DAY), 6750.00, 'Büyük sipariş için ön üretim', 1),
('ÜE-2024-005', 2, 20, 5, 'in_progress', 'high', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), 3600.00, 'Stok seviyesi düşük - acil üretim', 2);

-- Üretim hareketleri (örnek)
INSERT INTO production_movements (production_order_id, product_id, movement_type, quantity, unit_cost, location, notes, created_by) VALUES
-- ÜE-2024-001 için malzeme tüketimi
(1, 1, 'material_consumed', 20.0, 12.00, 'A-01-001', 'Çelik levha tüketimi', 1),
(1, 2, 'material_consumed', 6.4, 6.50, 'A-01-002', 'Alüminyum profil tüketimi', 1),
(1, 4, 'material_consumed', 64, 0.10, 'A-03-001', 'Vida tüketimi', 1),
-- Üretilen ürün
(1, 9, 'product_produced', 8, 320.00, 'C-01-001', 'Hidrolik silindir üretimi', 1),

-- ÜE-2024-002 için hareketler (tamamlanmış)
(2, 1, 'material_consumed', 30.0, 12.00, 'A-01-001', 'Çelik levha tüketimi', 1),
(2, 3, 'material_consumed', 12.5, 20.00, 'A-02-001', 'Plastik granül tüketimi', 1),
(2, 4, 'material_consumed', 150, 0.10, 'A-03-001', 'Vida tüketimi', 1),
-- Üretilen ürün
(2, 10, 'product_produced', 25, 125.00, 'C-01-002', 'Pnömatik valf üretimi', 1);

-- Örnek stok hareketleri
INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, location_to, notes, created_by) VALUES
-- Hammadde girişleri
(1, 'in', 500.0, 11.50, 'purchase', 'A-01-001', 'Tedarikçi ABC\'den çelik levha alımı', 1),
(2, 'in', 200.0, 6.00, 'purchase', 'A-01-002', 'Tedarikçi XYZ\'den alüminyum profil alımı', 1),
(3, 'in', 1000.0, 19.50, 'purchase', 'A-02-001', 'Plastik granül toplu alımı', 1),

-- Üretim çıkışları
(9, 'production_in', 25, 320.00, 'production', 'C-01-001', 'Üretim emri ÜE-2024-002 tamamlandı', 1),
(10, 'production_in', 8, 125.00, 'production', 'C-01-002', 'Üretim emri ÜE-2024-001 kısmi üretim', 1),

-- Satış çıkışları
(9, 'out', 5, 320.00, 'sale', 'C-01-001', 'Müşteri siparişi MÜŞ-001', 1),
(10, 'out', 8, 125.00, 'sale', 'C-01-002', 'Müşteri siparişi MÜŞ-002', 1),

-- Stok düzeltmeleri
(4, 'adjustment', -50, 0.10, 'adjustment', 'A-03-001', 'Sayım sonucu eksik tespit edildi', 1),
(13, 'adjustment', 100, 0.90, 'adjustment', 'D-01-002', 'Sayım sonucu fazla tespit edildi', 1);

-- Örnek uyarılar
INSERT INTO alerts (type, title, message, severity, related_entity_type, related_entity_id, assigned_to) VALUES
('low_stock', 'Düşük Stok Uyarısı', 'Vida M6x20 stok seviyesi minimum seviyenin altına düştü. Mevcut: 950, Minimum: 1000', 'warning', 'product', 4, 1),
('production_delay', 'Üretim Gecikmesi', 'ÜE-2024-001 numaralı üretim emri planlanandan geç tamamlanıyor.', 'error', 'production_order', 1, 2),
('low_stock', 'Kritik Stok Seviyesi', 'Kompresör Tankı KT-50 stok seviyesi kritik seviyede. Mevcut: 3, Minimum: 3', 'critical', 'product', 11, 1),
('system', 'Sistem Bakımı', 'Haftalık sistem bakımı 15.12.2024 tarihinde yapılacaktır.', 'info', 'system', NULL, 1),
('quality', 'Kalite Kontrolü', 'ÜE-2024-001 üretim emrinde kalite kontrol anomalisi tespit edildi.', 'warning', 'production_order', 1, 2);

-- Veri yükleme tamamlandı
SELECT 'MySQL örnek verileri başarıyla yüklendi!' as status,
       (SELECT COUNT(*) FROM products) as toplam_urun,
       (SELECT COUNT(*) FROM inventory) as stok_kaydi,
       (SELECT COUNT(*) FROM production_orders) as uretim_emri,
       (SELECT COUNT(*) FROM alerts) as uyari_sayisi; 