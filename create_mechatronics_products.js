const axios = require('axios');

// API base URL
const API_BASE = 'http://localhost:3002/api';

// Login credentials
const LOGIN_DATA = {
  username: 'levent2',
  password: '20202020'
};

// Category and supplier mappings
const CATEGORIES = {
  SENSORS: 7,
  ACTUATORS: 8,
  CONTROLLERS: 9,
  ELECTRONICS: 10,
  MECHATRONICS: 11
};

const SUPPLIERS = {
  SIEMENS: 6,
  SCHNEIDER: 7,
  OMRON: 8,
  FESTO: 9,
  BOSCH: 10
};

// Login function
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, LOGIN_DATA);
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Create product function
async function createProduct(token, productData) {
  try {
    const response = await axios.post(`${API_BASE}/products`, productData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Product creation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Main function to create all products
async function createAllProducts() {
  try {
    console.log('Logging in...');
    const token = await login();
    console.log('Login successful!');

    console.log('Creating 100 mechatronics products...');
    
    // Create products in batches to avoid overwhelming the server
    for (let i = 0; i < 100; i++) {
      const productData = generateProduct(i + 1);
      try {
        console.log(`Creating product ${i + 1}/100: ${productData.name}`);
        await createProduct(token, productData);
        console.log(`✓ Created: ${productData.name}`);
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`✗ Failed to create ${productData.name}:`, error.message);
      }
    }
    
    console.log('All products creation process completed!');
  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Generate product data
function generateProduct(index) {
  const categories = Object.values(CATEGORIES);
  const suppliers = Object.values(SUPPLIERS);
  
  const categoryId = categories[index % categories.length];
  const supplierId = suppliers[index % suppliers.length];
  
  const productTypes = [
    'Proximity Sensor', 'Temperature Sensor', 'Pressure Sensor', 'Flow Sensor', 'Level Sensor',
    'Servo Motor', 'Stepper Motor', 'Linear Actuator', 'Pneumatic Cylinder', 'Solenoid Valve',
    'PLC Controller', 'HMI Panel', 'Motor Driver', 'Frequency Inverter', 'Safety Relay',
    'Resistor Pack', 'Capacitor Bank', 'Transistor Module', 'LED Array', 'Connector Set',
    'Robot Arm', 'Conveyor System', 'Pick and Place', 'Vision System', 'Assembly Station'
  ];
  
  const specifications = [
    'Industrial Grade', 'High Precision', 'Heavy Duty', 'Compact Design', 'Energy Efficient',
    'Waterproof IP67', 'Temperature Resistant', 'Vibration Proof', 'EMC Compliant', 'CE Certified'
  ];
  
  const productType = productTypes[index % productTypes.length];
  const spec = specifications[index % specifications.length];
  
  const basePrice = Math.floor(Math.random() * 2000) + 50;
  const purchasePrice = Math.floor(basePrice * 0.75);
  
  return {
    name: `${productType} ${spec} MK-${String(index).padStart(3, '0')}`,
    sku: `MECH-${String(index).padStart(3, '0')}`,
    description: `Professional ${productType.toLowerCase()} with ${spec.toLowerCase()} features for industrial automation applications`,
    category_id: categoryId,
    supplier_id: supplierId,
    unit_price: basePrice,
    purchase_price: purchasePrice,
    barcode: `789123456${String(7000 + index).padStart(4, '0')}`,
    min_stock_level: Math.floor(Math.random() * 20) + 5,
    max_stock_level: Math.floor(Math.random() * 100) + 50,
    is_popular: index <= 20 // First 20 products are popular
  };
}

// Run the script
createAllProducts();

module.exports = {
  createAllProducts,
  generateProduct
};