"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Passion } from "@/types";
import { useDebouncedCallback } from "use-debounce";

interface DiscoverFiltersProps {
    allPassions: Passion[];
}

export function DiscoverFilters({ allPassions }: DiscoverFiltersProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleNameSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("name", term);
        } else {
            params.delete("name");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300); // Wait 300ms after user stops typing

    const handlePassionSelect = (passionId: string) => {
        const params = new URLSearchParams(searchParams);
        if (passionId && passionId !== "all") {
            params.set("passionId", passionId);
        } else {
            params.delete("passionId");
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row">
            <Input
                placeholder="Search by name..."
                className="flex-grow"
                onChange={(e) => handleNameSearch(e.target.value)}
                defaultValue={searchParams.get("name")?.toString()}
            />
            <Select
                onValueChange={handlePassionSelect}
                defaultValue={searchParams.get("passionId")?.toString() || "all"}
            >
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by passion" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Passions</SelectItem>
                    {allPassions.map((passion) => (
                        <SelectItem key={passion.id} value={passion.id.toString()}>
                            {passion.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
