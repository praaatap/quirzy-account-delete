"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Mail, Lock, User, Loader2, CheckCircle2, ArrowLeft, Sun, Moon, AlertTriangle } from "lucide-react";

export default function DeleteAccountPage() {
  const [method, setMethod] = useState<"password" | "name">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isDark, setIsDark] = useState(true);

  // Sync theme with body class (matches your Privacy Policy logic)
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          method,
          password: method === 'password' ? password : null,
          fullName: method === 'name' ? fullName : null
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Deletion failed");
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 font-sans ${isDark ? 'bg-[#09090b] text-[#f4f4f5]' : 'bg-[#ffffff] text-[#18181b]'}`}>
      
      {/* --- Ambient Background Glows (From your CSS) --- */}
      <div className={`fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 opacity-50 ${isDark ? 'bg-[#3b82f6]/20' : 'bg-[#2563eb]/20'}`} />
      <div className={`fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 opacity-50 ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/10'}`} />

      {/* --- Navbar --- */}
      <nav className={`fixed top-0 left-0 right-0 h-[70px] backdrop-blur-md border-b z-50 flex items-center justify-center ${isDark ? 'bg-[#09090b]/10 border-[#27272a]' : 'bg-white/10 border-[#e4e4e7]'}`}>
        <div className="w-full max-w-[900px] px-6 flex items-center justify-between">
          <button 
            onClick={() => window.history.back()} 
            className={`flex items-center gap-2 transition-colors ${isDark ? 'text-[#a1a1aa] hover:text-[#f4f4f5]' : 'text-[#71717a] hover:text-[#18181b]'}`}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-sm ${isDark ? 'bg-[#3b82f6]' : 'bg-[#2563eb]'}`}>Q</div>
            <span className="font-semibold text-[1.05rem] tracking-tight">Quirzy Legal</span>
          </div>

          <button 
            onClick={() => setIsDark(!isDark)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-[#18181b] text-[#a1a1aa] hover:text-white' : 'bg-[#f4f4f5] text-[#71717a] hover:text-black'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="pt-[140px] pb-20 px-6 relative z-10 flex flex-col items-center">
        
        {/* Hero Header */}
        <header className="text-center max-w-[600px] mb-12">
          <div className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold mb-5 ${isDark ? 'bg-[#18181b] border-[#27272a] text-[#a1a1aa]' : 'bg-[#f4f4f5] border-[#e4e4e7] text-[#71717a]'}`}>
            Account Management
          </div>
          <h1 className={`text-5xl font-extrabold tracking-tight mb-4 ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400' : 'text-[#18181b]'}`}>
            Delete Account
          </h1>
        </header>

        {/* Glass Card */}
        <div className="w-full max-w-[480px]">
          <div className={`backdrop-blur-md border rounded-2xl p-8 shadow-xl transition-all duration-300 ${isDark ? 'bg-[#18181b]/60 border-[rgba(255,255,255,0.08)]' : 'bg-white/80 border-[rgba(0,0,0,0.05)]'}`}>
            
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Account Deleted</h2>
                  <p className={isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}>
                    Your account has been successfully removed from our systems. You can safely close this window.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleDelete}
                  className="flex flex-col gap-5"
                >
                  <div className="mb-2">
                    <h3 className="text-xl font-bold mb-2">Verification Required</h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                      To permanently delete your Quirzy account and all associated data, verify your identity. This action <span className="text-red-500 font-semibold">cannot be undone</span>.
                    </p>
                  </div>

                  {/* Method Toggle */}
                  <div className={`flex p-1 rounded-lg border mb-2 ${isDark ? 'bg-[#09090b]/50 border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'}`}>
                    <button
                      type="button"
                      onClick={() => { setMethod("password"); setMessage(""); }}
                      className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-all ${
                        method === "password" 
                          ? (isDark ? "bg-[#27272a] text-white shadow-sm" : "bg-white text-black shadow-sm")
                          : (isDark ? "text-[#a1a1aa] hover:text-white" : "text-[#71717a] hover:text-black")
                      }`}
                    >
                      Verify with Password
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMethod("name"); setMessage(""); }}
                      className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-all ${
                        method === "name" 
                          ? (isDark ? "bg-[#27272a] text-white shadow-sm" : "bg-white text-black shadow-sm")
                          : (isDark ? "text-[#a1a1aa] hover:text-white" : "text-[#71717a] hover:text-black")
                      }`}
                    >
                      Verify with Name
                    </button>
                  </div>

                  {/* Email Field */}
                  <div className="flex flex-col gap-2">
                    <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className={`absolute left-4 top-3.5 transition-colors ${isDark ? 'text-[#52525b] group-focus-within:text-[#3b82f6]' : 'text-[#a1a1aa] group-focus-within:text-[#2563eb]'}`} size={18} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full border rounded-xl py-3 pl-11 pr-4 outline-none transition-all font-medium ${
                          isDark 
                            ? 'bg-[#09090b]/50 border-[#27272a] text-white focus:border-[#3b82f6] placeholder:text-[#52525b]' 
                            : 'bg-white border-[#e4e4e7] text-black focus:border-[#2563eb] placeholder:text-[#a1a1aa]'
                        }`}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Dynamic Field */}
                  <AnimatePresence mode="wait">
                    {method === "password" ? (
                      <motion.div
                        key="password-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                          Password
                        </label>
                        <div className="relative group">
                          <Lock className={`absolute left-4 top-3.5 transition-colors ${isDark ? 'text-[#52525b] group-focus-within:text-[#3b82f6]' : 'text-[#a1a1aa] group-focus-within:text-[#2563eb]'}`} size={18} />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full border rounded-xl py-3 pl-11 pr-4 outline-none transition-all font-medium ${
                              isDark 
                                ? 'bg-[#09090b]/50 border-[#27272a] text-white focus:border-[#3b82f6] placeholder:text-[#52525b]' 
                                : 'bg-white border-[#e4e4e7] text-black focus:border-[#2563eb] placeholder:text-[#a1a1aa]'
                            }`}
                            placeholder="••••••••"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="name-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                          Full Name
                        </label>
                        <div className="relative group">
                          <User className={`absolute left-4 top-3.5 transition-colors ${isDark ? 'text-[#52525b] group-focus-within:text-[#3b82f6]' : 'text-[#a1a1aa] group-focus-within:text-[#2563eb]'}`} size={18} />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={`w-full border rounded-xl py-3 pl-11 pr-4 outline-none transition-all font-medium ${
                              isDark 
                                ? 'bg-[#09090b]/50 border-[#27272a] text-white focus:border-[#3b82f6] placeholder:text-[#52525b]' 
                                : 'bg-white border-[#e4e4e7] text-black focus:border-[#2563eb] placeholder:text-[#a1a1aa]'
                            }`}
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <p className={`text-[11px] ml-1 ${isDark ? 'text-[#52525b]' : 'text-[#a1a1aa]'}`}>
                          Must match the name on your profile exactly.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 text-sm rounded-lg text-center font-medium border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <AlertTriangle size={16} />
                        {message}
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark 
                        ? 'bg-white text-black hover:bg-[#f4f4f5] shadow-white/5' 
                        : 'bg-[#18181b] text-white hover:bg-[#27272a] shadow-black/10'
                    }`}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm">Processing...</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Trash2 size={18} />
                        Delete Account
                      </span>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <footer className={`py-10 text-center text-xs border-t relative z-10 ${isDark ? 'text-[#52525b] border-[#27272a] bg-[#09090b]/50' : 'text-[#a1a1aa] border-[#e4e4e7] bg-white/50'}`}>
        &copy; {new Date().getFullYear()} Quirzy App. All rights reserved.
      </footer>
    </div>
  );
}