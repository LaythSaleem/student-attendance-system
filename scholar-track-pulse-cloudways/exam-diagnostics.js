/**
 * Frontend Diagnostic Tool for Exam Creation Issue
 * 
 * This script helps diagnose frontend issues when exam creation fails
 * Run this in the browser console when experiencing the exam creation error
 */

window.ExamDiagnostics = {
  async runDiagnostics() {
    console.log('🔍 EXAM CREATION FRONTEND DIAGNOSTICS');
    console.log('====================================');
    
    const issues = [];
    const successes = [];
    
    // 1. Check Authentication Token
    console.log('\n1. 🔐 Checking Authentication...');
    const token = localStorage.getItem('auth_token');
    if (!token) {
      issues.push('❌ No auth_token found in localStorage');
      console.error('❌ No auth_token found in localStorage');
    } else {
      successes.push('✅ Auth token found in localStorage');
      console.log('✅ Auth token found in localStorage');
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
    
    // 2. Check API Connectivity
    console.log('\n2. 🌐 Testing API Connectivity...');
    try {
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch('http://localhost:3001/api/exam-types', {
        headers: authHeaders
      });
      
      if (response.ok) {
        const data = await response.json();
        successes.push(`✅ API connectivity working (${data.length} exam types)`);
        console.log(`✅ API connectivity working (${data.length} exam types)`);
      } else {
        issues.push(`❌ API responded with ${response.status}`);
        console.error(`❌ API responded with ${response.status}`);
      }
    } catch (error) {
      issues.push(`❌ API connection failed: ${error.message}`);
      console.error(`❌ API connection failed:`, error);
    }
    
    // 3. Check Form Elements
    console.log('\n3. 📝 Checking Form Elements...');
    const examForm = document.querySelector('[data-testid="exam-form"]') || 
                    document.querySelector('form') ||
                    document.querySelector('[data-form="exam"]');
    
    if (!examForm) {
      issues.push('❌ Cannot find exam form element');
      console.error('❌ Cannot find exam form element');
    } else {
      successes.push('✅ Exam form element found');
      console.log('✅ Exam form element found');
    }
    
    // 4. Check for JavaScript Errors
    console.log('\n4. 🐛 Checking for JavaScript Errors...');
    const originalError = window.onerror;
    const errors = [];
    
    window.onerror = function(msg, url, line, col, error) {
      errors.push({ msg, url, line, col, error });
      if (originalError) originalError.apply(this, arguments);
    };
    
    // 5. Test Exam Creation Function
    console.log('\n5. 🧪 Testing Exam Creation Function...');
    if (window.createExam || window.ExamsPage) {
      successes.push('✅ Exam creation functions available');
      console.log('✅ Exam creation functions available');
    } else {
      issues.push('❌ Exam creation functions not found');
      console.error('❌ Exam creation functions not found');
    }
    
    // 6. Check React/Component State
    console.log('\n6. ⚛️ Checking React Component State...');
    try {
      // Look for React components
      const reactElements = document.querySelectorAll('[data-reactroot], [data-react-root]');
      if (reactElements.length > 0) {
        successes.push('✅ React components detected');
        console.log('✅ React components detected');
      } else {
        issues.push('❓ React components not clearly detected');
        console.warn('❓ React components not clearly detected');
      }
    } catch (error) {
      issues.push(`❌ React state check failed: ${error.message}`);
      console.error('❌ React state check failed:', error);
    }
    
    // 7. Network Diagnostics
    console.log('\n7. 🌍 Network Diagnostics...');
    try {
      const testRequest = await fetch('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (testRequest.ok) {
        successes.push('✅ Network requests working');
        console.log('✅ Network requests working');
      } else {
        issues.push(`❌ Network test failed: ${testRequest.status}`);
        console.error(`❌ Network test failed: ${testRequest.status}`);
      }
    } catch (error) {
      issues.push(`❌ Network error: ${error.message}`);
      console.error(`❌ Network error:`, error);
    }
    
    // 8. Check Browser Console for Errors
    console.log('\n8. 📋 Summary...');
    console.log('\n✅ WORKING COMPONENTS:');
    successes.forEach(success => console.log(success));
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(issue));
    }
    
    console.log('\n💡 DIAGNOSTIC RECOMMENDATIONS:');
    
    if (issues.some(i => i.includes('auth_token'))) {
      console.log('🔐 Authentication Issue: Please log out and log back in');
    }
    
    if (issues.some(i => i.includes('API'))) {
      console.log('🌐 API Issue: Check if backend server is running on port 3001');
    }
    
    if (issues.some(i => i.includes('form'))) {
      console.log('📝 Form Issue: Check if you are on the correct Exams page');
    }
    
    if (issues.some(i => i.includes('Network'))) {
      console.log('🌍 Network Issue: Check browser network tab for blocked requests');
    }
    
    console.log('\n🔧 MANUAL TESTS TO TRY:');
    console.log('1. Open Network tab in DevTools');
    console.log('2. Try to create an exam');
    console.log('3. Look for any failed requests (red entries)');
    console.log('4. Check the Console tab for error messages');
    console.log('5. Verify you are logged in as admin');
    
    return { issues, successes };
  },
  
  // Quick test for exam creation
  async testExamCreation() {
    console.log('🧪 QUICK EXAM CREATION TEST');
    console.log('===========================');
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No authentication token found');
      return false;
    }
    
    try {
      const testData = {
        exam_type_id: 'test-type',
        class_id: 'test-class',
        topic_id: null,
        title: 'Diagnostic Test Exam',
        description: 'Testing from console',
        date: '2025-07-15',
        start_time: '09:00',
        end_time: '11:00',
        duration_minutes: 120,
        total_marks: 100,
        pass_marks: 40
      };
      
      const response = await fetch('http://localhost:3001/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Test exam creation successful:', result);
      
      // Clean up
      await fetch(`http://localhost:3001/api/exams/${result.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  }
};

// Auto-run diagnostics
console.log('🔧 Exam Creation Diagnostics Tool Loaded');
console.log('Run ExamDiagnostics.runDiagnostics() to diagnose issues');
console.log('Run ExamDiagnostics.testExamCreation() for a quick test');
