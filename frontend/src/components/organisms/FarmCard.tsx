import React from 'react';
import { MapPin, Maximize2, Sprout, TrendingUp, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Farm {
  id: string;
  name: string;
  description?: string;
  area: number;
  area_unit: 'hectares' | 'acres';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
  statistics?: {
    active_fields: number;
    total_crops: number;
    yield_this_season?: number;
  };
}

interface FarmCardProps {
  farm: Farm;
  onClick?: (farmId: string) => void;
  onEdit?: (farmId: string) => void;
  onDelete?: (farmId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function FarmCard({
  farm,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className,
}: FarmCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(farm.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(farm.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(farm.id);
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

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-lg',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header with Map Preview */}
      <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800">
        {/* Map placeholder - in production, this would be a real map */}
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>

        {/* Actions Menu */}
        {showActions && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Farm
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Farm
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Area Badge */}
        <Badge className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm">
          <Maximize2 className="h-3 w-3 mr-1" />
          {farm.area} {farm.area_unit}
        </Badge>
      </div>

      <CardHeader className="p-4 pb-2">
        {/* Farm Name */}
        <h3 className="font-semibold text-lg line-clamp-1">{farm.name}</h3>

        {/* Description */}
        {farm.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {farm.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Location */}
        {farm.location.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{farm.location.address}</span>
          </div>
        )}

        {/* Statistics */}
        {farm.statistics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Maximize2 className="h-3 w-3" />
                <span className="text-xs">Fields</span>
              </div>
              <p className="text-lg font-semibold">
                {farm.statistics.active_fields}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Sprout className="h-3 w-3" />
                <span className="text-xs">Crops</span>
              </div>
              <p className="text-lg font-semibold">
                {farm.statistics.total_crops}
              </p>
            </div>

            {farm.statistics.yield_this_season !== undefined && (
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">Yield This Season</span>
                </div>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {farm.statistics.yield_this_season.toLocaleString()} kg
                </p>
              </div>
            )}
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-muted-foreground">
          Created {formatDate(farm.created_at)}
        </div>
      </CardContent>

      {/* Footer Actions */}
      {showActions && onClick && (
        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCardClick}
          >
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
