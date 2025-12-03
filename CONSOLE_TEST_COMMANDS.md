# Browser Console Test Commands

## 1. Health Check (Simple Test)
```javascript
fetch('https://sih-krishi-mithr.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 2. Root Endpoint Test
```javascript
fetch('https://sih-krishi-mithr.onrender.com/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 3. Market Prices Endpoint (With Full Response Details)
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/market-prices?location=Telangana')
  .then(async (response) => {
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    const data = await response.json();
    console.log('Data:', data);
    return data;
  })
  .catch(console.error)
```

## 4. Check CORS Headers
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/market-prices?location=Telangana', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(async (response) => {
    console.log('CORS Headers:');
    console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    console.log('Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => console.log('Response Data:', data))
  .catch(error => console.error('Error:', error))
```

## 5. Test OPTIONS Preflight Request
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/market-prices?location=Telangana', {
  method: 'OPTIONS'
})
  .then(response => {
    console.log('OPTIONS Status:', response.status);
    console.log('OPTIONS Headers:', Object.fromEntries(response.headers.entries()));
  })
  .catch(console.error)
```

## 6. Market Prices Trends Endpoint
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/market-prices/trends?location=Telangana&days=7')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 7. Weather Endpoint Test
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/weather/current?location=Hyderabad')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 8. Complete Test Suite (Run All Tests)
```javascript
async function testBackend() {
  const baseUrl = 'https://sih-krishi-mithr.onrender.com';
  
  const tests = [
    { name: 'Health Check', url: `${baseUrl}/health` },
    { name: 'Root', url: `${baseUrl}/` },
    { name: 'Market Prices', url: `${baseUrl}/api/market-prices?location=Telangana` },
    { name: 'Market Trends', url: `${baseUrl}/api/market-prices/trends?location=Telangana` }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      const response = await fetch(test.url);
      console.log(`✅ Status: ${response.status}`);
      const data = await response.json();
      console.log(`📦 Data:`, data);
      
      // Check CORS headers
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      console.log(`🌐 CORS Origin: ${corsOrigin || 'NOT SET'}`);
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
    }
  }
}

// Run the tests
testBackend();
```

## Quick One-Liner Tests

**Health Check:**
```javascript
fetch('https://sih-krishi-mithr.onrender.com/health').then(r=>r.json()).then(console.log)
```

**Market Prices:**
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/market-prices?location=Telangana').then(r=>r.json()).then(console.log)
```

**Check if CORS is working:**
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/market-prices?location=Telangana').then(r=>{console.log('Status:',r.status,'CORS:',r.headers.get('Access-Control-Allow-Origin'));return r.json()}).then(console.log)
```




