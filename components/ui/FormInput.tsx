"use client";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  id?: string;
  maxLength?: number;
  className?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export default function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  id,
  maxLength,
  className = "",
  required = false,
  icon,
}: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className}>
      <label htmlFor={inputId} className="text-white/50 text-xs block mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-required={required}
          className="form-input"
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
