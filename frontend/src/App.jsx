// src/App.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

function saveToken(token){ localStorage.setItem("sa_token", token); }
function getToken(){ return localStorage.getItem("sa_token"); }
function clearToken(){ localStorage.removeItem("sa_token"); }

export default function App(){
  const [view, setView] = useState("login"); // login | register | dashboard
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(()=> {
    if(getToken()) {
      fetchProfileAndHistory();
      setView("dashboard");
    }
  }, []);

  async function fetchProfileAndHistory(){
    try {
      const token = getToken();
      if(!token) return;
      // we stored name at login/register too; skip profile endpoint for brevity
      const hist = await axios.get(API + "/history", { headers: { Authorization: "Bearer " + token }});
      setHistory(hist.data || []);
    } catch(e) { console.error(e); }
  }

  async function handleRegister(e){
    e.preventDefault();
    try {
      const res = await axios.post(API + "/auth/register", { email, password, name });
      saveToken(res.data.token);
      setView("dashboard");
      fetchProfileAndHistory();
    } catch(err){ alert(err.response?.data?.error || "Register error"); }
  }

  async function handleLogin(e){
    e.preventDefault();
    try {
      const res = await axios.post(API + "/auth/login", { email, password });
      saveToken(res.data.token);
      setView("dashboard");
      fetchProfileAndHistory();
    } catch(err){ alert(err.response?.data?.error || "Login error"); }
  }

  async function handleAnalyze(){
    if(!file) return alert("Upload a file first");
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const token = getToken();
      const res = await axios.post(API + "/analyze", form, {
        headers: { "Content-Type": "multipart/form-data", Authorization: "Bearer " + token }
      });
      setResult(res.data);
      fetchProfileAndHistory();
    } catch(err){ alert("Analyze error: " + (err.response?.data?.error || err.message)); }
    setLoading(false);
  }

  function logout(){
    clearToken();
    setView("login");
    setEmail(""); setPassword(""); setName("");
    setHistory([]); setResult(null);
  }

  if(view === "login"){
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass p-8 rounded-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign in</h2>
          <input className="input mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input mb-3" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="flex gap-3">
            <button className="btn" onClick={handleLogin}>Sign in</button>
            <button className="btn-outline" onClick={()=>setView("register")}>Register</button>
          </div>
        </div>
      </div>
    );
  }

  if(view === "register"){
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass p-8 rounded-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Create account</h2>
          <input className="input mb-3" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input mb-3" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="flex gap-3">
            <button className="btn" onClick={handleRegister}>Create</button>
            <button className="btn-outline" onClick={()=>setView("login")}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Social Analyzer</h1>
          <div className="flex items-center gap-4">
            <button className="btn-outline" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h3 className="font-semibold mb-2">Upload document</h3>
          <input type="file" onChange={e=>setFile(e.target.files[0])} />
          <div className="mt-4 flex gap-3">
            <button className="btn" onClick={handleAnalyze}>{loading ? "Analyzing..." : "Analyze"}</button>
            <div className="text-sm text-slate-300 self-center">{file ? file.name : "No file selected"}</div>
          </div>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="glass p-4">
              <h4 className="font-semibold">Summary</h4>
              <p className="text-sm whitespace-pre-wrap">{result.summary}</p>
            </div>
            <div className="glass p-4">
              <h4 className="font-semibold">Keywords</h4>
              <p>{result.keywords.join(" ")}</p>
            </div>
            <div className="glass p-4">
              <h4 className="font-semibold">Extracted text</h4>
              <pre className="text-xs whitespace-pre-wrap">{result.extracted_text}</pre>
            </div>
          </div>
        )}

        <div className="glass p-4">
          <h4 className="font-semibold mb-2">History</h4>
          <div className="space-y-2">
            {history.length === 0 && <div className="text-sm text-slate-400">No uploads yet</div>}
            {history.map(h => (
              <div key={h.id} className="p-2 border rounded">
                <div className="flex justify-between">
                  <div><strong>{h.filename}</strong> <span className="text-xs text-slate-400">({new Date(h.timestamp).toLocaleString()})</span></div>
                </div>
                <div className="text-sm text-slate-200 mt-1">{h.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
