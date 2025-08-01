/**
 * Sayısal değerleri Türk formatında para birimi ile formatlar
 * Örnek: 1234.56 -> "1.234,56 ₺"
 * @param {number|string} value - Formatlanacak değer
 * @param {number} decimals - Ondalık basamak sayısı (varsayılan: 2)
 * @returns {string} Formatlanmış değer
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') {
    return '0,00 ₺';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0,00 ₺';
  }

  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);

  return `${formatted} ₺`;
};

/**
 * Sayısal değerleri Türk formatında formatlar (para birimi olmadan)
 * @param {number|string} value - Formatlanacak değer
 * @param {number} decimals - Ondalık basamak sayısı (varsayılan: 2)
 * @returns {string} Formatlanmış değer
 */
export const formatNumber = (value, decimals = 2) => {
  return formatCurrency(value, decimals);
};

/**
 * Miktar değerlerini formatlar (genellikle ondalık olmayan)
 * @param {number|string} value - Formatlanacak değer
 * @returns {string} Formatlanmış değer
 */
export const formatQuantity = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0';
  }

  // Eğer tam sayı ise ondalık gösterme
  if (num % 1 === 0) {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }

  // Ondalıklı ise 2 basamak göster
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Formatlanmış string'i sayıya çevirir
 * Örnek: "1.234,56" -> 1234.56
 * @param {string} formattedValue - Formatlanmış değer
 * @returns {number} Sayısal değer
 */
export const parseFormattedNumber = (formattedValue) => {
  if (!formattedValue || typeof formattedValue !== 'string') {
    return 0;
  }

  // Türk formatından standart formata çevir
  const cleanValue = formattedValue
    .replace(/\./g, '') // Binlik ayırıcıları kaldır
    .replace(',', '.'); // Ondalık virgülü noktaya çevir

  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
};

/**
 * Herhangi bir formattaki sayısal veriyi Türkiye formatına çevirir (para birimi sembolü olmadan)
 * Desteklenen formatlar:
 * - Sayılar: 15000, 15000.5, -1500
 * - Türk formatı: "15.000,50", "1.500,00"
 * - İngiliz formatı: "15,000.50", "1,500.00"
 * - Para birimleri: "₺15000", "$15,000.50", "€1.500,50"
 * - Yüzdeler: "15%", "15.5%"
 * - Bilimsel notasyon: "1.5e4", "1.5E+4"
 * 
 * @param {number|string} value - Formatlanacak değer
 * @param {number} decimals - Ondalık basamak sayısı (varsayılan: 2)
 * @returns {string} Türk formatında formatlanmış sayı (15.000,50)
 */
export const formatPriceTR = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') {
    return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0';
  }

  let cleanValue = value;
  
  // String ise temizleme işlemleri
  if (typeof value === 'string') {
    // Boşlukları temizle
    cleanValue = value.trim();
    
    // Para birimi sembollerini kaldır (₺, $, €, £, ¥, vb.)
    cleanValue = cleanValue.replace(/[₺$€£¥¢₹₽₩₪₦₡₨₵₴₸₼₾]/g, '');
    
    // Yüzde işaretini kaldır
    cleanValue = cleanValue.replace(/%/g, '');
    
    // Parantez içindeki negatif sayıları düzelt: (1,500) -> -1,500
    if (cleanValue.match(/^\(.*\)$/)) {
      cleanValue = '-' + cleanValue.replace(/[()]/g, '');
    }
    
    // Bilimsel notasyonu kontrol et
    if (cleanValue.match(/e[+-]?\d+/i)) {
      const num = parseFloat(cleanValue);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('tr-TR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(num);
      }
    }
    
    // Format tespiti ve dönüştürme
    // Türk formatı kontrolü: 15.000,50 (nokta binlik, virgül ondalık)
    if (cleanValue.match(/^-?\d{1,3}(\.\d{3})*(,\d+)?$/)) {
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    }
    // İngiliz formatı kontrolü: 15,000.50 (virgül binlik, nokta ondalık)
    else if (cleanValue.match(/^-?\d{1,3}(,\d{3})*(\.\d+)?$/)) {
      cleanValue = cleanValue.replace(/,/g, '');
    }
    // Sadece virgül var (ondalık ayırıcı olarak): 1500,50
    else if (cleanValue.match(/^-?\d+,\d+$/) && !cleanValue.match(/,\d{3}/)) {
      cleanValue = cleanValue.replace(',', '.');
    }
    // Diğer karakterleri temizle
    else {
      cleanValue = cleanValue.replace(/[^0-9.,-]/g, '');
      // Eğer hem nokta hem virgül varsa, son olanı ondalık kabul et
      const lastDot = cleanValue.lastIndexOf('.');
      const lastComma = cleanValue.lastIndexOf(',');
      
      if (lastDot > -1 && lastComma > -1) {
        if (lastDot > lastComma) {
          // Nokta son ise, virgülleri kaldır
          cleanValue = cleanValue.replace(/,/g, '');
        } else {
          // Virgül son ise, noktaları kaldır ve virgülü noktaya çevir
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
      } else if (lastComma > -1) {
        // Sadece virgül var
        cleanValue = cleanValue.replace(',', '.');
      }
    }
  }

  const num = typeof cleanValue === 'string' ? parseFloat(cleanValue) : cleanValue;
  
  if (isNaN(num)) {
    return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0';
  }

  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};
