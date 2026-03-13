import { ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const POSITION: Record<string, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        className={`
          pointer-events-none absolute z-50 ${POSITION[position]}
          whitespace-nowrap rounded-lg bg-slate-700 border border-slate-600
          px-3 py-1.5 text-xs text-slate-200 shadow-lg
          opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
          transition-all duration-150
        `}
      >
        {text}
      </span>
    </span>
  );
}
