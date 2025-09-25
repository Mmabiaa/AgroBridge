import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Sprout, 
  Scissors, 
  ShoppingCart, 
  MapPin,
  Sun,
  CloudRain,
  Thermometer
} from 'lucide-react';

interface CropSchedule {
  crop: string;
  plantingStart: string;
  plantingEnd: string;
  harvestStart: string;
  harvestEnd: string;
  bestSellingPeriod: string;
  duration: number;
  tips: string[];
  weatherNotes: string;
}

const cropSchedules: { [key: string]: CropSchedule } = {
  'Tomatoes': {
    crop: 'Tomatoes',
    plantingStart: 'March',
    plantingEnd: 'April',
    harvestStart: 'June',
    harvestEnd: 'August',
    bestSellingPeriod: 'June - September',
    duration: 90,
    tips: [
      'Plant in well-drained soil with good sunlight',
      'Water regularly but avoid overwatering',
      'Support plants with stakes or cages',
      'Monitor for pests like aphids and whiteflies'
    ],
    weatherNotes: 'Thrives in warm weather (20-30°C), sensitive to frost'
  },
  'Maize': {
    crop: 'Maize',
    plantingStart: 'March',
    plantingEnd: 'May',
    harvestStart: 'July',
    harvestEnd: 'September',
    bestSellingPeriod: 'August - November',
    duration: 120,
    tips: [
      'Plant in rows with proper spacing',
      'Requires regular watering during growth',
      'Fertilize with nitrogen-rich fertilizer',
      'Harvest when kernels are firm and milky'
    ],
    weatherNotes: 'Needs consistent rainfall, drought-tolerant once established'
  },
  'Yam': {
    crop: 'Yam',
    plantingStart: 'February',
    plantingEnd: 'March',
    harvestStart: 'October',
    harvestEnd: 'December',
    bestSellingPeriod: 'November - February',
    duration: 240,
    tips: [
      'Plant in mounds or ridges',
      'Requires well-drained soil',
      'Support vines with trellises',
      'Harvest carefully to avoid damage'
    ],
    weatherNotes: 'Prefers warm, humid conditions, sensitive to waterlogging'
  }
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CropCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('Tomatoes');
  const [selectedLocation, setSelectedLocation] = useState('Kumasi');

  const currentMonth = months[new Date().getMonth()];
  const schedule = cropSchedules[selectedCrop];

  const getMonthActivities = (month: string) => {
    const activities = [];
    const monthIndex = months.indexOf(month);
    const plantingStart = months.indexOf(schedule.plantingStart);
    const plantingEnd = months.indexOf(schedule.plantingEnd);
    const harvestStart = months.indexOf(schedule.harvestStart);
    const harvestEnd = months.indexOf(schedule.harvestEnd);

    if (monthIndex >= plantingStart && monthIndex <= plantingEnd) {
      activities.push('planting');
    }
    if (monthIndex >= harvestStart && monthIndex <= harvestEnd) {
      activities.push('harvesting');
    }

    return activities;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Crop Calendar - {selectedCrop}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger>
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(cropSchedules).map(crop => (
                  <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kumasi">Kumasi</SelectItem>
                <SelectItem value="Accra">Accra</SelectItem>
                <SelectItem value="Tamale">Tamale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {months.map(month => {
              const activities = getMonthActivities(month);
              const isCurrent = month === currentMonth;
              
              return (
                <div
                  key={month}
                  className={`p-3 rounded-lg border-2 text-center ${
                    isCurrent ? 'border-primary bg-primary/10 font-semibold' : 'border-border'
                  }`}
                >
                  <div className="text-xs font-medium mb-2">{month}</div>
                  <div className="space-y-1">
                    {activities.map(activity => (
                      <Badge key={activity} variant="outline" className="text-xs">
                        {activity === 'planting' ? <Sprout className="h-3 w-3" /> : <Scissors className="h-3 w-3" />}
                        <span className="ml-1 capitalize">{activity}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Crop Details & Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Growing Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{schedule.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planting Period:</span>
                  <span className="font-medium">{schedule.plantingStart} - {schedule.plantingEnd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harvest Period:</span>
                  <span className="font-medium">{schedule.harvestStart} - {schedule.harvestEnd}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Weather Notes</h4>
              <p className="text-sm text-muted-foreground">{schedule.weatherNotes}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Growing Tips</h4>
            <ul className="space-y-1 text-sm">
              {schedule.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 