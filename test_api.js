const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const axios = require('axios');

async function testAPI() {
  try {
    // Database bağlantısı
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'mysql123',
      database: 'inflow_db'
    });

    console.log('🔗 Database bağlantısı kuruldu');

    // Test kullanıcısı oluştur
    const hashedPassword = bcrypt.hashSync('test123', 10);
    
    await connection.execute(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      ['testuser', 'test@test.com', hashedPassword, 'Test', 'User', 'admin']
    );

    console.log('✅ Test kullanıcısı oluşturuldu');

    // Login test
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'testuser',
      password: 'test123'
    });

    const token = loginResponse.data.token;
    console.log('🔑 Login başarılı, token alındı');

    // Products API test
    const productsResponse = await axios.get('http://localhost:3001/api/products?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📦 Products API test başarılı:');
    console.log('Total products:', productsResponse.data.pagination?.total || 0);
    console.log('Products count:', productsResponse.data.data?.products?.length || 0);

    // Yeni ürün ekleme test
    const newProduct = {
      sku: 'TEST-001',
      name: 'Test Ürün',
      description: 'API test için oluşturulan ürün',
      unitPrice: 100.50,
      costPrice: 75.25,
      unit: 'pcs',
      minStockLevel: 10,
      maxStockLevel: 100,
      isRawMaterial: false,
      isFinishedProduct: true
    };

    const createResponse = await axios.post('http://localhost:3001/api/products', newProduct, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Yeni ürün oluşturuldu:', createResponse.data.data.product.name);
    console.log('🆔 Ürün ID:', createResponse.data.data.product.id);

    await connection.end();
    console.log('🎉 Tüm testler başarılı!');

  } catch (error) {
    console.error('❌ Test hatası:', error.response?.data || error.message);
  }
}

testAPI();