'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { reportModalCopy } from '../lib/app-copy';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedId: reportedUserId,
          reason: reason.trim(),
        }),
      });

      if (response.ok) {
        onClose();
        setReason('');
        toast.success(reportModalCopy.success);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(reportModalCopy.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface-overlay/50 flex items-center justify-center z-50 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="bg-surface border border-line/30 rounded-xl p-6 max-w-md w-full shadow-xl shadow-black/15"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="report-modal-title" className="text-xl font-bold text-foreground">{reportModalCopy.title}</h2>
          <button
            onClick={onClose}
            aria-label="Close report dialog"
            className="text-faint hover:text-foreground transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted mb-2">
              {reportModalCopy.label}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-surface-secondary border border-line/40 rounded-lg text-foreground placeholder-faint focus:ring-2 focus:ring-brand focus:border-transparent"
              rows={4}
              placeholder={reportModalCopy.placeholder}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface-secondary text-foreground rounded-lg hover:bg-surface-secondary/80 transition"
              disabled={loading}
            >
              {reportModalCopy.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-start text-white rounded-lg hover:bg-brand-start-hover transition disabled:opacity-50"
              disabled={loading || !reason.trim()}
            >
              {loading ? reportModalCopy.submitting : reportModalCopy.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
