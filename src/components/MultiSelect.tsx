import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Option {
    name: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label: string;
    placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, label, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (optionName: string) => {
        if (selected.includes(optionName)) {
            onChange(selected.filter((item) => item !== optionName));
        } else {
            onChange([...selected, optionName]);
        }
    };

    const handleRemove = (optionName: string) => {
        onChange(selected.filter((item) => item !== optionName));
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputId = `multiselect-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-700 rounded-lg bg-gray-900 cursor-text" onClick={() => setIsOpen(true)}>
                {selected.map((item) => (
                    <span key={item} className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-2 py-1 rounded-full">
                        {item}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item);
                            }}
                            className="text-white hover:text-gray-200 focus:outline-none"
                            aria-label={`Remove ${item}`}
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    id={inputId}
                    type="text"
                    role="combobox"
                    aria-controls={`${inputId}-listbox`}
                    className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 min-w-[100px]"
                    placeholder={selected.length === 0 ? (placeholder || "Select...") : ""}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                />
                <ChevronDown className="text-gray-400 ml-auto self-center" size={20} />
            </div>

            {isOpen && (
                <div id={`${inputId}-listbox`} className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto" role="listbox">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.name}
                                onClick={() => handleSelect(option.name)}
                                className={`px-4 py-2 cursor-pointer hover:bg-gray-700 ${selected.includes(option.name) ? 'bg-indigo-900/50 text-indigo-300' : 'text-gray-300'
                                    }`}
                                role="option"
                                aria-selected={selected.includes(option.name)}
                            >
                                {option.name}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-gray-500">No options found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
