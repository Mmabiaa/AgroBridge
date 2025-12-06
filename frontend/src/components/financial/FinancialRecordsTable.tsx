import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Download } from 'lucide-react';
import { FinancialRecord } from '@/api/services/financial.service';
import { cn } from '@/lib/utils';

interface FinancialRecordsTableProps {
  records: FinancialRecord[];
  onEdit?: (record: FinancialRecord) => void;
  onDelete?: (recordId: string) => void;
  onView?: (record: FinancialRecord) => void;
}

export function FinancialRecordsTable({
  records,
  onEdit,
  onDelete,
  onView,
}: FinancialRecordsTableProps) {
  const getTypeColor = (type: 'income' | 'expense') => {
    return type === 'income'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount);
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No financial records found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first record to start tracking your finances
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {format(new Date(record.date), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <Badge className={cn('capitalize', getTypeColor(record.type))}>
                  {record.type}
                </Badge>
              </TableCell>
              <TableCell>{record.category}</TableCell>
              <TableCell className="max-w-xs truncate">
                {record.description || '-'}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-semibold',
                  record.type === 'income' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {record.type === 'income' ? '+' : '-'}
                {formatCurrency(record.amount, record.currency)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(record)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(record)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {record.receipt_url && (
                      <DropdownMenuItem asChild>
                        <a
                          href={record.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </a>
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(record.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
