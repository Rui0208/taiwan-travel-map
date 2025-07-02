import React from "react";
import { useTranslation } from "react-i18next";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isDeleting?: boolean;
  deleteType?: 'comment' | 'notification' | 'post' | 'visit' | 'custom';
  customTitle?: string;
  customMessage?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
  deleteType,
  customTitle,
  customMessage,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // 根據刪除類型動態生成文字
  const getModalContent = () => {
    // 如果有自訂文字，優先使用
    if (customTitle && customMessage) {
      return { title: customTitle, message: customMessage };
    }

    // 根據刪除類型顯示不同文字
    switch (deleteType) {
      case 'comment':
        return {
          title: t("delete_comment_title", { defaultValue: "刪除留言" }),
          message: t("delete_comment_message", { defaultValue: "確定要刪除這則留言嗎？此操作無法復原。" })
        };
      case 'notification':
        return {
          title: t("delete_notification_title", { defaultValue: "刪除通知" }),
          message: t("delete_notification_message", { defaultValue: "確定要刪除這則通知嗎？" })
        };
      case 'post':
        return {
          title: t("delete_post_title", { defaultValue: "刪除貼文" }),
          message: t("delete_post_message", { defaultValue: "確定要刪除這則貼文嗎？此操作無法復原。" })
        };
      case 'visit':
        return {
          title: t("delete_visit_title", { defaultValue: "刪除造訪記錄" }),
          message: t("delete_visit_message", { defaultValue: "確定要刪除這筆造訪記錄嗎？此操作無法復原。" })
        };
      default:
        // 使用傳入的 title 和 message，或預設值
        return {
          title: title || t("delete_confirm_title"),
          message: message || t("delete_confirm_message")
        };
    }
  };

  const modalContent = getModalContent();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {modalContent.title}
              </h3>
            </div>
          </div>
          
          <p className="text-gray-300 leading-relaxed">
            {modalContent.message}
          </p>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-800/50 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-end sm:space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isDeleting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isDeleting ? t("deleting") : t("delete")}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 