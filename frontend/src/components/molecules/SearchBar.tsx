import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  defaultValue?: string;
  className?: string;
  showClearButton?: boolean;
}

/**
 * SearchBar - Molecular component with debounced search input
 * 
 * A search input with icon, debouncing, and optional clear button.
 * Optimizes API calls by debouncing user input.
 * 
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="Search products..."
 *   onSearch={(query) => console.log(query)}
 *   debounceMs={300}
 *   showClearButton
 * />
 * ```
 */
export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      placeholder = 'Search...',
      onSearch,
      debounceMs = 300,
      defaultValue = '',
      className,
      showClearButton = true,
    },
    ref
  ) => {
    const [value, setValue] = React.useState(defaultValue);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    // Debounced search effect
    React.useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onSearch(value);
      }, debounceMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [value, debounceMs, onSearch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    };

    const handleClear = () => {
      setValue('');
      onSearch('');
    };

    return (
      <div className={cn('relative flex items-center', className)}>
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        
        <Input
          ref={ref}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={cn(
            'pl-9',
            showClearButton && value && 'pr-9'
          )}
          aria-label={placeholder}
        />
        
        {showClearButton && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 h-7 w-7 p-0"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
