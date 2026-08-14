import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const variantStyles = variant === 'primary' 
    ? "bg-black text-white hover:bg-zinc-800 shadow-sm hover:shadow-md" 
    : variant === 'danger'
    ? "bg-white text-red-600 border border-red-200 hover:bg-red-50"
    : "bg-white text-black border border-zinc-200 hover:bg-zinc-100";

  return (
    React.createElement('button', { className: `${baseStyles} ${variantStyles} ${className}`, ...props }, children)
  );
};
export default Button;

