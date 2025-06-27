"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { signIn } from "next-auth/react";
import { auth } from "@/lib/supabase-auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess("");
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "register") {
        // 註冊模式
        if (password !== confirmPassword) {
          setError(t("auth.password_mismatch"));
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError(t("auth.password_too_short"));
          setLoading(false);
          return;
        }

        const { error } = await auth.signUp(email, password, {
          display_name: email.split('@')[0]
        });

        if (error) {
          setError(error.message || t("auth.register_failed"));
        } else {
          setSuccess(t("auth.register_success"));
          // 可以選擇自動切換到登入模式或直接登入
          setTimeout(() => {
            setMode("login");
            setSuccess("");
          }, 2000);
        }
      } else {
        // 登入模式 - 使用 NextAuth 的 Credentials provider
        const result = await signIn("supabase", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError(t("auth.login_failed"));
        } else if (result?.ok) {
          setSuccess(t("auth.login_success"));
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError(t("auth.unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    
    try {
      await signIn("google", { 
        callbackUrl: "/pages/home" 
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(t("auth.google_signin_failed"));
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6 relative">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 標題 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === "login" ? t("auth.login") : t("auth.register")}
          </h2>
          <p className="text-gray-400">
            {mode === "login" ? t("auth.login_subtitle") : t("auth.register_subtitle")}
          </p>
        </div>

        {/* Google 登入按鈕 */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{loading ? t("auth.signing_in") : t("auth.continue_with_google")}</span>
        </button>

        {/* 分隔線 */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-700"></div>
          <span className="mx-4 text-gray-500 text-sm">{t("auth.or")}</span>
          <div className="flex-1 border-t border-gray-700"></div>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder={t("auth.email_placeholder")}
            />
          </div>

          {/* 密碼 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              {t("auth.password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder={t("auth.password_placeholder")}
            />
          </div>

          {/* 確認密碼（僅註冊時顯示） */}
          {mode === "register" && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                {t("auth.confirm_password")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder={t("auth.confirm_password_placeholder")}
              />
            </div>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 成功訊息 */}
          {success && (
            <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? t("auth.processing") 
              : mode === "login" 
                ? t("auth.login") 
                : t("auth.register")
            }
          </button>
        </form>

        {/* 切換模式 */}
        <div className="text-center mt-6">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            disabled={loading}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors disabled:opacity-50"
          >
            {mode === "login" 
              ? t("auth.need_account") 
              : t("auth.have_account")
            }
          </button>
        </div>

        {/* 忘記密碼（僅登入模式顯示） */}
        {mode === "login" && (
          <div className="text-center mt-3">
            <button
              onClick={() => {
                // TODO: 實現忘記密碼功能
                console.log("Forgot password clicked");
              }}
              disabled={loading}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors disabled:opacity-50"
            >
              {t("auth.forgot_password")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 