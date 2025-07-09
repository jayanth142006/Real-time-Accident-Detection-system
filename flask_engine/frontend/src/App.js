import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [report, setReport] = useState('');
  const [summary, setSummary] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Detecting accidents...');
  const [address,setAddress]=useState('');
  const handleChange = (e) => {
    setAddress(e.target.value);
  };

  const handleSubmit = () => {
    alert(`You entered: ${address}`);
  };
  useEffect(() => {
  let timers = [];

  if (loading) {
    setLoadingMessage('Detecting accidents...');

    timers.push(setTimeout(() => {
      setLoadingMessage('Detecting severity...');
    }, 25000));

    timers.push(setTimeout(() => {
      setLoadingMessage('Generating report...');
    }, 45000));
  }

  return () => {
    // Clear all timers on cleanup
    timers.forEach(clearTimeout);
  };
}, [loading]);


  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
    setReport('');
    setSummary('');
    setImages([]);
  };

  const handleUpload = async () => {
  if (!videoFile || !address.trim()) {
    alert("Please select a video and enter the address.");
    return;
  }

  setLoading(true);

  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('address', address);  // ✅ Pass address

  try {
    const res = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.error) {
      alert("Error: " + data.error);
      setLoading(false);
      return;
    }

    setReport(data.report);
    setSummary(data.summary);
    setImages(data.images);
  } catch (err) {
    alert("Upload failed. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="App" style={{ maxWidth: 800, margin: '20px auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>🚗 Accident Detection System</h1>

      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ marginBottom: 10 }}
        />
        <br />
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 5,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : 'Upload Video'}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div className="spinner" style={{
            border: '6px solid #f3f3f3',
            borderTop: '6px solid #3498db',
            borderRadius: '50%',
            width: 40,
            height: 40,
            margin: 'auto',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: 10, fontWeight: 'bold' }}>{loadingMessage}</p>
        </div>
      )}

      {!loading && images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {images.map((img, i) => (
            <img
              key={i}
              src={`http://localhost:5000${img}`}
              alt={`frame-${i}`}
              style={{ maxWidth: 400, borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
            />
          ))}
        </div>
      )}
    <div style={{ padding: '20px' }}>
      <input
        type="text"
        value={address}
        onChange={handleChange}
        placeholder="Enter accident address"
        style={{ padding: '10px', fontSize: '16px' }}
      />
      <button onClick={handleSubmit} style={{ marginLeft: '10px', padding: '10px 20px' }}>
        Submit
      </button>
    </div>

      {!loading && report && (
        <div style={{
          background: '#f9f9f9',
          padding: 20,
          borderRadius: 8,
          marginTop: 30,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: 10 }}>📋 Report</h2>
          <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{report}</pre>
        </div>
      )}

      {!loading && summary && (
        <div style={{
          background: '#f4f4f4',
          padding: 20,
          borderRadius: 8,
          marginTop: 30,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: 10 }}>📝 Summary</h2>
          <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{summary}</pre>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
}

export default App;
