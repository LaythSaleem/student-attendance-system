#!/usr/bin/env node

const http = require('http');

async function inspectAPIData() {
    console.log('🔍 INSPECTING API DATA STRUCTURE');
    console.log('='.repeat(50));
    
    // Get auth token
    const loginResponse = await new Promise((resolve, reject) => {
        const loginData = JSON.stringify({
            email: 'admin@school.com',
            password: 'admin123'
        });
        
        const options = {
            hostname: 'localhost',
            port: 8888,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(loginData);
        req.end();
    });
    
    if (!loginResponse.token) {
        console.log('❌ Authentication failed');
        return;
    }
    
    console.log('✅ Authentication successful\n');
    
    // Test available-topics API (causing stage.topics.map error)
    console.log('📊 AVAILABLE TOPICS API STRUCTURE:');
    console.log('-'.repeat(40));
    
    const topicsData = await new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8888,
            path: '/api/teachers/available-topics',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginResponse.token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Invalid JSON', raw: data });
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
    
    console.log('Sample data structure:');
    console.log(JSON.stringify(topicsData.slice(0, 2), null, 2));
    
    if (Array.isArray(topicsData) && topicsData.length > 0) {
        const first = topicsData[0];
        console.log('\nFirst item properties:', Object.keys(first));
        
        if (first.topics) {
            console.log('✅ Has "topics" property');
            console.log('Topics type:', Array.isArray(first.topics) ? 'Array' : typeof first.topics);
        } else {
            console.log('❌ Missing "topics" property');
        }
    }
    
    // Test users API (causing user.status.toUpperCase error)
    console.log('\n📊 USERS API STRUCTURE:');
    console.log('-'.repeat(40));
    
    const usersData = await new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8888,
            path: '/api/users',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginResponse.token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Invalid JSON', raw: data });
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
    
    console.log('Sample data structure:');
    console.log(JSON.stringify(usersData.slice(0, 2), null, 2));
    
    if (Array.isArray(usersData) && usersData.length > 0) {
        const first = usersData[0];
        console.log('\nFirst user properties:', Object.keys(first));
        
        if (first.status) {
            console.log('✅ Has "status" property:', first.status);
        } else {
            console.log('❌ Missing "status" property');
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 ANALYSIS COMPLETE');
    console.log('This will help identify the exact data structure issues');
}

inspectAPIData().catch(console.error);
