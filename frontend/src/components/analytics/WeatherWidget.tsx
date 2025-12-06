/**
 * Weather Forecast Widget Component
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Cloud,
    CloudRain,
    Wind,
    Droplets,
    Thermometer,
    AlertTriangle,
    MapPin,
    Calendar,
    Sun
} from 'lucide-react';
import { useWeatherForecast } from '@/api/hooks/useAnalytics';
import { useFarms } from '@/api/hooks/useFarms';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';

interface WeatherWidgetProps {
    farmId?: string;
    compact?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    farmId: initialFarmId,
    compact = false
}) => {
    const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId || '');

    // Fetch farms list
    const { data: farmsData } = useFarms();
    const farms = farmsData?.results || [];

    // Fetch weather forecast
    const { data: weatherData, isLoading } = useWeatherForecast({
        farm_id: selectedFarmId || undefined,
    });

    const getWeatherIcon = (iconCode: string) => {
        const code = iconCode.toLowerCase();
        if (code.includes('rain') || code.includes('drizzle')) return CloudRain;
        if (code.includes('cloud')) return Cloud;
        if (code.includes('clear') || code.includes('sun')) return Sun;
        return Cloud;
    };

    const getSeverityColor = (severity: string): 'default' | 'destructive' => {
        switch (severity.toLowerCase()) {
            case 'severe':
            case 'extreme':
                return 'destructive';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    if (compact) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Weather
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="animate-pulse space-y-2">
                            <div className="bg-gray-200 h-8 w-24 rounded"></div>
                            <div className="bg-gray-200 h-4 w-32 rounded"></div>
                        </div>
                    ) : weatherData ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">{Math.round(weatherData.current.temperature)}°C</p>
                                    <p className="text-sm text-muted-foreground">{weatherData.current.description}</p>
                                </div>
                                {React.createElement(getWeatherIcon(weatherData.current.icon), {
                                    className: 'h-12 w-12 text-blue-600'
                                })}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                    <Droplets className="h-3 w-3 text-blue-600" />
                                    <span>{weatherData.current.humidity}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Wind className="h-3 w-3 text-gray-600" />
                                    <span>{weatherData.current.wind_speed} km/h</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No weather data available</p>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Farm Selector */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Cloud className="h-5 w-5" />
                                Weather Forecast
                            </CardTitle>
                            <CardDescription>
                                7-day weather outlook with alerts
                            </CardDescription>
                        </div>
                        <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Select farm" />
                            </SelectTrigger>
                            <SelectContent>
                                {farms.map((farm) => (
                                    <SelectItem key={farm.id} value={farm.id}>
                                        {farm.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {isLoading ? (
                <div className="grid gap-4">
                    <Card>
                        <CardContent className="py-12">
                            <div className="animate-pulse space-y-4">
                                <div className="bg-gray-200 h-24 w-full rounded"></div>
                                <div className="bg-gray-200 h-48 w-full rounded"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : !selectedFarmId ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Cloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Please select a farm to view weather forecast</p>
                    </CardContent>
                </Card>
            ) : weatherData ? (
                <>
                    {/* Weather Alerts */}
                    {weatherData.alerts && weatherData.alerts.length > 0 && (
                        <div className="space-y-3">
                            {weatherData.alerts.map((alert, index) => (
                                <Alert key={index} variant={getSeverityColor(alert.severity)}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle className="capitalize">{alert.type} Alert - {alert.severity}</AlertTitle>
                                    <AlertDescription>
                                        <p>{alert.message}</p>
                                        <p className="text-xs mt-2">
                                            {new Date(alert.start_time).toLocaleString()} - {new Date(alert.end_time).toLocaleString()}
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    )}

                    {/* Current Weather */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Current Weather</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {weatherData.location.city}
                                    </CardDescription>
                                </div>
                                {React.createElement(getWeatherIcon(weatherData.current.icon), {
                                    className: 'h-16 w-16 text-blue-600'
                                })}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <p className="text-5xl font-bold mb-2">
                                        {Math.round(weatherData.current.temperature)}°C
                                    </p>
                                    <p className="text-lg text-muted-foreground capitalize">
                                        {weatherData.current.description}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 rounded-full">
                                            <Droplets className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Humidity</p>
                                            <p className="font-medium">{weatherData.current.humidity}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-50 rounded-full">
                                            <Wind className="h-4 w-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Wind Speed</p>
                                            <p className="font-medium">{weatherData.current.wind_speed} km/h</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 rounded-full">
                                            <CloudRain className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Precipitation</p>
                                            <p className="font-medium">{weatherData.current.precipitation} mm</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-orange-50 rounded-full">
                                            <Thermometer className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Feels Like</p>
                                            <p className="font-medium">{Math.round(weatherData.current.temperature)}°C</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 7-Day Forecast */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                7-Day Forecast
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                {weatherData.forecast.slice(0, 7).map((day, index) => {
                                    const WeatherIcon = getWeatherIcon(day.icon);

                                    return (
                                        <Card key={index} className="border-2">
                                            <CardContent className="p-4">
                                                <div className="text-center space-y-2">
                                                    <p className="font-medium">{formatDate(day.date)}</p>
                                                    <WeatherIcon className="h-10 w-10 mx-auto text-blue-600" />
                                                    <p className="text-sm text-muted-foreground capitalize">{day.description}</p>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-lg font-bold">{Math.round(day.temperature_high)}°</span>
                                                        <span className="text-sm text-muted-foreground">{Math.round(day.temperature_low)}°</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Droplets className="h-3 w-3 text-blue-600" />
                                                            <span>{day.precipitation_chance}%</span>
                                                        </div>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Wind className="h-3 w-3 text-gray-600" />
                                                            <span>{day.wind_speed} km/h</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Daily Forecast */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Forecast</CardTitle>
                            <CardDescription>Hour-by-hour breakdown for planning</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {weatherData.forecast.slice(0, 7).map((day, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="text-center min-w-[80px]">
                                                <p className="font-medium">{formatDate(day.date)}</p>
                                            </div>
                                            {React.createElement(getWeatherIcon(day.icon), {
                                                className: 'h-8 w-8 text-blue-600'
                                            })}
                                            <div>
                                                <p className="font-medium capitalize">{day.description}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    High: {Math.round(day.temperature_high)}° / Low: {Math.round(day.temperature_low)}°
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <CloudRain className="h-4 w-4 text-blue-600" />
                                                <span>{day.precipitation_chance}%</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Droplets className="h-4 w-4 text-blue-600" />
                                                <span>{day.humidity}%</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Wind className="h-4 w-4 text-gray-600" />
                                                <span>{day.wind_speed} km/h</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No weather data available for this location</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default WeatherWidget;
