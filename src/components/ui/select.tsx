import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectOption = { value: string; label: string };

export function Select({
  id,
  label,
  value,
  options,
  onValueChange,
  disabled = false,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-label={label}
          className={cn('select-trigger', className)}
          disabled={disabled}
        >
          <span>{options.find((option) => option.value === value)?.label}</span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          className="select-content"
          align="start"
          sideOffset={6}
          collisionPadding={12}
        >
          <Dropdown.RadioGroup value={value} onValueChange={onValueChange} aria-label={label}>
            {options.map((option) => (
              <Dropdown.RadioItem key={option.value} value={option.value} className="select-option">
                <span>{option.label}</span>
                <Dropdown.ItemIndicator>
                  <Check size={15} aria-hidden="true" />
                </Dropdown.ItemIndicator>
              </Dropdown.RadioItem>
            ))}
          </Dropdown.RadioGroup>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
