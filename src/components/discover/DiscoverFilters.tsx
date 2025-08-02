"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function DiscoverFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Handlers for updating search parameters
    const handleFilterChange = (key: string, value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        if (!value) {
            current.delete(key);
        } else {
            current.set(key, value);
        }

        const search = current.toString();
        const query = search ? `?${search}` : "";

        router.push(`${pathname}${query}`);
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    placeholder="Search by name..."
                    defaultValue={searchParams.get("name") || ""}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="location">Location</Label>
                <Input
                    id="location"
                    placeholder="Search by location..."
                    defaultValue={searchParams.get("location") || ""}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="age">Age</Label>
                <Input
                    id="age"
                    type="number"
                    placeholder="Filter by age..."
                    defaultValue={searchParams.get("age") || ""}
                    onChange={(e) => handleFilterChange("age", e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="languages">Languages</Label>
                <Input
                    id="languages"
                    placeholder="Filter by language (e.g., English)..."
                    defaultValue={searchParams.get("languages") || ""}
                    onChange={(e) => handleFilterChange("languages", e.target.value)}
                />
            </div>
        </div>
    );
}