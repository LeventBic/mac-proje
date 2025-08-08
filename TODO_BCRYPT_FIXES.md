# PostgreSQL ve Bcrypt Hash Sorunları - TODO Listesi

## 🔍 Tespit Edilen Sorunlar

### 1. Veritabanı Hash Formatı Sorunları

- [ ] **Mevcut kullanıcı hash'leri kontrol et**

  - Veritabanındaki password_hash alanlarını incele
  - Geçersiz hash formatlarını tespit et (örn: 'a/52q' ile başlayanlar)
  - Bcrypt formatında olmayan hash'leri listele

- [ ] **Hash format doğrulama fonksiyonu ekle**
  - Bcrypt hash formatını kontrol eden utility fonksiyonu
  - Hash'in '$2a$', '$2b$', '$2x$', '$2y$' ile başlayıp başlamadığını kontrol et
  - Hash uzunluğunu ve yapısını doğrula

### 2. Authentication Endpoint'leri

- [ ] **Login endpoint'ini güçlendir**

  - `backend/src/routes/auth.js` - bcrypt.compare() öncesi hash format kontrolü
  - Geçersiz hash durumunda kullanıcıya uygun hata mesajı
  - Hash format hatası durumunda admin bilgilendirmesi

- [ ] **Password değiştirme endpoint'ini güçlendir**
  - `backend/src/routes/users.js` - şifre değiştirme sırasında hash format kontrolü
  - Eski şifre doğrulama sırasında hash format kontrolü

### 3. Veritabanı Migration/Fix Scripts

- [ ] **Bozuk hash'leri tespit etme scripti**

  - Tüm kullanıcıların hash'lerini kontrol eden SQL sorgusu
  - Geçersiz hash'lere sahip kullanıcıları listeleyen rapor

- [ ] **Hash düzeltme scripti**
  - Bozuk hash'lere sahip kullanıcılar için geçici şifre oluşturma
  - Yeni bcrypt hash'leri ile güncelleme
  - Kullanıcılara şifre sıfırlama bildirimi

### 4. Utility Functions

- [ ] **Hash validation utility**

  - `backend/src/utils/hashValidator.js` oluştur
  - `isValidBcryptHash(hash)` fonksiyonu
  - `validateUserPassword(userId, password)` fonksiyonu

- [ ] **Password reset utility**
  - Güvenli geçici şifre oluşturma
  - Bcrypt ile hash'leme
  - Email bildirimi (opsiyonel)

### 5. Test ve Doğrulama

- [ ] **Test kullanıcıları oluştur**

  - Doğru bcrypt hash'li test kullanıcıları
  - Login testleri
  - Password değiştirme testleri

- [ ] **API testlerini güncelle**
  - `test_api.js` dosyasını PostgreSQL'e uyarla
  - Bcrypt hash testleri ekle
  - Authentication flow testleri

### 6. Monitoring ve Logging

- [ ] **Hash hata logları**
  - Geçersiz hash denemelerini logla
  - Başarısız authentication denemelerini izle
  - Hash format hatalarını admin'e bildir

## 🚀 Uygulama Sırası

### Faz 1: Tespit ve Analiz

1. Hash validation utility oluştur
2. Mevcut hash'leri kontrol et
3. Bozuk hash'leri tespit et

### Faz 2: Düzeltme

1. Login endpoint'ini güçlendir
2. Password değiştirme endpoint'ini güçlendir
3. Bozuk hash'leri düzelt

### Faz 3: Test ve Doğrulama

1. Test kullanıcıları oluştur
2. API testlerini çalıştır
3. Authentication flow'u test et

### Faz 4: Monitoring

1. Logging sistemi kur
2. Hash hata izleme
3. Performans monitoring

## 📝 Notlar

- **Bcrypt Hash Format**: `$2a$12$...` (60 karakter)
- **Geçersiz Format Örneği**: `a/52q...`
- **Güvenlik**: Tüm şifre işlemleri salt rounds >= 10 ile yapılmalı
- **Backward Compatibility**: Eski hash'ler için geçiş stratejisi gerekli

## ⚠️ Kritik Noktalar

1. **Production'da dikkatli olun**: Hash düzeltme işlemleri kullanıcı erişimini etkileyebilir
2. **Backup alın**: Değişiklik öncesi veritabanı backup'ı alın
3. **Test edin**: Tüm değişiklikleri development ortamında test edin
4. **Kullanıcı bildirimi**: Şifre sıfırlama durumunda kullanıcıları bilgilendirin

---

**Son Güncelleme**: $(date)
**Durum**: Başlangıç - Analiz Aşaması
