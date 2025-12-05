import { Sprout, Calendar, TrendingUp, Edit, Trash2, MoreVertical, CheckCircle } from 'lucide-react';
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

interface Crop {
  id: string;
  crop_type: string;
  variety?: string;
  planting_date: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status: 'planted' | 'growing' | 'harvested' | 'failed';
  quantity_planted?: number;
  quantity_harvested?: number;
  unit?: string;
}

interface CropCardProps {
  crop: Crop;
  onClick?: (cropId: string) => void;
  onEdit?: (cropId: string) => void;
  onDelete?: (cropId: string) => void;
  onHarvest?: (cropId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function CropCard({
  crop,
  onClick,
  onEdit,
  onDelete,
  onHarvest,
  showActions = true,
  className,
}: CropCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(crop.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(crop.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(crop.id);
    }
  };

  const handleHarvest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHarvest) {
      onHarvest(crop.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planted':
        return 'secondary';
      case 'growing':
        return 'default';
      case 'harvested':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
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
            <h3 className="font-semibold text-lg line-clamp-1 capitalize">
              {crop.crop_type}
            </h3>
            {crop.variety && (
              <p className="text-sm text-muted-foreground">{crop.variety}</p>
            )}
            <Badge variant={getStatusColor(crop.status)}>
              {crop.status}
            </Badge>
          </div>

          {showActions && (onEdit || onDelete || onHarvest) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onHarvest && crop.status !== 'harvested' && crop.status !== 'failed' && (
                  <DropdownMenuItem onClick={handleHarvest}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Record Harvest
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Crop
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Crop
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Planted:</span>
            <span className="font-medium">{formatDate(crop.planting_date)}</span>
          </div>

          {crop.expected_harvest_date && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Expected Harvest:</span>
              <span className="font-medium">{formatDate(crop.expected_harvest_date)}</span>
            </div>
          )}

          {crop.actual_harvest_date && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">Harvested:</span>
              <span className="font-medium">{formatDate(crop.actual_harvest_date)}</span>
            </div>
          )}
        </div>

        {(crop.quantity_planted || crop.quantity_harvested) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            {crop.quantity_planted && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Sprout className="h-3 w-3" />
                  <span className="text-xs">Planted</span>
                </div>
                <p className="text-sm font-semibold">
                  {crop.quantity_planted} {crop.unit || 'units'}
                </p>
              </div>
            )}

            {crop.quantity_harvested && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">Harvested</span>
                </div>
                <p className="text-sm font-semibold text-green-600">
                  {crop.quantity_harvested} {crop.unit || 'units'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
