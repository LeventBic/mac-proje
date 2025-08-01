// formatPriceTR fonksiyonu test dosyası
import { formatPriceTR } from './formatters.js';

// Test örnekleri
console.log('=== formatPriceTR Test Örnekleri ===');

// Sayılar
console.log('Sayılar:');
console.log('15000 ->', formatPriceTR(15000));
console.log('15000.5 ->', formatPriceTR(15000.5));
console.log('-1500 ->', formatPriceTR(-1500));

// Türk formatı
console.log('\nTürk formatı:');
console.log('"15.000,50" ->', formatPriceTR('15.000,50'));
console.log('"1.500,00" ->', formatPriceTR('1.500,00'));

// İngiliz formatı
console.log('\nİngiliz formatı:');
console.log('"15,000.50" ->', formatPriceTR('15,000.50'));
console.log('"1,500.00" ->', formatPriceTR('1,500.00'));

// Para birimleri
console.log('\nPara birimleri:');
console.log('"₺15000" ->', formatPriceTR('₺15000'));
console.log('"$15,000.50" ->', formatPriceTR('$15,000.50'));
console.log('"€1.500,50" ->', formatPriceTR('€1.500,50'));

// Yüzdeler
console.log('\nYüzdeler:');
console.log('"15%" ->', formatPriceTR('15%'));
console.log('"15.5%" ->', formatPriceTR('15.5%'));

// Bilimsel notasyon
console.log('\nBilimsel notasyon:');
console.log('"1.5e4" ->', formatPriceTR('1.5e4'));
console.log('"1.5E+4" ->', formatPriceTR('1.5E+4'));

// Negatif sayılar (parantez)
console.log('\nNegatif sayılar:');
console.log('"(1,500)" ->', formatPriceTR('(1,500)'));
console.log('"(15.000,50)" ->', formatPriceTR('(15.000,50)'));

// Karışık formatlar
console.log('\nKarışık formatlar:');
console.log('"  ₺ 15,000.50  " ->', formatPriceTR('  ₺ 15,000.50  '));
console.log('"1500,50" ->', formatPriceTR('1500,50'));
console.log('"1500.50" ->', formatPriceTR('1500.50'));

// Hatalı girişler
console.log('\nHatalı girişler:');
console.log('null ->', formatPriceTR(null));
console.log('undefined ->', formatPriceTR(undefined));
console.log('"" ->', formatPriceTR(''));
console.log('"abc" ->', formatPriceTR('abc'));

console.log('\n=== Test Tamamlandı ===');