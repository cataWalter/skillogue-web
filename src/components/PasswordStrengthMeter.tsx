// src/components/PasswordStrengthMeter.tsx
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
    password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };

    const StrengthIndicator: React.FC<{ label: string; isValid: boolean }> = ({ label, isValid }) => (
        <div className={`flex items-center text-sm transition-colors ${isValid ? 'text-green-400' : 'text-gray-500'}`}>
            {isValid ? <CheckCircle size={16} className="mr-2" /> : <XCircle size={16} className="mr-2" />}
            <span>{label}</span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2">
            <StrengthIndicator label="At least 8 characters" isValid={checks.length} />
            <StrengthIndicator label="At least one uppercase letter" isValid={checks.uppercase} />
            <StrengthIndicator label="At least one number" isValid={checks.number} />
            <StrengthIndicator label="At least one symbol" isValid={checks.symbol} />
        </div>
    );
};

export default PasswordStrengthMeter;