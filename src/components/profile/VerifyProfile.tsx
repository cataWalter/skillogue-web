"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VerifyProfileProps {
    isVerified: boolean;
}

export function VerifyProfile({ isVerified }: VerifyProfileProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const supabase = createClientComponentClient();

    const handleVerification = async () => {
        setIsLoading(true);
        setMessage(null);
        const { error } = await supabase.auth.resend({
            type: "signup",
            // The email is taken from the authenticated user session by Supabase
        });

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage("A verification email has been sent to your inbox.");
        }
        setIsLoading(false);
    };

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Profile Verification</h3>
            <div className="flex items-center justify-between mt-2">
                <div>
                    Status:{" "}
                    {isVerified ? (
                        <Badge variant="default" className="bg-green-500">Verified</Badge>
                    ) : (
                        <Badge variant="secondary">Not Verified</Badge>
                    )}
                </div>
                {!isVerified && (
                    <Button onClick={handleVerification} disabled={isLoading} size="sm">
                        {isLoading ? "Sending..." : "Send Verification Email"}
                    </Button>
                )}
            </div>
            {message && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
        </div>
    );
}