'use client';

import React from 'react';
import { adminCopy } from '../../lib/app-copy';

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">{adminCopy.dashboard.title}</h1>
            <p className="text-gray-400">{adminCopy.dashboard.subtitle}</p>
        </div>
    );
}
