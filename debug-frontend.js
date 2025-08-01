// Frontend Debug Script
// Bu script frontend'deki potansiyel sorunları tespit etmek için kullanılır

const axios = require('axios');

// Test 1: Backend API erişilebilirliği
async function testBackendAPI() {
    console.log('\n=== Backend API Test ===');
    try {
        const response = await axios.post('http://localhost:3002/api/auth/login', {
            username: 'admin',
            password: 'admin2024'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3001'
            },
            timeout: 5000
        });
        
        console.log('✅ Backend API accessible');
        console.log('Status:', response.status);
        console.log('Token received:', !!response.data.token);
        return true;
    } catch (error) {
        console.log('❌ Backend API error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data?.message || 'Unknown error');
        } else if (error.request) {
            console.log('Network error - no response received');
        } else {
            console.log('Error:', error.message);
        }
        return false;
    }
}

// Test 2: Frontend erişilebilirliği
async function testFrontendAccess() {
    console.log('\n=== Frontend Access Test ===');
    try {
        const response = await axios.get('http://localhost:3001', {
            timeout: 5000
        });
        
        console.log('✅ Frontend accessible');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        
        // Check if it's a React app
        const isReactApp = response.data.includes('react') || 
                          response.data.includes('React') ||
                          response.data.includes('root');
        console.log('Appears to be React app:', isReactApp);
        
        return true;
    } catch (error) {
        console.log('❌ Frontend access error:');
        console.log('Error:', error.message);
        return false;
    }
}

// Test 3: CORS Test
async function testCORS() {
    console.log('\n=== CORS Test ===');
    try {
        const response = await axios.options('http://localhost:3002/api/auth/login', {
            headers: {
                'Origin': 'http://localhost:3001',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            timeout: 5000
        });
        
        console.log('✅ CORS preflight successful');
        console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
        console.log('Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
        return true;
    } catch (error) {
        console.log('❌ CORS preflight failed:');
        console.log('Error:', error.message);
        return false;
    }
}

// Ana test fonksiyonu
async function runDiagnostics() {
    console.log('🔍 Frontend Login Diagnostics Starting...');
    console.log('Time:', new Date().toISOString());
    
    const backendOK = await testBackendAPI();
    const frontendOK = await testFrontendAccess();
    const corsOK = await testCORS();
    
    console.log('\n=== Summary ===');
    console.log('Backend API:', backendOK ? '✅ OK' : '❌ FAILED');
    console.log('Frontend Access:', frontendOK ? '✅ OK' : '❌ FAILED');
    console.log('CORS:', corsOK ? '✅ OK' : '❌ FAILED');
    
    if (backendOK && frontendOK && corsOK) {
        console.log('\n🎉 All tests passed! The issue might be in the frontend JavaScript code.');
        console.log('Recommendations:');
        console.log('1. Check browser console for JavaScript errors');
        console.log('2. Verify Redux state management');
        console.log('3. Check React component rendering');
    } else {
        console.log('\n⚠️  Some tests failed. Fix these issues first.');
    }
}

// Script çalıştır
runDiagnostics().catch(console.error);