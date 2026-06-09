import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterButtonProps {
  options: FilterOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  title?: string;
}

const FilterButton = ({ options, selected, onSelectionChange, title = 'Filters' }: FilterButtonProps) => {
  const [open, setOpen] = useState(false);
  const hasActive = selected.length > 0;

  const toggle = (value: string) => {
    onSelectionChange(
      selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value]
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center gap-0.5 relative">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          {hasActive && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
          )}
          <span className="text-[10px] text-muted-foreground font-medium">Filter</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                selected.includes(opt.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {hasActive && (
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => onSelectionChange([])}
          >
            Clear all filters
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FilterButton;
