"use client";

import { useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Passion, UserPassion } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, XCircle } from "lucide-react";

interface PassionManagerProps {
    allPassions: Passion[];
    userPassions: UserPassion[];
    userId: string;
}

export function PassionManager({ allPassions, userPassions, userId }: PassionManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [currentPassions, setCurrentPassions] = useState(userPassions.map(p => p.passion_id));

    const selectedPassions = allPassions.filter(p => currentPassions.includes(p.id));
    const availablePassions = allPassions.filter(p => !currentPassions.includes(p.id));

    const addPassion = async (passionId: number) => {
        const { error } = await supabase.from("user_passions").insert({
            user_id: userId,
            passion_id: passionId,
        });

        if (!error) {
            setCurrentPassions([...currentPassions, passionId]);
            startTransition(() => {
                router.refresh();
            });
        } else {
            console.error("Error adding passion:", error);
        }
    };

    const removePassion = async (passionId: number) => {
        const { error } = await supabase
            .from("user_passions")
            .delete()
            .eq("user_id", userId)
            .eq("passion_id", passionId);

        if (!error) {
            setCurrentPassions(currentPassions.filter(id => id !== passionId));
            startTransition(() => {
                router.refresh();
            });
        } else {
            console.error("Error removing passion:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Your Passions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="mb-2 font-semibold">Your Passions</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedPassions.length > 0 ? (
                            selectedPassions.map((passion) => (
                                <Badge key={passion.id} variant="default" className="flex items-center gap-1.5 pr-1">
                                    {passion.name}
                                    <button onClick={() => removePassion(passion.id)} disabled={isPending} className="hover:text-destructive">
                                        <XCircle size={14} />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Add passions from the list below.</p>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="mb-2 font-semibold">Available Passions</h3>
                    <div className="flex flex-wrap gap-2">
                        {availablePassions.map((passion) => (
                            <Badge key={passion.id} variant="secondary" className="flex items-center gap-1.5 pr-1">
                                {passion.name}
                                <button onClick={() => addPassion(passion.id)} disabled={isPending} className="hover:text-primary">
                                    <PlusCircle size={14} />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
