import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../services/auth";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, authModalMode, setAuthModalMode, setAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authModalMode === "register") {
      if (!isPasswordValid) {
        setError("Please satisfy all password requirements.");
        return;
      }
    }

    setLoading(true);

    try {
      if (authModalMode === "register") {
        const res = await register({ name, email, password });
        setAuth(res.user, res.token);
      } else {
        const res = await login(email, password);
        setAuth(res.user, res.token);
      }
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={closeAuthModal}
    >
      <div
        className="bg-white max-w-md w-full p-6 md:p-8 border border-[#EAEAEA] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-[#888] hover:text-black text-xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Title */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-1">Wise Sole Member</p>
          <h2 className="text-[22px] font-semibold tracking-tight">
            {authModalMode === "login" ? "Sign In to Your Account" : "Create Wise Sole Account"}
          </h2>
          <p className="text-[12px] text-[#6B6B6B] mt-1">
            {authModalMode === "login"
              ? "Access your saved purchases, live courier trackings, and order history."
              : "Register to track your purchases anytime without losing order numbers."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[12px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === "register" && (
            <div>
              <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-black transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@gmail.com"
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-black transition-colors"
            />

            {/* LIVE PASSWORD RULES CHECKLIST FOR REGISTRATION */}
            {authModalMode === "register" && (
              <div className="mt-2.5 p-3 bg-[#F9F9F9] border border-[#EAEAEA] space-y-1 text-[11px]">
                <p className="font-semibold text-black uppercase tracking-wider text-[10px] mb-1.5">
                  Password Requirements:
                </p>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-green-600 font-medium" : "text-[#888]"}`}>
                  <span>{hasMinLength ? "✓" : "○"}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-green-600 font-medium" : "text-[#888]"}`}>
                  <span>{hasUppercase ? "✓" : "○"}</span>
                  <span>At least 1 uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-green-600 font-medium" : "text-[#888]"}`}>
                  <span>{hasNumber ? "✓" : "○"}</span>
                  <span>At least 1 number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-green-600 font-medium" : "text-[#888]"}`}>
                  <span>{hasSpecial ? "✓" : "○"}</span>
                  <span>At least 1 special character (!@#$%^&*)</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (authModalMode === "register" && !isPasswordValid)}
            className="w-full bg-black text-white text-[12px] tracking-[0.14em] uppercase py-3.5 hover:bg-[#222] transition-colors disabled:opacity-40 font-semibold"
          >
            {loading ? "Please wait..." : authModalMode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Switch Mode Footer */}
        <div className="mt-6 pt-4 border-t border-[#EAEAEA] text-center text-[12px] text-[#6B6B6B]">
          {authModalMode === "login" ? (
            <p>
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthModalMode("register");
                }}
                className="text-black font-semibold uppercase tracking-wider hover:underline ml-1"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthModalMode("login");
                }}
                className="text-black font-semibold uppercase tracking-wider hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
