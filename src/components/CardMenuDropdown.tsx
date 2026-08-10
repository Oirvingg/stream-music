import { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface CardMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  iconClassName?: string;
}

interface CardMenuDropdownProps {
  anchorRect: DOMRect;
  items: CardMenuItem[];
  onClose: () => void;
}

export function CardMenuDropdown({ anchorRect, items, onClose }: CardMenuDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuWidth = 256;
  const left = Math.min(
    Math.max(8, anchorRect.right - menuWidth),
    window.innerWidth - menuWidth - 8
  );
  const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 420);

  const style: React.CSSProperties = {
    position: 'fixed',
    left,
    top,
    zIndex: 99999,
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="w-64 bg-[#212121] rounded-md shadow-2xl py-2 border border-white/10 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            item.onClick?.();
            onClose();
          }}
          className={`flex items-center gap-4 w-full px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left font-medium ${
            item.danger ? 'text-red-400' : 'text-white'
          }`}
        >
          <item.icon
            className={`w-5 h-5 shrink-0 ${item.iconClassName ?? (item.danger ? 'text-red-400' : 'text-white/70')}`}
          />
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
