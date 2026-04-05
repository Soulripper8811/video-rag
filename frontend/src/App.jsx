import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [videoFile, setVideoFile] = useState('');
  const [audioFile, setAudioFile] = useState('');
  const [query, setQuery] = useState('');
  
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Welcome! Drop a video or audio file in the backend `videos` folder, ingest it here, and ask me anything." }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(null); // 'video' | 'audio' | null
  
  const historyRef = useRef(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleIngest = async (type) => {
    const filename = type === 'video' ? videoFile : audioFile;
    if (!filename) return alert("Please enter a filename.");
    
    setIngesting(type);
    
    try {
      const endpoint = type === 'video' ? '/api/ingest' : '/api/ingest-audio';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to ingest");
      
      setMessages(p => [...p, { role: 'ai', content: `🎉 Success! ${filename} has been fully indexed. You can now ask questions.`}]);
    } catch (err) {
      setMessages(p => [...p, { role: 'ai', content: `❌ Error ingesting ${filename}: ${err.message}`}]);
    } finally {
      setIngesting(null);
    }
  }

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    
    const userMessage = query.trim();
    setQuery('');
    setMessages(p => [...p, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to query");
      
      setMessages(p => [...p, { role: 'ai', content: data.answer }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'ai', content: `❌ Error querying: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  // Parses response text to highlight timestamps like [00:15 - 00:30]
  const formatText = (text) => {
    const parts = text.split(/(\[\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})?\])/g);
    return parts.map((part, i) => {
      if (part.match(/^\[\d{2}:\d{2}/)) {
        return <code key={i}>{part}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation & Controls */}
      <aside className="sidebar glass-panel fade-in">
        <div className="brand">
          <h1>Video & Audio RAG</h1>
          <p>Powered by Gemini 2.5 Flash</p>
        </div>

        <div className="ingest-card">
          <h2>📼 Ingest Video</h2>
          <p>Provide an .mp4 located in `/videos`</p>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. sample.mp4" 
            value={videoFile}
            onChange={(e) => setVideoFile(e.target.value)}
          />
          <button 
            className="btn-primary" 
            onClick={() => handleIngest('video')}
            disabled={ingesting !== null}
          >
            {ingesting === 'video' ? <span className="spinner" /> : "Extract & Index Video"}
          </button>
        </div>

        <div className="ingest-card" style={{ animationDelay: "0.1s" }}>
          <h2>🎵 Ingest Audio</h2>
          <p>Provide a .wav or .mp3 in `/videos`</p>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. podcast.wav" 
            value={audioFile}
            onChange={(e) => setAudioFile(e.target.value)}
          />
          <button 
            className="btn-primary" 
            onClick={() => handleIngest('audio')}
            disabled={ingesting !== null}
          >
            {ingesting === 'audio' ? <span className="spinner" /> : "Index Raw Audio"}
          </button>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="chat-area glass-panel fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="chat-history" ref={historyRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role} fade-in`}>
              <div className="bubble">
                {msg.role === 'ai' ? formatText(msg.content) : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message ai fade-in">
              <div className="bubble" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--accent-primary)'}} />
                Synthesizing response...
              </div>
            </div>
          )}
        </div>

        <form className="chat-input-container" onSubmit={handleQuery}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Ask a question about your media..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-submit-btn" disabled={loading || !query.trim()}>
            ➤
          </button>
        </form>
      </main>
    </div>
  )
}

export default App
