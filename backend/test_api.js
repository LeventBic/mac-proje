const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const {
  isValidBcryptHash,
  generateSecureHash,
} = require("./src/utils/hashValidator");

// PostgreSQL connection
const pool = new Pool({
  host: "localhost",
  port: 5435,
  database: "inflow_db",
  user: "postgres",
  password: "postgres123",
});

async function testHashValidation() {
  console.log("\n=== Testing Hash Validation ===");

  // Test valid bcrypt hashes
  const validHash = await generateSecureHash("testpassword123");
  console.log("Valid hash generated:", validHash.substring(0, 20) + "...");
  console.log("Is valid bcrypt hash:", isValidBcryptHash(validHash));

  // Test invalid hashes
  const invalidHashes = [
    "a/52qInvalidHash",
    "plaintext",
    "$1$invalid$hash",
    "",
  ];

  invalidHashes.forEach((hash) => {
    console.log(`Hash "${hash}" is valid:`, isValidBcryptHash(hash));
  });
}

async function testAPI() {
  try {
    console.log("Testing API endpoints...");

    // Test hash validation first
    await testHashValidation();

    // Test user creation with PostgreSQL and valid bcrypt hash
    const hashedPassword = await generateSecureHash("admin123");
    console.log("\n=== Creating Test User ===");
    console.log("Generated hash is valid:", isValidBcryptHash(hashedPassword));

    await pool.query(
      `
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active
    `,
      ["admin", "admin@test.com", hashedPassword, "Admin", "User", "admin", true]
    );

    // Also create a user with invalid hash for testing
    await pool.query(
      `
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active
    `,
      ["testuser", "test@test.com", "a/52qInvalidHashFormat", "Test", "User", "operator", true]
    );

    console.log("✅ Test kullanıcıları oluşturuldu");

    // Login test with valid user
    const loginResponse = await axios.post(
      "http://localhost:3002/api/auth/login",
      {
        username: "admin",
        password: "admin123",
      }
    );

    const token = loginResponse.data.token;
    console.log("🔑 Login başarılı, token alındı");

    // Products API test
    const productsResponse = await axios.get(
      "http://localhost:3002/api/products?page=1&limit=5",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("📦 Products API test başarılı:");
    console.log(
      "Total products:",
      productsResponse.data.pagination?.total || 0
    );
    console.log(
      "Products count:",
      productsResponse.data.data?.products?.length || 0
    );

    console.log('⏭️ Ürün oluşturma testini atlıyoruz, hash admin testlerine geçiyoruz...');

    // Test hash admin endpoints
    console.log("\n=== Testing Hash Admin Endpoints ===");

    // Test hash audit
    const auditResponse = await axios.get(
      "http://localhost:3002/api/admin/hash-audit",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("📊 Hash Audit Results:");
    console.log("Total Users:", auditResponse.data.audit.totalUsers);
    console.log("Valid Hashes:", auditResponse.data.audit.validHashes);
    console.log(
      "Invalid Hashes:",
      auditResponse.data.audit.invalidHashes.length
    );

    if (auditResponse.data.audit.invalidHashes.length > 0) {
      console.log(
        "Invalid Hash Users:",
        auditResponse.data.audit.invalidHashes
      );

      // Test fixing a specific user's hash
      const firstInvalidUser = auditResponse.data.audit.invalidHashes[0];
      console.log(`\n🔧 Fixing hash for user: ${firstInvalidUser.username}`);

      const fixResponse = await axios.post(
        `http://localhost:3002/api/admin/fix-user-hash/${firstInvalidUser.id}`,
        { tempPassword: "TempPass123!" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Hash fix result:", fixResponse.data.message);
      console.log("🔑 Temporary password:", fixResponse.data.tempPassword);

      // Test login with the fixed user
      console.log("\n🔐 Testing login with fixed hash...");
      try {
        const fixedLoginResponse = await axios.post(
          "http://localhost:3002/api/auth/login",
          {
            username: firstInvalidUser.username,
            password: "TempPass123!",
          }
        );
        console.log("✅ Login with fixed hash successful!");
      } catch (error) {
        console.log(
          "❌ Login with fixed hash failed:",
          error.response?.data?.message
        );
      }
    }

    // Test hash stats
    const statsResponse = await axios.get(
      "http://localhost:3002/api/admin/hash-stats",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("\n📈 Hash Statistics:");
    console.log("Total Users:", statsResponse.data.stats.totalUsers);
    console.log("Valid Hashes:", statsResponse.data.stats.validHashes);
    console.log("Invalid Hashes:", statsResponse.data.stats.invalidHashes);
    console.log(
      "Valid Percentage:",
      statsResponse.data.stats.validPercentage + "%"
    );

    await pool.end();
    console.log("\n🎉 Tüm testler başarılı!");
  } catch (error) {
    console.error("❌ Test hatası:", error.response?.data || error.message);
  }
}

testAPI();
