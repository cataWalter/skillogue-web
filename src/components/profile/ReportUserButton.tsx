"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ReportUserButtonProps {
    reporterId: string;
    reportedUserId: string;
}

export function ReportUserButton({
    reporterId,
    reportedUserId,
}: ReportUserButtonProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const supabase = createClientComponentClient();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Please provide a reason for the report.");
            return;
        }
        setIsSubmitting(true);
        setError(null);

        const { error: insertError } = await supabase.from("reports").insert({
            reporter_id: reporterId,
            reported_user_id: reportedUserId,
            reason: reason.trim(),
        });

        if (insertError) {
            setError(`Failed to submit report: ${insertError.message}`);
        } else {
            setIsSuccess(true);
        }

        setIsSubmitting(false);
    };

    return (
        <Dialog onOpenChange={() => {
            // Reset state when dialog is closed
            setIsSuccess(false);
            setReason("");
            setError(null);
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Report User
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report User</DialogTitle>
                </DialogHeader>
                {isSuccess ? (
                    <div className="py-4">
                        <p className="text-center text-green-600">
                            Your report has been submitted. Thank you.
                        </p>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button type="button">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="reason">Reason for reporting:</Label>
                            <Textarea
                                id="reason"
                                placeholder="Please provide details about the issue..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !reason.trim()}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Report"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}