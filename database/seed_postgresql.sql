-- inFlow Stok ve Üretim Yönetimi - PostgreSQL Seed Data
-- Bu dosya PostgreSQL veritabanına örnek veriler ekler

-- Veritabanına bağlan
-- \c inflow_db;

BEGIN;

-- =======================
-- KULLANICI VERİLERİ
-- =======================

-- Admin kullanıcısı (şifre: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('admin', 'admin@inflow.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Kullanıcı', 'admin'),
('operator1', 'operator1@inflow.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Operatör', 'Bir', 'operator'),
('viewer1', 'viewer1@inflow.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Görüntüleyici', 'Bir', 'viewer');

-- =======================
-- TEDARİKÇİ VERİLERİ
-- =======================

INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, city, country, tax_number, payment_terms, currency, rating) VALUES 
('SUP001', 'ABC Malzeme Ltd.', 'Ahmet Yılmaz', 'ahmet@abcmalzeme.com', '+90 212 555 0101', 'Sanayi Mah. 1. Cad. No:15', 'İstanbul', 'Türkiye', '1234567890', 30, 'TRY', 4.5),
('SUP002', 'XYZ Kimya San.', 'Fatma Demir', 'fatma@xyzkimya.com', '+90 232 555 0202', 'Organize Sanayi Bölgesi 5. Cad.', 'İzmir', 'Türkiye', '0987654321', 45, 'TRY', 4.2),
('SUP003', 'Global Supplies Inc.', 'John Smith', 'john@globalsupplies.com', '+1 555 123 4567', '123 Industrial Ave', 'New York', 'USA', 'US123456789', 60, 'USD', 4.8),
('SUP004', 'Avrupa Malzeme GmbH', 'Hans Mueller', 'hans@euromat.de', '+49 30 555 7890', 'Industriestraße 45', 'Berlin', 'Almanya', 'DE987654321', 30, 'EUR', 4.6);

-- =======================
-- ÜRÜN KATEGORİLERİ
-- =======================

INSERT INTO product_categories (name, description) VALUES 
('Hammaddeler', 'Üretimde kullanılan temel malzemeler'),
('Yarı Mamuller', 'İşlenmiş ancak henüz bitmiş ürün olmayan malzemeler'),
('Bitmiş Ürünler', 'Satışa hazır nihai ürünler'),
('Yardımcı Malzemeler', 'Üretim sürecinde kullanılan yardımcı malzemeler'),
('Ambalaj Malzemeleri', 'Ürün ambalajında kullanılan malzemeler'),
('Elektronik Bileşenler', 'Elektronik ürünlerde kullanılan bileşenler');

-- Alt kategoriler
INSERT INTO product_categories (name, description, parent_id) VALUES 
('Metaller', 'Metal hammaddeler', 1),
('Plastikler', 'Plastik hammaddeler', 1),
('Kimyasallar', 'Kimyasal maddeler', 1),
('Elektronik Kartlar', 'Hazır elektronik kartlar', 2),
('Mekanik Parçalar', 'İşlenmiş mekanik parçalar', 2);

-- =======================
-- ÜRÜN TİPLERİ
-- =======================

INSERT INTO product_types (name, description) VALUES 
('Malzeme', 'Fiziksel malzemeler'),
('Hizmet', 'Hizmet kalemleri'),
('Dijital', 'Dijital ürünler'),
('Konsinyasyon', 'Konsinyasyon malları');

-- =======================
-- ÜRÜN VERİLERİ
-- =======================

INSERT INTO products (sku, name, description, barcode, category_id, product_type_id, supplier_id, unit_price, cost_price, unit, min_stock_level, max_stock_level, reorder_point, reorder_quantity, lead_time_days, is_raw_material, is_finished_product) VALUES 
-- Hammaddeler
('RAW001', 'Alüminyum Levha 2mm', '2mm kalınlığında alüminyum levha', '1234567890123', 7, 1, 1, 25.50, 20.00, 'm2', 50, 500, 100, 200, 7, true, false),
('RAW002', 'Çelik Boru Ø20mm', '20mm çapında çelik boru', '1234567890124', 7, 1, 1, 15.75, 12.00, 'm', 100, 1000, 200, 500, 10, true, false),
('RAW003', 'PVC Granül', 'Beyaz PVC granül hammadde', '1234567890125', 8, 1, 2, 8.50, 6.80, 'kg', 200, 2000, 400, 1000, 14, true, false),
('RAW004', 'Silikon Yapıştırıcı', 'Şeffaf silikon yapıştırıcı', '1234567890126', 9, 1, 2, 12.00, 9.50, 'adet', 20, 200, 50, 100, 5, true, false),

-- Yarı Mamuller
('SEMI001', 'İşlenmiş Alüminyum Parça A1', 'CNC ile işlenmiş alüminyum parça', '2234567890123', 11, 1, null, 45.00, 35.00, 'adet', 20, 200, 50, 100, 3, false, false),
('SEMI002', 'Elektronik Kart PCB-001', 'Ana kontrol kartı PCB', '2234567890124', 10, 1, 3, 85.00, 65.00, 'adet', 10, 100, 25, 50, 21, false, false),
('SEMI003', 'Plastik Gövde Parçası', 'Enjeksiyon ile üretilmiş plastik gövde', '2234567890125', 11, 1, null, 18.50, 14.00, 'adet', 30, 300, 75, 150, 5, false, false),

-- Bitmiş Ürünler
('FIN001', 'Akıllı Sensör Model A', 'IoT özellikli akıllı sensör', '3234567890123', 3, 1, null, 250.00, 180.00, 'adet', 5, 50, 15, 30, 0, false, true),
('FIN002', 'Endüstriyel Kontrol Ünitesi', 'PLC tabanlı kontrol ünitesi', '3234567890124', 3, 1, null, 1250.00, 950.00, 'adet', 2, 20, 5, 10, 0, false, true),
('FIN003', 'Otomasyon Paketi Basic', 'Temel otomasyon çözümü', '3234567890125', 3, 1, null, 3500.00, 2800.00, 'set', 1, 10, 3, 5, 0, false, true),

-- Yardımcı Malzemeler
('AUX001', 'Vida M6x20', 'Paslanmaz çelik vida', '4234567890123', 4, 1, 1, 0.50, 0.35, 'adet', 1000, 10000, 2000, 5000, 7, true, false),
('AUX002', 'Somun M6', 'Paslanmaz çelik somun', '4234567890124', 4, 1, 1, 0.25, 0.18, 'adet', 1000, 10000, 2000, 5000, 7, true, false),
('AUX003', 'Kablo 2x1.5mm', 'Çok damarlı esnek kablo', '4234567890125', 4, 1, 3, 2.50, 1.80, 'm', 500, 5000, 1000, 2000, 14, true, false),

-- Ambalaj Malzemeleri
('PKG001', 'Karton Kutu 30x20x15', 'Kraft karton kutu', '5234567890123', 5, 1, 4, 3.50, 2.80, 'adet', 100, 1000, 200, 500, 10, true, false),
('PKG002', 'Bubble Wrap', 'Hava kabarcıklı ambalaj', '5234567890124', 5, 1, 4, 1.25, 0.95, 'm', 200, 2000, 400, 1000, 7, true, false),
('PKG003', 'Etiket 10x5cm', 'Yapışkanlı ürün etiketi', '5234567890125', 5, 1, 4, 0.15, 0.10, 'adet', 5000, 50000, 10000, 25000, 5, true, false);

-- =======================
-- ENVANTER VERİLERİ
-- =======================

INSERT INTO inventory (product_id, location, available_quantity, reserved_quantity) VALUES 
-- Ana depo stokları
(1, 'MAIN', 150.000, 25.000),
(2, 'MAIN', 750.000, 50.000),
(3, 'MAIN', 1200.000, 200.000),
(4, 'MAIN', 85.000, 15.000),
(5, 'MAIN', 75.000, 10.000),
(6, 'MAIN', 45.000, 5.000),
(7, 'MAIN', 120.000, 20.000),
(8, 'MAIN', 25.000, 3.000),
(9, 'MAIN', 8.000, 2.000),
(10, 'MAIN', 3.000, 1.000),
(11, 'MAIN', 5500.000, 500.000),
(12, 'MAIN', 5200.000, 800.000),
(13, 'MAIN', 2800.000, 200.000),
(14, 'MAIN', 450.000, 50.000),
(15, 'MAIN', 850.000, 150.000),
(16, 'MAIN', 25000.000, 5000.000),

-- Üretim alanı stokları
(1, 'PRODUCTION', 25.000, 0.000),
(2, 'PRODUCTION', 50.000, 0.000),
(3, 'PRODUCTION', 100.000, 0.000),
(5, 'PRODUCTION', 15.000, 0.000),
(6, 'PRODUCTION', 8.000, 0.000),
(7, 'PRODUCTION', 20.000, 0.000),

-- Kalite kontrol alanı
(8, 'QC', 2.000, 0.000),
(9, 'QC', 1.000, 0.000),
(10, 'QC', 1.000, 0.000),

-- Sevkiyat alanı
(8, 'SHIPPING', 3.000, 3.000),
(9, 'SHIPPING', 2.000, 2.000),
(10, 'SHIPPING', 1.000, 1.000);

-- =======================
-- MÜŞTERİ VERİLERİ
-- =======================

INSERT INTO customers (customer_code, customer_type, name, contact_person, email, phone, address, city, country, tax_number, credit_limit, payment_terms) VALUES 
('CUS001', 'corporate', 'Teknoloji A.Ş.', 'Mehmet Özkan', 'mehmet@teknoloji.com', '+90 212 555 1001', 'Teknoloji Cad. No:25', 'İstanbul', 'Türkiye', '1111111111', 50000.00, 30),
('CUS002', 'corporate', 'Endüstri Ltd.', 'Ayşe Kaya', 'ayse@endustri.com', '+90 232 555 2002', 'Sanayi Bölgesi 3. Cad.', 'İzmir', 'Türkiye', '2222222222', 75000.00, 45),
('CUS003', 'individual', 'Ali Veli', 'Ali Veli', 'ali@email.com', '+90 533 555 3003', 'Merkez Mah. 5. Sok. No:10', 'Ankara', 'Türkiye', '3333333333', 10000.00, 15),
('CUS004', 'corporate', 'International Corp.', 'Jane Doe', 'jane@intcorp.com', '+1 555 987 6543', '456 Business St', 'Chicago', 'USA', 'US987654321', 100000.00, 60),
('CUS005', 'corporate', 'Avrupa Sistemleri GmbH', 'Klaus Weber', 'klaus@eurosys.de', '+49 30 555 4567', 'Hauptstraße 123', 'München', 'Almanya', 'DE123456789', 80000.00, 30);

-- =======================
-- BOM (REÇETE) VERİLERİ
-- =======================

-- Akıllı Sensör Model A reçetesi
INSERT INTO bom (finished_product_id, version, base_cost, profit_margin, notes, created_by) VALUES 
(8, '1.0', 150.00, 25.00, 'Akıllı Sensör Model A ana reçetesi', 1);

-- Akıllı Sensör reçete kalemleri
INSERT INTO bom_items (bom_id, item_type, raw_material_id, quantity, unit, unit_cost, waste_percentage, notes) VALUES 
(1, 'material', 6, 1.000, 'adet', 65.00, 2.0, 'Ana elektronik kart'),
(1, 'material', 5, 1.000, 'adet', 35.00, 1.0, 'Alüminyum gövde parçası'),
(1, 'material', 7, 1.000, 'adet', 14.00, 0.5, 'Plastik kapak'),
(1, 'material', 11, 4.000, 'adet', 0.35, 0.0, 'Montaj vidaları'),
(1, 'material', 12, 4.000, 'adet', 0.18, 0.0, 'Montaj somunları'),
(1, 'material', 13, 0.500, 'm', 1.80, 5.0, 'Bağlantı kablosu'),
(1, 'material', 14, 1.000, 'adet', 2.80, 0.0, 'Ambalaj kutusu');

-- Endüstriyel Kontrol Ünitesi reçetesi
INSERT INTO bom (finished_product_id, version, base_cost, profit_margin, notes, created_by) VALUES 
(9, '1.0', 750.00, 35.00, 'Endüstriyel Kontrol Ünitesi ana reçetesi', 1);

-- Kontrol Ünitesi reçete kalemleri
INSERT INTO bom_items (bom_id, item_type, raw_material_id, quantity, unit, unit_cost, waste_percentage, notes) VALUES 
(2, 'material', 6, 3.000, 'adet', 65.00, 1.0, 'Kontrol kartları'),
(2, 'material', 1, 0.250, 'm2', 20.00, 2.0, 'Alüminyum panel'),
(2, 'material', 2, 0.500, 'm', 12.00, 1.0, 'Çelik destek çubuğu'),
(2, 'material', 7, 2.000, 'adet', 14.00, 0.5, 'Plastik kapaklar'),
(2, 'material', 11, 12.000, 'adet', 0.35, 0.0, 'Montaj vidaları'),
(2, 'material', 13, 2.000, 'm', 1.80, 3.0, 'İç kablolama'),
(2, 'material', 14, 1.000, 'adet', 2.80, 0.0, 'Ambalaj kutusu');

-- =======================
-- PROJE VERİLERİ
-- =======================

INSERT INTO projects (project_code, name, description, status, priority, start_date, end_date, budget, project_manager_id, client_name, client_contact, created_by) VALUES 
('PRJ001', 'Fabrika Otomasyon Sistemi', 'Tekstil fabrikası için kapsamlı otomasyon çözümü', 'active', 'high', '2024-01-15', '2024-06-30', 250000.00, 2, 'Tekstil A.Ş.', 'Murat Yılmaz - murat@tekstil.com', 1),
('PRJ002', 'IoT Sensör Ağı Kurulumu', 'Depo yönetimi için IoT sensör ağı', 'planning', 'medium', '2024-02-01', '2024-04-15', 75000.00, 2, 'Lojistik Ltd.', 'Zehra Demir - zehra@lojistik.com', 1),
('PRJ003', 'Kalite Kontrol Sistemi', 'Üretim hattı kalite kontrol otomasyonu', 'active', 'high', '2024-01-20', '2024-05-20', 180000.00, 2, 'Üretim San.', 'Ahmet Kaya - ahmet@uretim.com', 1),
('PRJ004', 'Bakım Yönetim Sistemi', 'Preventif bakım takip sistemi', 'planning', 'low', '2024-03-01', '2024-08-31', 120000.00, 2, 'Makine A.Ş.', 'Fatma Özkan - fatma@makine.com', 1);

-- =======================
-- PROJE GÖREVLERİ
-- =======================

-- Fabrika Otomasyon Sistemi görevleri
INSERT INTO project_tasks (project_id, task_code, title, description, status, priority, assigned_to, estimated_hours, start_date, due_date, created_by) VALUES 
(1, 'PRJ001-T001', 'Sistem Analizi', 'Mevcut sistem analizi ve gereksinim belirleme', 'completed', 'high', 2, 80.00, '2024-01-15', '2024-01-30', 1),
(1, 'PRJ001-T002', 'Donanım Seçimi', 'PLC ve sensör donanımlarının seçimi', 'completed', 'high', 2, 40.00, '2024-01-25', '2024-02-05', 1),
(1, 'PRJ001-T003', 'Yazılım Geliştirme', 'Kontrol yazılımının geliştirilmesi', 'in_progress', 'high', 2, 200.00, '2024-02-01', '2024-04-15', 1),
(1, 'PRJ001-T004', 'Donanım Kurulumu', 'Sahada donanım kurulum işlemleri', 'todo', 'medium', 2, 120.00, '2024-04-01', '2024-05-15', 1),
(1, 'PRJ001-T005', 'Test ve Devreye Alma', 'Sistem testleri ve devreye alma', 'todo', 'high', 2, 80.00, '2024-05-15', '2024-06-15', 1),
(1, 'PRJ001-T006', 'Eğitim ve Dokümantasyon', 'Kullanıcı eğitimi ve dokümantasyon', 'todo', 'medium', 2, 60.00, '2024-06-01', '2024-06-30', 1);

-- IoT Sensör Ağı görevleri
INSERT INTO project_tasks (project_id, task_code, title, description, status, priority, assigned_to, estimated_hours, start_date, due_date, created_by) VALUES 
(2, 'PRJ002-T001', 'Ağ Tasarımı', 'IoT ağ mimarisi tasarımı', 'todo', 'high', 2, 40.00, '2024-02-01', '2024-02-15', 1),
(2, 'PRJ002-T002', 'Sensör Konfigürasyonu', 'Sensörlerin yapılandırılması', 'todo', 'medium', 2, 60.00, '2024-02-15', '2024-03-15', 1),
(2, 'PRJ002-T003', 'Veri Toplama Sistemi', 'Merkezi veri toplama sisteminin kurulumu', 'todo', 'high', 2, 80.00, '2024-03-01', '2024-04-01', 1),
(2, 'PRJ002-T004', 'Test ve Optimizasyon', 'Sistem testleri ve performans optimizasyonu', 'todo', 'medium', 2, 40.00, '2024-04-01', '2024-04-15', 1);

-- =======================
-- ÜRETİM EMİRLERİ
-- =======================

INSERT INTO production_orders (order_number, bom_id, finished_product_id, planned_quantity, status, priority, planned_start_date, planned_end_date, estimated_cost, created_by) VALUES 
('PO2024001', 1, 8, 50.000, 'in_progress', 2, '2024-01-15', '2024-01-25', 7500.00, 1),
('PO2024002', 2, 9, 10.000, 'planned', 3, '2024-01-20', '2024-02-05', 7500.00, 1),
('PO2024003', 1, 8, 25.000, 'planned', 1, '2024-02-01', '2024-02-10', 3750.00, 1);

-- =======================
-- SATIŞ TEKLİFLERİ
-- =======================

INSERT INTO sales_quotes (quote_number, customer_id, status, quote_date, valid_until, subtotal, tax_amount, total_amount, created_by) VALUES 
('SQ2024001', 1, 'sent', '2024-01-10', '2024-02-10', 12500.00, 2250.00, 14750.00, 1),
('SQ2024002', 2, 'accepted', '2024-01-15', '2024-02-15', 25000.00, 4500.00, 29500.00, 1),
('SQ2024003', 4, 'draft', '2024-01-20', '2024-02-20', 35000.00, 6300.00, 41300.00, 1);

-- Satış teklifi kalemleri
INSERT INTO sales_quote_items (quote_id, product_id, quantity, unit_price) VALUES 
(1, 8, 50.000, 250.00),
(2, 9, 20.000, 1250.00),
(3, 10, 10.000, 3500.00);

-- =======================
-- SATIŞ SİPARİŞLERİ
-- =======================

INSERT INTO sales_orders (order_number, customer_id, quote_id, status, order_date, delivery_date, subtotal, tax_amount, total_amount, shipping_address, created_by) VALUES 
('SO2024001', 2, 2, 'confirmed', '2024-01-16', '2024-02-15', 25000.00, 4500.00, 29500.00, 'Sanayi Bölgesi 3. Cad. İzmir', 1);

-- Satış siparişi kalemleri
INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES 
(1, 9, 20.000, 1250.00);

-- =======================
-- SATIN ALMA TEKLİFLERİ
-- =======================

INSERT INTO purchase_quotes (quote_number, supplier_id, status, quote_date, valid_until, subtotal, tax_amount, total_amount, created_by) VALUES 
('PQ2024001', 1, 'received', '2024-01-12', '2024-02-12', 5000.00, 900.00, 5900.00, 1),
('PQ2024002', 2, 'sent', '2024-01-18', '2024-02-18', 3400.00, 612.00, 4012.00, 1);

-- Satın alma teklifi kalemleri
INSERT INTO purchase_quote_items (quote_id, product_id, quantity, unit_price) VALUES 
(1, 1, 200.000, 20.00),
(1, 2, 100.000, 12.00),
(2, 3, 500.000, 6.80);

-- =======================
-- SATIN ALMA SİPARİŞLERİ
-- =======================

INSERT INTO purchase_orders (order_number, supplier_id, quote_id, status, order_date, expected_delivery_date, subtotal, tax_amount, total_amount, created_by) VALUES 
('PO2024001', 1, 1, 'sent', '2024-01-13', '2024-01-25', 5000.00, 900.00, 5900.00, 1);

-- Satın alma siparişi kalemleri
INSERT INTO purchase_order_items (order_id, product_id, quantity, unit_price) VALUES 
(1, 1, 200.000, 20.00),
(1, 2, 100.000, 12.00);

-- =======================
-- STOK HAREKETLERİ
-- =======================

INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, location_to, supplier_id, notes, created_by) VALUES 
-- Giriş hareketleri
(1, 'in', 200.000, 20.00, 'purchase', 'MAIN', 1, 'Satın alma girişi - PO2024001', 1),
(2, 'in', 100.000, 12.00, 'purchase', 'MAIN', 1, 'Satın alma girişi - PO2024001', 1),
(3, 'in', 500.000, 6.80, 'purchase', 'MAIN', 2, 'Satın alma girişi', 1),

-- Üretim için çıkış hareketleri
(1, 'out', 25.000, 20.00, 'production', 'PRODUCTION', null, 'Üretim emri PO2024001 için', 1),
(6, 'out', 10.000, 65.00, 'production', 'PRODUCTION', null, 'Üretim emri PO2024001 için', 1),

-- Transfer hareketleri
(8, 'transfer', 5.000, 180.00, 'transfer', 'SHIPPING', null, 'Sevkiyat için transfer', 1),

-- Sayım düzeltmeleri
(11, 'adjustment', 100.000, 0.35, 'adjustment', 'MAIN', null, 'Sayım fazlası', 1),
(12, 'adjustment', -50.000, 0.18, 'adjustment', 'MAIN', null, 'Sayım eksiği', 1);

-- =======================
-- STOK SAYIMLARI
-- =======================

INSERT INTO stock_counts (count_number, location, status, scheduled_date, total_items, counted_items, discrepancies_found, notes, created_by) VALUES 
('SC2024001', 'MAIN', 'completed', '2024-01-01', 16, 16, 3, 'Yıl başı genel sayım', 1),
('SC2024002', 'PRODUCTION', 'in_progress', '2024-01-15', 6, 4, 0, 'Üretim alanı spot sayım', 1),
('SC2024003', 'MAIN', 'planned', '2024-02-01', 16, 0, 0, 'Aylık rutin sayım', 1);

-- Stok sayım detayları
INSERT INTO stock_count_items (stock_count_id, product_id, expected_quantity, counted_quantity, notes, counted_by, counted_at) VALUES 
(1, 1, 150.000, 150.000, 'Sayım doğru', 2, '2024-01-01 10:30:00'),
(1, 2, 750.000, 748.000, 'Küçük eksik', 2, '2024-01-01 10:45:00'),
(1, 3, 1200.000, 1205.000, 'Küçük fazla', 2, '2024-01-01 11:00:00'),
(1, 11, 5400.000, 5500.000, 'Fazla bulundu', 2, '2024-01-01 11:15:00'),
(1, 12, 5250.000, 5200.000, 'Eksik bulundu', 2, '2024-01-01 11:30:00');

COMMIT;

-- Seed data yükleme tamamlandı
SELECT 'PostgreSQL Seed Data loaded successfully!' as status;
SELECT 'Toplam kullanıcı sayısı: ' || COUNT(*) as user_count FROM users;
SELECT 'Toplam ürün sayısı: ' || COUNT(*) as product_count FROM products;
SELECT 'Toplam stok hareketi: ' || COUNT(*) as movement_count FROM stock_movements;