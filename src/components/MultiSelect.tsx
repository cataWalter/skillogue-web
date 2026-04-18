import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { componentCopy } from '../lib/app-copy';

interface Option {
    name: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label: string;
    placeholder?: string;
    id?: string;
    name?: string;
    maxSelect?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, label, placeholder, id, name, maxSelect }) => {
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
            if (maxSelect !== undefined && selected.length >= maxSelect) {
                return;
            }
            onChange([...selected, optionName]);
        }
    };

    const handleRemove = (optionName: string) => {
        onChange(selected.filter((item) => item !== optionName));
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputId = id ?? `multiselect-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const isAtMax = maxSelect !== undefined && selected.length >= maxSelect;

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="mb-2 flex items-center justify-between">
                <label htmlFor={inputId} className="block text-sm font-medium text-muted">{label}</label>
                <div className="flex items-center gap-2">
                    {maxSelect !== undefined && (
                        <span className={`rounded-full px-2 py-0.5 text-xs shadow-glass-sm ${isAtMax ? 'bg-danger/15 text-danger-soft' : 'bg-surface-secondary text-faint'}`}>
                            {selected.length}/{maxSelect}
                        </span>
                    )}
                    {selected.length > 0 && maxSelect === undefined && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand shadow-glass-sm">
                            {componentCopy.multiSelect.selectedCount(selected.length)}
                        </span>
                    )}
                </div>
            </div>
            <div className="glass-surface flex cursor-text flex-wrap gap-2 rounded-xl border border-line/30 bg-surface-secondary/70 p-2 shadow-glass-sm transition-colors hover:border-line/50" onClick={() => setIsOpen(true)}>
                {selected.map((item) => (
                    <span key={item} className="flex items-center gap-2 rounded-full bg-brand px-2 py-1 text-sm text-white shadow-glass-sm">
                        {item}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item);
                            }}
                            className="text-white hover:text-white/80 focus:outline-none"
                            aria-label={componentCopy.multiSelect.removeSelectedItem(item)}
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    id={inputId}
                    name={name ?? inputId}
                    type="text"
                    role="combobox"
                    aria-controls={`${inputId}-listbox`}
                    className="min-w-[100px] flex-grow border-none bg-transparent text-foreground placeholder-faint focus:ring-0"
                    placeholder={selected.length === 0 ? (placeholder || componentCopy.multiSelect.defaultPlaceholder) : ''}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    autoComplete="off"
                />
                <ChevronDown className="text-faint ml-auto self-center" size={20} />
            </div>

            {isOpen && (
                <div id={`${inputId}-listbox`} className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-line/30 bg-[var(--glass-panel)]/95 shadow-glass-lg backdrop-blur-glass" role="listbox">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => {
                            const isSelected = selected.includes(option.name);
                            const isDisabled = isAtMax && !isSelected;
                            return (
                                <div
                                    key={option.name}
                                    onClick={() => !isDisabled && handleSelect(option.name)}
                                    className={`flex cursor-pointer items-center justify-between px-4 py-2 transition-colors ${isSelected ? 'bg-brand/15 text-brand-soft' : isDisabled ? 'cursor-not-allowed opacity-40 text-muted' : 'text-muted hover:bg-surface/50'}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-disabled={isDisabled}
                                >
                                    <span>{option.name}</span>
                                    {isSelected && <Check size={16} className="text-brand" />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-4 py-2 text-faint">{componentCopy.multiSelect.noOptionsFound}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
