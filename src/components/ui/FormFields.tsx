import React from 'react';
import './FormFields.css';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, error, helperText, ...props }) => {
  return (
    <div className="form-field">
      <label htmlFor={props.id || props.name}>{label}</label>
      <input className={error ? 'error' : ''} {...props} id={props.id || props.name} />
      {error && <span className="error-text">{error}</span>}
      {!error && helperText && <span className="helper-text">{helperText}</span>}
    </div>
  );
};

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, options, error, ...props }) => {
  return (
    <div className="form-field">
      <label htmlFor={props.id || props.name}>{label}</label>
      <select className={error ? 'error' : ''} {...props} id={props.id || props.name}>
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};
