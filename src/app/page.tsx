
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2, CheckCircle2, AlertTriangle, Sun, Moon, X, MessageSquare } from "lucide-react";
import { signIn, useSession, signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

// Predefined deletion reasons
const DELETION_REASONS = [
  { id: "not-using", label: "Not using the app anymore" },
  { id: "privacy", label: "Privacy concerns" },
  { id: "found-alternative", label: "Found a better alternative" },
  { id: "too-complicated", label: "App is too complicated" },
  { id: "bugs", label: "Too many bugs or issues" },
  { id: "other", label: "Other reason" },
];

// Wrapper component to provide session context
export default function DeleteAccountPageWrapper() {
  return (
    <SessionProvider>
      <DeleteAccountPage />
    </SessionProvider>
  );
}

function DeleteAccountPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<"idle" | "confirming" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isDark, setIsDark] = useState(true);

  // Confirmation modal state
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");

  // Content Summary State
  const [userContent, setUserContent] = useState<{
    quizzes: string[];
    flashcards: string[];
  } | null>(null);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  // Sync session state with local state & fetch summary
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      setStatus("confirming");
      fetchUserContent(session.user.email!);
    } else if (sessionStatus === "unauthenticated") {
      setStatus("idle");
    } else if (sessionStatus === "loading") {
      setStatus("loading");
    }
  }, [session, sessionStatus]);

  const fetchUserContent = async (email: string) => {
    try {
      const res = await fetch("/api/account/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserContent({
          quizzes: data.quizzes || [],
          flashcards: data.flashcards || []
        });
      }
    } catch (e) {
      console.error("Failed to fetch content summary", e);
    }
  };

  // Handle Google Sign-In (Real)
  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch (err) {
      console.error("Sign in error:", err);
      setMessage("Failed to sign in. Please try again.");
    }
  };

  const toggleReason = (reasonId: string) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(r => r !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleConfirmDelete = async () => {
    if (selectedReasons.length === 0 && !customReason.trim()) {
      setMessage("Please select at least one reason or provide feedback.");
      return;
    }

    if (!session?.user?.email) {
      setMessage("Could not verify your identity. Please sign in again.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          method: "google",
          reasons: selectedReasons,
          customReason: customReason.trim(),
        }),
      });

      // Handle non-JSON responses
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error. Please try again later.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Deletion failed");
      }

      setStatus("success");
      // Optional: signOut() after successful deletion
      // await signOut();
    } catch (err: any) {
      setStatus("confirming"); // Go back to confirming state
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  const cancelDeletion = () => {
    signOut(); // Sign out if they cancel
    setStatus("idle");
    setSelectedReasons([]);
    setCustomReason("");
    setMessage("");
    setUserContent(null);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 font-sans ${isDark ? 'bg-[#09090b] text-[#f4f4f5]' : 'bg-[#ffffff] text-[#18181b]'}`}>

      {/* Background Glows */}
      <div className={`fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 opacity-50 ${isDark ? 'bg-red-500/15' : 'bg-red-500/10'}`} />
      <div className={`fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 opacity-50 ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/10'}`} />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 h-[70px] backdrop-blur-md border-b z-50 flex items-center justify-center ${isDark ? 'bg-[#09090b]/80 border-[#27272a]' : 'bg-white/80 border-[#e4e4e7]'}`}>
        <div className="w-full max-w-[900px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#5B13EC] to-[#9333EA] flex items-center justify-center font-extrabold text-white text-sm">Q</div>
            <span className="font-semibold text-[1.05rem] tracking-tight">Quirzy</span>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-[#18181b] text-[#a1a1aa] hover:text-white' : 'bg-[#f4f4f5] text-[#71717a] hover:text-black'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-[140px] pb-20 px-6 relative z-10 flex flex-col items-center">

        {/* Hero Header */}
        <header className="text-center max-w-[600px] mb-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold mb-6 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <Trash2 size={14} />
            Account Deletion
          </div>
          <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-[#18181b]'}`}>
            Delete Your Account
          </h1>
          <p className={`text-base leading-relaxed ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
            We're sorry to see you go. Sign in with Google to verify your identity and permanently delete your Quirzy account.
          </p>
        </header>

        {/* Main Card */}
        <div className="w-full max-w-[480px]">
          <div className={`backdrop-blur-md border rounded-2xl p-8 shadow-xl transition-all duration-300 ${isDark ? 'bg-[#18181b]/60 border-[rgba(255,255,255,0.08)]' : 'bg-white/80 border-[rgba(0,0,0,0.05)]'}`}>

            <AnimatePresence mode="wait">
              {/* Success State */}
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 120 }}
                    className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-3">Account Deleted</h2>
                  <p className={isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}>
                    Your account and all associated data have been permanently removed. It's sad to see you go!
                  </p>
                </motion.div>
              )}

              {/* Confirmation Modal */}
              {/* Using sessionStatus === 'authenticated' as a condition to ensure data is present */}
              {(status === "confirming" || (status === "loading" && session)) && session?.user && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-5"
                >
                  {/* User Info */}
                  <div className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-[#09090b]/50 border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'}`}>
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#5B13EC] to-[#9333EA] flex items-center justify-center text-white font-bold text-lg">
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{session.user.name || "User"}</p>
                      <p className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>{session.user.email}</p>
                    </div>
                  </div>

                  {/* Content Summary (Quizzes & Flashcards) */}
                  {!userContent ? (
                    // Loading State for Content
                    <div className={`p-4 rounded-xl border flex items-center justify-center gap-2 py-6 ${isDark ? 'bg-[#09090b]/30 border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'}`}>
                      <Loader2 className="animate-spin text-purple-500" size={16} />
                      <span className={`text-xs font-medium ${isDark ? 'text-[#71717a]' : 'text-[#52525b]'}`}>Checking for your quizzes...</span>
                    </div>
                  ) : (userContent.quizzes.length > 0 || userContent.flashcards.length > 0) ? (
                    // Content Found
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#09090b]/30 border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-[#e4e4e7]' : 'text-[#27272a]'}`}>
                        Found content linked to you:
                      </p>
                      <div className="space-y-4">
                        {userContent.quizzes.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {userContent.quizzes.length} Quizzes Found
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {userContent.quizzes.map((q, i) => (
                                <span key={i} className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${isDark ? 'bg-[#18181b] border-[#3f3f46] text-[#e4e4e7]' : 'bg-white border-[#d4d4d8] text-[#27272a]'}`}>
                                  {q}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {userContent.flashcards.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {userContent.flashcards.length} Flashcard Sets Found
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {userContent.flashcards.map((f, i) => (
                                <span key={i} className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${isDark ? 'bg-[#18181b] border-[#3f3f46] text-[#e4e4e7]' : 'bg-white border-[#d4d4d8] text-[#27272a]'}`}>
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // No Content Found (Empty State)
                    <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-[#09090b]/30 border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'}`}>
                      <p className={`text-xs ${isDark ? 'text-[#52525b]' : 'text-[#a1a1aa]'}`}>No public quizzes or flashcards found.</p>
                    </div>
                  )}

                  {/* Warning */}
                  {/* Warning */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className={`font-semibold mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Important Note:</p>
                        <p className={`text-sm ${isDark ? 'text-amber-400/80' : 'text-amber-700/80'}`}>
                          Your account identity will be permanently removed. <br />
                          However, your <b>Quizzes</b> and <b>Flashcards</b> will remain public as "Anonymous" content for the community.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wider mb-3 block ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                      Why are you leaving? (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DELETION_REASONS.map((reason) => (
                        <button
                          key={reason.id}
                          type="button"
                          onClick={() => toggleReason(reason.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedReasons.includes(reason.id)
                            ? (isDark ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-700')
                            : (isDark ? 'bg-[#27272a]/50 border-[#3f3f46] text-[#a1a1aa] hover:border-[#52525b]' : 'bg-white border-[#e4e4e7] text-[#71717a] hover:border-[#d4d4d8]')
                            }`}
                        >
                          {reason.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Reason */}
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                      <MessageSquare size={14} />
                      Additional Feedback (Optional)
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Help us improve by sharing your thoughts..."
                      rows={3}
                      className={`w-full border rounded-xl py-3 px-4 outline-none transition-all font-medium resize-none ${isDark
                        ? 'bg-[#09090b]/50 border-[#27272a] text-white focus:border-purple-500 placeholder:text-[#52525b]'
                        : 'bg-white border-[#e4e4e7] text-black focus:border-purple-500 placeholder:text-[#a1a1aa]'
                        }`}
                    />
                  </div>

                  {/* Error Message */}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 text-sm rounded-lg text-center font-medium border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}
                    >
                      {message}
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={cancelDeletion}
                      className={`flex-1 font-semibold py-3.5 rounded-xl transition-all border ${isDark
                        ? 'bg-transparent border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'
                        : 'bg-white border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5] hover:text-black'
                        }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={status === "loading"}
                      className="flex-1 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          <span>Delete Forever</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Initial State - Google Sign In */}
              {(status === "idle" || status === "error" || status === "loading") && !session?.user && (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-linear-to-br from-[#5B13EC] to-[#9333EA] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Verify Your Identity</h3>
                    <p className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                      Sign in with the Google account linked to your Quirzy account to continue.
                    </p>
                  </div>

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

                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={status === "loading"}
                    className={`w-full font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3 border disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                      ? 'bg-white text-black hover:bg-[#f4f4f5] border-white'
                      : 'bg-white text-[#18181b] hover:bg-[#f4f4f5] border-[#e4e4e7] shadow-sm'
                      }`}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        {/* Google Icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  <p className={`text-xs text-center ${isDark ? 'text-[#52525b]' : 'text-[#a1a1aa]'}`}>
                    By continuing, you agree to our deletion policy. Your data will be permanently removed.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Help Section */}
        <div className={`mt - 8 text - center max - w - [400px] ${isDark ? 'text-[#52525b]' : 'text-[#a1a1aa]'} `}>
          <p className="text-sm">
            Having trouble? Contact us at{" "}
            <a href="mailto:support@quirzy.app" className={`underline ${isDark ? 'text-[#a1a1aa] hover:text-white' : 'text-[#71717a] hover:text-black'} `}>
              support@quirzy.app
            </a>
          </p>
        </div>
      </main>

      <footer className={`py - 10 text - center text - xs border - t relative z - 10 ${isDark ? 'text-[#52525b] border-[#27272a] bg-[#09090b]/50' : 'text-[#a1a1aa] border-[#e4e4e7] bg-white/50'} `}>
        &copy; {new Date().getFullYear()} Quirzy App. All rights reserved.
      </footer>
    </div>
  );
}