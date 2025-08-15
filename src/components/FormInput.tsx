import React from 'react';

// Define the type for the component's props, extending standard input attributes
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

/**
 * A reusable, styled input component for forms.
 * It includes a label and applies consistent styling.
 *
 * @param {FormInputProps} props - The component props.
 */
const FormInput: React.FC<FormInputProps> = ({ label, id, ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
                {label}
            </label>
            <input
                id={id}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition"
                {...props}
            />
        </div>
    );
};

export default FormInput;
