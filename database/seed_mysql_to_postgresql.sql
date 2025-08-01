-- MySQL'den PostgreSQL'e Çevrilmiş Seed Data
-- Bu dosya MySQL seed verilerini PostgreSQL'e uyarlar

-- =======================
-- KULLANICI VERİLERİ
-- =======================

-- Admin kullanıcısı (bcrypt hash ile)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES
('admin', 'admin@inflow.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPyV8Nim', 'Admin', 'User', 'admin', true),
('operator', 'operator@inflow.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPyV8Nim', 'Operator', 'User', 'operator', true),
('viewer', 'viewer@inflow.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPyV8Nim', 'Viewer', 'User', 'viewer', true);

-- =======================
-- TEDARİKÇİ VERİLERİ
-- =======================

INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, city, country, tax_number, payment_terms, currency, rating) VALUES
('SUP001', 'ABC Malzeme Ltd.', 'Ahmet Yılmaz', 'ahmet@abcmalzeme.com', '+90 212 555 0101', 'Sanayi Mah. 1. Cad. No:15', 'İstanbul', 'Türkiye', '1234567890', 30, 'TRY', 4.5),
('SUP002', 'XYZ Tedarik A.Ş.', 'Fatma Kaya', 'fatma@xyztedarik.com', '+90 312 555 0202', 'Ostim OSB 5. Cad. No:23', 'Ankara', 'Türkiye', '0987654321', 45, 'TRY', 4.2),
('SUP003', 'Global Supplies Inc.', 'John Smith', 'john@globalsupplies.com', '+1 555 123 4567', '123 Industrial Ave', 'New York', 'USA', 'US123456789', 60, 'USD', 4.8),
('SUP004', 'Euro Materials GmbH', 'Hans Mueller', 'hans@euromaterials.de', '+49 30 555 7890', 'Industriestraße 45', 'Berlin', 'Germany', 'DE987654321', 30, 'EUR', 4.3);

-- =======================
-- ÜRÜN KATEGORİLERİ
-- =======================

INSERT INTO product_categories (name, description, parent_id) VALUES
('Hammaddeler', 'Üretimde kullanılan temel malzemeler', NULL),
('Yarı Mamuller', 'İşlenmiş ancak henüz bitmiş ürün olmayan malzemeler', NULL),
('Bitmiş Ürünler', 'Satışa hazır nihai ürünler', NULL),
('Yardımcı Malzemeler', 'Üretim sürecinde kullanılan yardımcı malzemeler', NULL),
('Ambalaj Malzemeleri', 'Ürün ambalajında kullanılan malzemeler', 4),
('Kimyasal Maddeler', 'Üretimde kullanılan kimyasal maddeler', 1),
('Metal Malzemeler', 'Çelik, alüminyum ve diğer metal malzemeler', 1),
('Plastik Malzemeler', 'Plastik hammaddeler ve yarı mamuller', 1);

-- =======================
-- ÜRÜN TİPLERİ
-- =======================

INSERT INTO product_types (name, description) VALUES
('Hammadde', 'Temel üretim malzemeleri'),
('Yarı Mamul', 'İşlenmiş ara ürünler'),
('Bitmiş Ürün', 'Satışa hazır nihai ürünler'),
('Yedek Parça', 'Makine ve ekipman yedek parçaları'),
('Sarf Malzemesi', 'Tüketilen yardımcı malzemeler'),
('Ambalaj', 'Ürün ambalaj malzemeleri');

-- =======================
-- ÜRÜN VERİLERİ
-- =======================

INSERT INTO products (sku, name, description, barcode, category_id, product_type_id, supplier_id, unit_price, cost_price, unit, location, min_stock_level, max_stock_level, reorder_point, reorder_quantity, lead_time_days, is_raw_material, is_finished_product) VALUES
-- Hammaddeler
('HM001', 'Çelik Levha 2mm', '2mm kalınlığında çelik levha', '1234567890123', 7, 1, 1, 150.00, 120.00, 'kg', 'A-01-01', 100, 1000, 200, 500, 7, true, false),
('HM002', 'Alüminyum Profil 40x40', '40x40mm alüminyum profil', '1234567890124', 7, 1, 1, 85.50, 68.40, 'm', 'A-01-02', 50, 500, 100, 250, 5, true, false),
('HM003', 'PVC Granül Beyaz', 'Beyaz renk PVC granül', '1234567890125', 8, 1, 2, 12.75, 10.20, 'kg', 'A-02-01', 200, 2000, 400, 1000, 10, true, false),
('HM004', 'Paslanmaz Çelik Boru', 'Ø25mm paslanmaz çelik boru', '1234567890126', 7, 1, 1, 95.00, 76.00, 'm', 'A-01-03', 30, 300, 60, 150, 7, true, false),

-- Yarı Mamuller
('YM001', 'İşlenmiş Çelik Parça A', 'Torna tezgahında işlenmiş çelik parça', '2234567890123', 2, 2, NULL, 45.00, 35.00, 'pcs', 'B-01-01', 20, 200, 40, 100, 3, false, false),
('YM002', 'Kaynaklı Alüminyum Çerçeve', 'Kaynak işlemi tamamlanmış çerçeve', '2234567890124', 2, 2, NULL, 125.00, 95.00, 'pcs', 'B-01-02', 15, 150, 30, 75, 2, false, false),
('YM003', 'Plastik Enjeksiyon Parça', 'Enjeksiyon kalıbından çıkan plastik parça', '2234567890125', 2, 2, NULL, 8.50, 6.50, 'pcs', 'B-02-01', 100, 1000, 200, 500, 1, false, false),

-- Bitmiş Ürünler
('BU001', 'Endüstriyel Masa', 'Çelik ayaklı endüstriyel çalışma masası', '3234567890123', 3, 3, NULL, 850.00, 650.00, 'pcs', 'C-01-01', 5, 50, 10, 25, 0, false, true),
('BU002', 'Alüminyum Merdiven', '3 basamaklı alüminyum merdiven', '3234567890124', 3, 3, NULL, 320.00, 240.00, 'pcs', 'C-01-02', 8, 80, 15, 40, 0, false, true),
('BU003', 'Plastik Saklama Kutusu', 'Şeffaf plastik saklama kutusu 50L', '3234567890125', 3, 3, NULL, 45.00, 32.00, 'pcs', 'C-02-01', 25, 250, 50, 125, 0, false, true),

-- Yedek Parçalar
('YP001', 'Motor Rulmanı 6205', 'Standart motor rulmanı', '4234567890123', 4, 4, 3, 25.00, 18.00, 'pcs', 'D-01-01', 10, 100, 20, 50, 14, false, false),
('YP002', 'Hidrolik Conta', 'Hidrolik sistem contası', '4234567890124', 4, 4, 3, 15.50, 11.00, 'pcs', 'D-01-02', 15, 150, 30, 75, 14, false, false),

-- Sarf Malzemeleri
('SM001', 'Kaynak Elektrodu 3.2mm', '3.2mm çaplı kaynak elektrodu', '5234567890123', 4, 5, 2, 2.50, 1.80, 'pcs', 'E-01-01', 500, 5000, 1000, 2500, 7, false, false),
('SM002', 'Kesici Disk 125mm', '125mm çaplı kesici disk', '5234567890124', 4, 5, 2, 8.75, 6.25, 'pcs', 'E-01-02', 100, 1000, 200, 500, 5, false, false),

-- Ambalaj Malzemeleri
('AM001', 'Karton Kutu 30x20x15', 'Standart karton ambalaj kutusu', '6234567890123', 5, 6, 4, 3.50, 2.50, 'pcs', 'F-01-01', 200, 2000, 400, 1000, 3, false, false),
('AM002', 'Bubble Wrap 1m', '1 metre genişlik bubble wrap', '6234567890124', 5, 6, 4, 12.00, 8.50, 'm', 'F-01-02', 50, 500, 100, 250, 5, false, false);

-- =======================
-- STOK VERİLERİ
-- =======================

-- Her ürün için başlangıç stok miktarları
INSERT INTO inventory (product_id, location, available_quantity, reserved_quantity, unit_cost) VALUES
-- Hammaddeler
(1, 'A-01-01', 500.000, 0.000, 120.00),
(2, 'A-01-02', 250.000, 0.000, 68.40),
(3, 'A-02-01', 1000.000, 0.000, 10.20),
(4, 'A-01-03', 150.000, 0.000, 76.00),

-- Yarı Mamuller
(5, 'B-01-01', 100.000, 0.000, 35.00),
(6, 'B-01-02', 75.000, 0.000, 95.00),
(7, 'B-02-01', 500.000, 0.000, 6.50),

-- Bitmiş Ürünler
(8, 'C-01-01', 25.000, 0.000, 650.00),
(9, 'C-01-02', 40.000, 0.000, 240.00),
(10, 'C-02-01', 125.000, 0.000, 32.00),

-- Yedek Parçalar
(11, 'D-01-01', 50.000, 0.000, 18.00),
(12, 'D-01-02', 75.000, 0.000, 11.00),

-- Sarf Malzemeleri
(13, 'E-01-01', 2500.000, 0.000, 1.80),
(14, 'E-01-02', 500.000, 0.000, 6.25),

-- Ambalaj Malzemeleri
(15, 'F-01-01', 1000.000, 0.000, 2.50),
(16, 'F-01-02', 250.000, 0.000, 8.50);

-- =======================
-- ÖRNEK STOK HAREKETLERİ
-- =======================

-- Giriş hareketleri (satın alma)
INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, total_cost, reference_type, reference_id, location, notes, created_by) VALUES
(1, 'in', 500.000, 120.00, 60000.00, 'purchase', 1, 'A-01-01', 'İlk stok girişi', 1),
(2, 'in', 250.000, 68.40, 17100.00, 'purchase', 1, 'A-01-02', 'İlk stok girişi', 1),
(3, 'in', 1000.000, 10.20, 10200.00, 'purchase', 2, 'A-02-01', 'İlk stok girişi', 1),
(4, 'in', 150.000, 76.00, 11400.00, 'purchase', 1, 'A-01-03', 'İlk stok girişi', 1);

-- Çıkış hareketleri (üretim)
INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, total_cost, reference_type, reference_id, location, notes, created_by) VALUES
(1, 'out', 50.000, 120.00, 6000.00, 'production', 1, 'A-01-01', 'Üretimde kullanıldı', 2),
(2, 'out', 25.000, 68.40, 1710.00, 'production', 1, 'A-01-02', 'Üretimde kullanıldı', 2),
(3, 'out', 100.000, 10.20, 1020.00, 'production', 2, 'A-02-01', 'Üretimde kullanıldı', 2);

-- Başarı mesajı
SELECT 'PostgreSQL seed data başarıyla yüklendi!' as status;

-- Kullanıcı şifreleri hakkında bilgi
-- Tüm kullanıcılar için şifre: 'password123'
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPyV8Nim