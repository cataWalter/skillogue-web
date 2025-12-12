import React, { useState } from 'react';
import Modal from './Modal';
import { Button } from './Button';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reporterId: string;
    reportedUserId: string;
    reportedUserName: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    reporterId,
    reportedUserId,
    reportedUserName
}) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReport = async () => {
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('reports').insert({
                reporter_id: reporterId,
                reported_user_id: reportedUserId,
                reason: reason
            });

            if (error) throw error;
            toast.success('Report submitted. Thank you for keeping our community safe.');
            setReason('');
            onClose();
        } catch (error: any) {
            console.error('Error submitting report:', error);
            toast.error(error.message || 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Report ${reportedUserName}`}
        >
            <div className="space-y-4">
                <p className="text-gray-300">
                    Please describe why you are reporting this user. This will be reviewed by our team.
                </p>
                <div>
                    <label htmlFor="report-reason" className="sr-only">Reason for reporting</label>
                    <textarea
                        id="report-reason"
                        className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Reason for reporting..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} className="!w-auto">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleReport}
                        disabled={!reason.trim() || isSubmitting}
                        isLoading={isSubmitting}
                        className="!w-auto"
                    >
                        Submit Report
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ReportModal;
