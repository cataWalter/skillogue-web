// src/components/MultiSelect.js
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

const MultiSelect = ({ options, selected, onChange, label, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (optionName) => {
        if (selected.includes(optionName)) {
            onChange(selected.filter((item) => item !== optionName));
        } else {
            onChange([...selected, optionName]);
        }
    };

    const handleRemove = (optionName) => {
        onChange(selected.filter((item) => item !== optionName));
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
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
                            className="text-indigo-200 hover:text-white"
                        >
              <X size={14} />
            </button>
          </span>
                ))}
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder={selected.length === 0 ? placeholder : ''}
                        className="bg-transparent w-full focus:outline-none text-white placeholder-gray-500"
                        onFocus={() => setIsOpen(true)}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-gray-400 hover:text-white"
                >
                    <ChevronDown size={20} />
                </button>
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => handleSelect(option.name)}
                                className={`px-4 py-2 cursor-pointer hover:bg-gray-700 ${selected.includes(option.name) ? 'bg-indigo-900/50' : ''}`}
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
