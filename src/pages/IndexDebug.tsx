
const IndexDebug = () => {
  return (
    <div style={{backgroundColor: 'red', padding: '20px', minHeight: '100vh'}}>
      <h1 style={{color: 'white', fontSize: '24px', marginBottom: '10px'}}>
        🔧 CSS DEBUG MODE
      </h1>
      <div style={{backgroundColor: 'blue', color: 'white', padding: '15px', marginBottom: '10px'}}>
        INLINE STYLES WORKING - This should be blue with white text
      </div>
      
      <div className="bg-red-500 text-white p-4 mb-4">
        TAILWIND TEST 1 - Should be red background
      </div>
      
      <div className="bg-blue-600 text-white p-4 mb-4">
        TAILWIND TEST 2 - Should be blue background  
      </div>
      
      <div className="bg-green-500 text-black p-4 mb-4">
        TAILWIND TEST 3 - Should be green background
      </div>
      
      <div className="flex items-center justify-center p-4 bg-white">
        <div className="text-gray-800">TAILWIND LAYOUT TEST - Should be centered</div>
      </div>
    </div>
  );
};

export default IndexDebug;
