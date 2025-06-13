// Settings Debug Helper
// Run this in the browser console on the main application page

async function debugSystemSettings() {
    console.log('🔍 Debugging System Settings Access...');
    
    // Check token
    const token = localStorage.getItem('auth_token'); // Fixed: Use correct token key
    console.log('📋 Token exists:', !!token);
    if (token) {
        console.log('📋 Token length:', token.length);
        console.log('📋 Token preview:', token.substring(0, 30) + '...');
        
        // Decode token to check expiry and role
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('📋 Token payload:', payload);
            
            const expiry = new Date(payload.exp * 1000);
            const now = new Date();
            console.log('📋 Token expires:', expiry.toLocaleString());
            console.log('📋 Current time:', now.toLocaleString());
            console.log('📋 Token valid:', expiry > now);
            console.log('📋 User role:', payload.role);
        } catch (e) {
            console.log('❌ Error decoding token:', e);
        }
    }
    
    // Test API endpoints
    console.log('\n🌐 Testing API endpoints...');
    
    try {
        // Test basic API connectivity
        console.log('1. Testing basic API connectivity...');
        const healthResponse = await fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Profile API status:', healthResponse.status);
        
        if (healthResponse.ok) {
            const profile = await healthResponse.json();
            console.log('   Profile data:', profile);
        }
        
        // Test settings API specifically
        console.log('\n2. Testing settings API...');
        const settingsResponse = await fetch('/api/settings', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('   Settings API status:', settingsResponse.status);
        console.log('   Settings API headers:', Object.fromEntries(settingsResponse.headers));
        
        if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            console.log('✅ Settings API working!');
            console.log('   Categories:', Object.keys(settings));
            console.log('   Total settings:', Object.values(settings).reduce((acc, cat) => acc + Object.keys(cat).length, 0));
        } else {
            const errorText = await settingsResponse.text();
            console.log('❌ Settings API failed');
            console.log('   Error:', errorText);
        }
        
    } catch (error) {
        console.log('❌ Network error:', error);
    }
    
    console.log('\n🔧 Suggested fixes:');
    console.log('1. If token is missing/expired: Refresh page and login again');
    console.log('2. If role is not admin: Ensure you are logged in as admin@school.com');
    console.log('3. If API returns 401/403: Clear localStorage and login again');
    console.log('4. If network error: Check if backend server is running');
}

// Auto-run the debug
debugSystemSettings();
