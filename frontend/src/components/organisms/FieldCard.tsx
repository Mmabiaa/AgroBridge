import { Maximize2, Edit, Trash2, MoreVertical, Sprout } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Field {
  id: string;
  name: string;
  size_hectares: number;
  soil_type?: string;
  irrigation_type?: string;
  is_active: boolean;
  created_at: string;
}

interface FieldCardProps {
  field: Field;
  onClick?: (fieldId: string) => void;
  onEdit?: (fieldId: string) => void;
  onDelete?: (fieldId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function FieldCard({
  field,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className,
}: FieldCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(field.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(field.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(field.id);
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1">{field.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={field.is_active ? 'default' : 'secondary'}>
                {field.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {showActions && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Field
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Field
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Maximize2 className="h-3 w-3" />
              <span className="text-xs">Size</span>
            </div>
            <p className="text-sm font-semibold">
              {field.size_hectares} ha
            </p>
          </div>

          {field.soil_type && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Sprout className="h-3 w-3" />
                <span className="text-xs">Soil Type</span>
              </div>
              <p className="text-sm font-semibold capitalize">
                {field.soil_type}
              </p>
            </div>
          )}
        </div>

        {field.irrigation_type && (
          <div className="text-xs text-muted-foreground">
            Irrigation: <span className="capitalize">{field.irrigation_type}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
