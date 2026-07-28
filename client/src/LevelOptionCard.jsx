import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Thẻ chọn bậc học — dùng chung ở LevelPicker (lần đầu đăng nhập) và
 * SettingsPanel (đổi bậc sau này), nên tách riêng thay vì lặp lại 2 nơi.
 */
export default function LevelOptionCard({ title, detail, lines, selected, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1.5 rounded-lg border bg-secondary/40 p-4 text-left transition-colors',
        selected
          ? 'border-primary bg-secondary/70'
          : 'border-border hover:border-[var(--hairline-strong)] hover:bg-secondary/60'
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-[18px] shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} />}
        </span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </span>
      <span className="pl-[26px] text-sm text-muted-foreground">{detail}</span>
      {lines && (
        <span className="flex flex-col gap-0.5 pl-[26px] text-xs text-muted-foreground/80">
          {lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      )}
    </button>
  );
}
