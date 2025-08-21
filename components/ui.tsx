

import React, { useState } from 'react';

// --- Form Components ---

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}
export const Slider: React.FC<SliderProps> = ({ label, min, max, step, value, onChange, unit }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300">
      {label}
      <span className="ml-2 px-2 py-0.5 bg-gray-600 text-indigo-300 text-xs rounded-full">{value}{unit}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="mt-1 w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);


interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-white"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
export const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-5 w-5 bg-gray-700 border-gray-600 rounded text-indigo-500 focus:ring-indigo-500"
    />
    <span className="text-sm text-gray-300">{label}</span>
  </label>
);

export const FileInput: React.FC<{ onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ onChange }) => (
  <div className="w-full">
    <label htmlFor="file-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-md inline-flex items-center justify-center w-full transition-colors">
      <UploadIcon className="w-5 h-5 mr-2" />
      <span>Chọn một hình ảnh...</span>
    </label>
    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={onChange} />
  </div>
);


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}
export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = "px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500",
    secondary: "bg-gray-600 text-gray-200 hover:bg-gray-500 focus:ring-gray-400",
  };
  return <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>{children}</button>;
};

export const Section: React.FC<{ title: string, children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-700 rounded-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 bg-gray-700/50 hover:bg-gray-700 transition-colors flex justify-between items-center rounded-t-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-800 rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
};


// --- Icons ---
// Using React.FC<React.SVGProps<SVGSVGElement>> for type safety with SVG props

export const GithubIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path></svg>
);
export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
);
export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.748 1.295 2.536 0 3.284L7.28 20.99c-1.25.72-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>
);
export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
);
export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69a.75.75 0 0 1 .818.162a7.5 7.5 0 0 1 0 10.607a.75.75 0 0 1-.818.162A8.97 8.97 0 0 0 15 18a9 9 0 0 0-9-9 8.97 8.97 0 0 0-3.463.69a.75.75 0 0 1-.818-.162a7.5 7.5 0 0 1 0-10.607a.75.75 0 0 1 .818-.162A8.97 8.97 0 0 0 9 6a9 9 0 0 0 .528-4.282Z" clipRule="evenodd" /></svg>
);
export const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
);
export const JsonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M4.5 3A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3h-15Zm0 9a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75V12Zm3 0a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75V12Zm3 0a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75V12Z" clipRule="evenodd" /></svg>
);
export const SvgIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M4.5 3A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3h-15Z" /><path fill="#fff" d="M6.3 12.42c0-.36.27-.63.63-.63h1.26a.63.63 0 0 1 0 1.26H6.93a.63.63 0 0 1-.63-.63Zm4.41-3.33H9.18c-.3 0-.48.24-.48.48v5.52c0 .24.18.48.48.48h1.53c.3 0 .48-.24.48-.48v-1.68h-.48a.48.48 0 1 1 0-.96h.48V9.57c0-.24-.18-.48-.48-.48Zm2.82 2.85c0-.84-.66-1.5-1.5-1.5H10.5c-.24 0-.48.18-.48.48v5.16c0 .24.18.48.48.48h1.53c.84 0 1.5-.66 1.5-1.5v-2.64Zm-1.02.48c0 .24-.18.48-.48.48h-.57v-.96h.57c.3 0 .48.24.48.48Zm.03 2.19v-5.19h1.53c.84 0 1.5.66 1.5 1.5v2.19c0 .84-.66 1.5-1.5 1.5h-1.53Zm.48-4.23h.57c.27 0 .48.21.48.48v1.26c0 .27-.21.48-.48.48h-.57V9.39Z" /></svg>
);
export const PngIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06l2.76-2.76a.75.75 0 0 1 1.06 0l3.75 3.75L15.24 12a.75.75 0 0 1 1.06 0l5.25 5.25V6H3v10.06Z" clipRule="evenodd" /></svg>
);
export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
);