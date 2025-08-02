// src/components/discover/DiscoverFilters.tsx

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

// Assuming you have a way to fetch all available passions
const allPassions = ["Programming", "Hiking", "Photography", "Cooking", "Gaming", "Art"];

export function DiscoverFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleFilterChange = useDebouncedCallback((term: string, value: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(term, value);
        } else {
            params.delete(term);
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    return (
        <div className="p-4 bg-white shadow rounded-lg">
            <h3 className="font-bold text-lg mb-3">Filters</h3>
            <div className="space-y-4">
                {/* Username Search */}
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        name="username"
                        id="username"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        defaultValue={searchParams.get('username') || ''}
                        onChange={(e) => handleFilterChange('username', e.target.value)}
                    />
                </div>

                {/* Passion Select */}
                <div>
                    <label htmlFor="passion" className="block text-sm font-medium text-gray-700">Passion</label>
                    <select
                        id="passion"
                        name="passion"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        defaultValue={searchParams.get('passion') || ''}
                        onChange={(e) => handleFilterChange('passion', e.target.value)}
                    >
                        <option value="">All Passions</option>
                        {allPassions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                
                {/* Age Range */}
                <div className="flex space-x-2">
                    <div className="flex-1">
                        <label htmlFor="minAge" className="block text-sm font-medium text-gray-700">Min Age</label>
                        <input
                            type="number"
                            name="minAge"
                            id="minAge"
                            min="18"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            defaultValue={searchParams.get('minAge') || ''}
                            onChange={(e) => handleFilterChange('minAge', e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="maxAge" className="block text-sm font-medium text-gray-700">Max Age</label>
                        <input
                            type="number"
                            name="maxAge"
                            id="maxAge"
                            min="18"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            defaultValue={searchParams.get('maxAge') || ''}
                            onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}