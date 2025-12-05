/**
 * Molecular Components
 * 
 * Molecules are combinations of atoms that form simple, reusable UI patterns.
 * They combine multiple atomic components to create more complex functionality.
 */

export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ErrorState } from './ErrorState';
export type { ErrorStateProps } from './ErrorState';

// Re-export Card components from UI (already molecular in nature)
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

// Re-export Pagination components from UI (already molecular in nature)
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
