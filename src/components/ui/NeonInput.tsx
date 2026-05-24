"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(
  function NeonInput({ label, error, hint, icon, className, id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm text-cyan-300/80 font-medium flex items-center gap-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "neon-input",
              error && "input-error",
              icon && "pl-10",
              className
            )}
            onChange={(e) => {
              if (props.type === "number" || props.inputMode === "numeric" || props.inputMode === "decimal") {
                const val = e.target.value;
                const englishVal = val.replace(/[٠-٩۰-۹]/g, d => {
                  const arabic = "٠١٢٣٤٥٦٧٨٩";
                  const persian = "۰۱۲۳۴۵۶۷۸۹";
                  if (arabic.includes(d)) return arabic.indexOf(d).toString();
                  if (persian.includes(d)) return persian.indexOf(d).toString();
                  return d;
                });
                
                if (englishVal !== val) {
                  e.target.value = englishVal;
                }
              }
              if (props.onChange) {
                props.onChange(e);
              }
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-pink-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);
