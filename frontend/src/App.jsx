import jsPDF from "jspdf";
import { useEffect, useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

const API = "https://social-media-analyzer-uz4x.onrender.com/";  // your actual URL


const saveToken = (t) => localStorage.setItem("sa_token", t);
const getToken = () => localStorage.getItem("sa_token");
const clearToken = () => localStorage.removeItem("sa_token");

export default function App() {
  const [view, setView] = useState("login"); // login | register | dashboard
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // RESET FORMS WHEN VIEW CHANGES
  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");
    setFile(null);
    setResult(null);
  }, [view]);

  // AUTO LOGIN IF TOKEN EXISTS
  useEffect(() => {
    if (getToken()) {
      fetchHistory();
      setView("dashboard");
    }
  }, []);

  async function fetchHistory() {
    try {
      const token = getToken();
      if (!token) return;
      const res = await axios.get(API + "/history", {
        headers: { Authorization: "Bearer " + token },
      });
      setHistory(res.data || []);
    } catch (error) {
      console.log(error);
    }
  }

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [], "image/*": [] },
  });

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const res = await axios.post(API + "/auth/register", {
        email,
        password,
        name,
      });
      saveToken(res.data.token);
      setView("dashboard");
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await axios.post(API + "/auth/login", { email, password });
      saveToken(res.data.token);
      setName(res.data.name);
      setView("dashboard");
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  }

  async function handleAnalyze() {
    if (!file) return alert("Upload a file first!");

    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await axios.post(API + "/analyze", form, {
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.error || "Analyze failed");
    }
    setLoading(false);
  }

  function logout() {
    clearToken();
    setView("login");
    setHistory([]);
    setResult(null);
  }

  function downloadPDF() {
    if (!result) return;
    const doc = new jsPDF();
    doc.text("Social Media Report", 10, 10);
    doc.text("File: " + result.filename, 10, 20);
    doc.text("Tone: " + result.tone, 10, 30);
    doc.text("Summary:", 10, 45);
    doc.text(result.summary, 10, 55, { maxWidth: 180 });
    doc.save("report.pdf");
  }

  // ======================================================
  // AUTH PAGES
  // ======================================================
  if (view === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass max-w-md w-full space-y-4 p-8">
          <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn w-full" onClick={handleLogin}>
            Sign In
          </button>
          <button className="btn-outline w-full" onClick={() => setView("register")}>
            Create Account
          </button>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass max-w-md w-full space-y-4 p-8">
          <h2 className="text-3xl font-bold mb-4">Create Account</h2>

          <input
            className="input"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn w-full" onClick={handleRegister}>
            Register
          </button>

          <button className="btn-outline w-full" onClick={() => setView("login")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // DASHBOARD
  // ======================================================
  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Social Analyzer</h1>
            <p className="text-white/60 mt-1">Hello, {name || "User"} 👋</p>
          </div>

          <div className="flex gap-3">
            <button className="btn-outline" onClick={() => setHistory([])}>
              Clear History
            </button>
            <button className="btn-outline" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* DRAG & DROP UPLOAD */}
        <div className="glass space-y-4">
          <h3 className="section-title">Upload Document</h3>

          <div
            {...getRootProps()}
            className={`p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition 
              ${
                isDragActive
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-white/20 bg-white/5"
              }`}
          >
            <input {...getInputProps()} />

            {isDragActive ? (
              <p className="text-blue-300 font-semibold">Drop the file here…</p>
            ) : (
              <p className="text-white/60">
                Drag & drop your PDF or Image here <br />
                or click to browse
              </p>
            )}

            {file && <p className="text-green-400 mt-3">{file.name}</p>}
          </div>

          <button className="btn w-full" onClick={handleAnalyze}>
            {loading ? <div className="loading-bar mx-auto"></div> : "Analyze"}
          </button>
        </div>

        {/* RESULTS */}
        {result && (
          <div className="grid grid-cols-1 gap-6">
            <div className="glass">
              <h3 className="section-title">Summary</h3>
              <p className="text-white/80 whitespace-pre-wrap">{result.summary}</p>

              <div className="flex gap-3 mt-4">
                <button
                  className="btn-outline"
                  onClick={() => navigator.clipboard.writeText(result.summary)}
                >
                  Copy Summary
                </button>

                <button className="btn" onClick={downloadPDF}>
                  Download PDF
                </button>
              </div>
            </div>

            <div className="glass">
              <h3 className="section-title">Keywords</h3>
              <p className="text-blue-300 font-semibold">{result.keywords.join("  ")}</p>
            </div>

            <div className="glass">
              <h3 className="section-title">Extracted Text</h3>
              <pre className="text-white/60 whitespace-pre-wrap text-sm">
                {result.extracted_text}
              </pre>
            </div>
          </div>
        )}

        {/* HISTORY */}
        <div className="glass space-y-3">
          <h3 className="section-title">History</h3>

          {history.length === 0 && (
            <p className="text-white/50 text-sm">No uploads yet</p>
          )}

          {history.map((h) => (
            <div key={h.id} className="border border-white/20 rounded-lg p-3">
              <div className="flex justify-between">
                <strong>{h.filename}</strong>
                <span className="text-xs text-white/40">
                  {new Date(h.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-white/70 text-sm mt-1">{h.summary}</p>
            </div>
          ))}
        </div>

        <footer className="text-center text-sm text-white/40 mt-10">
          Built by Mohit • Social Media Analyzer © 2025
        </footer>
      </div>
    </div>
  );
}
