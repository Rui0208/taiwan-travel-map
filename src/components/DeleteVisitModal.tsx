import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { endpoints } from "@/api/endpoints";

interface DeleteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visitId: string;
  visitTitle: string;
}

export default function DeleteVisitModal({
  isOpen,
  onClose,
  onSuccess,
  visitId,
  visitTitle,
}: DeleteVisitModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoints.visited.delete(visitId), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("error_delete_failed"));
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_delete_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <Dialog.Title className="text-xl font-bold text-white mb-4">
            {t("delete_confirm_title")}
          </Dialog.Title>

          <div className="text-gray-400 mb-6">
            {t("delete_confirm_message_with_title", { title: visitTitle })}
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              disabled={isLoading}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t("deleting") : t("delete")}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
