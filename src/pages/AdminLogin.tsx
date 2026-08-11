import React, { useState } from "react";
import { login, saveToken } from "../services/auth";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await login(email, password);
      saveToken(token);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <div className="w-full max-w-[380px]">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2 text-center">Wise Sole</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-center mb-8">Admin Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-black text-white text-[11px] tracking-[0.12em] uppercase py-3.5 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}