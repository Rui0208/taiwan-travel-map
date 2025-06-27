"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/supabase-auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function LoginModal({ isOpen, onClose, initialMode = "login" }: LoginModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess("");
      setShowEmailForm(false);
    }
  }, [isOpen, initialMode]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await signIn("google", { 
        callbackUrl: "/pages/home" 
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(t("auth.google_error"));
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "register") {
        // 註冊模式
        if (password !== confirmPassword) {
          setError(t("auth.password_mismatch"));
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError(t("auth.password_too_short"));
          setIsLoading(false);
          return;
        }

        const { error } = await auth.signUp(email, password, {
          display_name: email.split('@')[0]
        });

        if (error) {
          setError(error.message || t("auth.register_failed"));
        } else {
          setSuccess(t("auth.register_success"));
          setTimeout(() => {
            setMode("login");
            setSuccess("");
          }, 2000);
        }
      } else {
        // 登入模式
        const result = await signIn("supabase", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          // 根據錯誤類型顯示更明確的訊息
          if (result.error.includes('Email not confirmed') || result.error.includes('請先確認')) {
            setError(t("auth.email_not_confirmed"));
          } else if (result.error.includes('Invalid login credentials') || result.error.includes('電子郵件或密碼不正確')) {
            setError(t("auth.invalid_credentials"));
          } else {
            setError(t("auth.login_failed"));
          }
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
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-auto shadow-2xl border border-gray-700">
        {/* 標題區域 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {showEmailForm 
              ? (mode === "login" ? t("auth.sign_in_title") : t("auth.create_account_title"))
              : t("auth.welcome_title")
            }
          </h2>
          <p className="text-gray-400">
            {showEmailForm 
              ? (mode === "login" ? t("auth.sign_in_subtitle") : t("auth.create_account_subtitle"))
              : t("auth.welcome_subtitle")
            }
          </p>
        </div>

        {!showEmailForm ? (
          // 初始選擇界面
          <>
            {/* Google 登入按鈕 */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isLoading ? t("auth.signing_in") : t("auth.sign_in_with_google")}</span>
            </button>

            {/* 分隔線 */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="mx-4 text-gray-500 text-sm">{t("auth.or")}</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* 電子郵件登入/註冊按鈕 */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setMode("login");
                  setShowEmailForm(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {t("auth.sign_in_with_email")}
              </button>
              
              <button
                onClick={() => {
                  setMode("register");
                  setShowEmailForm(true);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {t("auth.create_new_account")}
              </button>
            </div>
          </>
        ) : (
          // 電子郵件表單
          <form onSubmit={handleEmailAuth} className="space-y-4">
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                  disabled={isLoading}
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
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? t("auth.processing") 
                : mode === "login" 
                  ? t("auth.sign_in") 
                  : t("auth.register")
              }
            </button>

            {/* 切換模式 */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                disabled={isLoading}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors disabled:opacity-50"
              >
                {mode === "login" 
                  ? t("auth.no_account_register") 
                  : t("auth.have_account_sign_in")
                }
              </button>
            </div>

            {/* 返回按鈕 */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors disabled:opacity-50"
              >
                {t("auth.back_to_options")}
              </button>
            </div>
          </form>
        )}

        {/* 關閉按鈕 */}
        {!showEmailForm && (
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("auth.later")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 