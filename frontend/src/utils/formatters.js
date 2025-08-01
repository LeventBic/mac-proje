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