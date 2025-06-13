import { useState, useEffect } from 'react';

export const ClassesDebugTest = () => {
  const [status, setStatus] = useState('Starting...');
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testAuthentication = async () => {
    try {
      addResult('Testing authentication...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        addResult('❌ No auth token found');
        return false;
      }
      addResult('✅ Auth token found');
      return true;
    } catch (error) {
      addResult(`❌ Auth test error: ${error}`);
      return false;
    }
  };

  const testClassesAPI = async () => {
    try {
      addResult('Testing classes API...');
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        addResult(`❌ API error: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      addResult(`✅ API working: ${data.length} classes found`);
      return true;
    } catch (error) {
      addResult(`❌ API test error: ${error}`);
      return false;
    }
  };

  const testCreateClass = async () => {
    try {
      addResult('Testing create class...');
      const token = localStorage.getItem('auth_token');
      
      const classData = {
        name: 'Test Class Debug',
        section: 'TD',
        description: 'Debug test class',
        teacher_id: 'b299ebb2-56ec-4654-a1ed-928dd5ce9490',
        academic_year_id: 'ce79f9cc-3d93-4144-8282-21600c72d0d4',
        capacity: 30
      };

      addResult(`Class data: ${JSON.stringify(classData)}`);

      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        addResult(`❌ Create error: ${response.status} ${errorText}`);
        return false;
      }

      const data = await response.json();
      addResult(`✅ Class created: ${data.id}`);
      
      // Delete the test class
      const deleteResponse = await fetch(`/api/classes/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        addResult(`✅ Test class deleted`);
      }

      return true;
    } catch (error) {
      addResult(`❌ Create test error: ${error}`);
      return false;
    }
  };

  const runTests = async () => {
    setResults([]);
    setStatus('Running tests...');
    
    const authOk = await testAuthentication();
    if (!authOk) {
      setStatus('❌ Authentication failed');
      return;
    }

    const apiOk = await testClassesAPI();
    if (!apiOk) {
      setStatus('❌ API test failed');
      return;
    }

    const createOk = await testCreateClass();
    if (!createOk) {
      setStatus('❌ Create test failed');
      return;
    }

    setStatus('✅ All tests passed!');
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Classes API Debug Test</h2>
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <div key={index} className="mb-1">{result}</div>
        ))}
      </div>
      <button 
        onClick={runTests}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Run Tests Again
      </button>
    </div>
  );
};
