import { useState, useEffect } from 'react';
import { ParkingSpot, ParkingZone, getParkingSpotsByZone, getParkingZones } from '@/lib/parkingService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Layers, MapPin, ArrowRightLeft, Plus, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ParkingLayout() {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  // Group spots by level and section
  const groupedSpots: Record<string, Record<string, ParkingSpot[]>> = {};
  const levels: string[] = [];

  if (spots.length > 0) {
    spots.forEach((spot) => {
      if (!groupedSpots[spot.level]) {
        groupedSpots[spot.level] = {};
        levels.push(spot.level);
      }
      
      if (!groupedSpots[spot.level][spot.section]) {
        groupedSpots[spot.level][spot.section] = [];
      }
      
      groupedSpots[spot.level][spot.section].push(spot);
    });
    
    // Sort levels
    levels.sort();
    
    // Set default selected level if not already set
    if (!selectedLevel && levels.length > 0) {
      setSelectedLevel(levels[0]);
    }
  }

  const fetchZones = async () => {
    try {
      setLoading(true);
      const zonesData = await getParkingZones();
      setZones(zonesData);
      setLoading(false);
      
      // Auto-select the first zone if available
      if (zonesData.length > 0 && zonesData[0].id) {
        handleZoneChange(zonesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load parking zones",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleZoneChange = async (zoneId: string) => {
    setSelectedZone(zoneId);
    setSelectedLevel('');
    
    if (!zoneId) {
      setSpots([]);
      return;
    }
    
    try {
      setLoadingSpots(true);
      const spotsData = await getParkingSpotsByZone(zoneId);
      
      // Sort spots by level, section, and spot number
      spotsData.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level.localeCompare(b.level);
        }
        if (a.section !== b.section) {
          return a.section.localeCompare(b.section);
        }
        return a.spotNumber.localeCompare(b.spotNumber);
      });
      
      setSpots(spotsData);
      setLoadingSpots(false);
    } catch (error) {
      console.error('Error fetching spots for zone:', error);
      setLoadingSpots(false);
      toast({
        title: "Error",
        description: "Failed to load parking spots",
        variant: "destructive"
      });
    }
  };

  // Get zone details for selected zone
  const selectedZoneDetails = zones.find(zone => zone.id === selectedZone);

  // Get currency symbol
  const getCurrencySymbol = (code: string = 'USD') => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
      'INR': '₹', 'RUB': '₽', 'KRW': '₩', 'BRL': 'R$', 'AUD': 'A$',
      'CAD': 'C$', 'CHF': 'CHF', 'SGD': 'S$', 'NZD': 'NZ$', 'ZAR': 'R',
      'HKD': 'HK$', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł'
    };
    return symbols[code] || code;
  };

  // Calculate summary stats
  const totalSpots = spots.length;
  const availableSpots = spots.filter(s => !s.isOccupied).length;
  const occupiedSpots = spots.filter(s => s.isOccupied).length;
  const availablePercentage = totalSpots > 0 ? Math.round((availableSpots / totalSpots) * 100) : 0;

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Parking Layout</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8">
            <Link to="/zone-management" className="flex items-center">
              <Layers className="mr-1 h-3 w-3" />
              Zones
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-8">
            <Link to="/parking-management" className="flex items-center">
              <MapPin className="mr-1 h-3 w-3" />
              Spots
            </Link>
          </Button>
        </div>
      </div>
      
      {zones.length === 0 && !loading ? (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <div>
                <h3 className="text-base font-medium">No Parking Zones Available</h3>
                <p className="text-xs text-black/60">
                  You need to create parking zones before viewing layouts
                </p>
              </div>
              <Button size="sm" asChild>
                <Link to="/zone-management" className="flex items-center">
                  <ArrowRightLeft className="mr-1 h-3 w-3" />
                  Go to Zone Management
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sidebar with zone selection and stats */}
          <div className="md:col-span-1">
            <Card className="mb-4">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Select Zone</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Select
                  value={selectedZone}
                  onValueChange={handleZoneChange}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id!} className="text-xs">
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {selectedZoneDetails && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Zone Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-3 py-2 border-b">
                    <p className="text-xs font-medium">{selectedZoneDetails.name}</p>
                    {selectedZoneDetails.description && (
                      <p className="text-xs text-black/60 mt-1">{selectedZoneDetails.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 divide-x">
                    <div className="p-3">
                      <p className="text-xs text-black/60">Hourly Rate</p>
                      <p className="text-sm font-medium">
                        {getCurrencySymbol(selectedZoneDetails.currency)}
                        {selectedZoneDetails.hourlyRate.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-black/60">Total Spots</p>
                      <p className="text-sm font-medium">{totalSpots}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border-t">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <Badge variant="secondary" className="h-5 text-xs mr-1">
                          {availableSpots}
                        </Badge>
                        <span className="text-xs">Available</span>
                      </div>
                      <span className="text-xs font-medium">{availablePercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full" 
                        style={{ width: `${availablePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="p-3 border-t">
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs" asChild>
                      <Link to="/parking-management" className="flex items-center justify-center">
                        <Plus className="mr-1 h-3 w-3" />
                        Add Spots
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-3">
            {loadingSpots ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : selectedZone && spots.length === 0 ? (
              <Card className="border-dashed h-40">
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <p className="text-sm text-gray-500 mb-2">No parking spots available in this zone</p>
                  <Button size="sm" asChild>
                    <Link to="/parking-management" className="flex items-center">
                      <Plus className="mr-1 h-3 w-3" />
                      Add Parking Spots
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : levels.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Parking Map</CardTitle>
                    <div className="flex gap-1">
                      {levels.map(level => (
                        <Button 
                          key={level}
                          size="sm"
                          variant={selectedLevel === level ? "default" : "outline"}
                          className="h-6 text-xs px-2"
                          onClick={() => setSelectedLevel(level)}
                        >
                          L{level}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedLevel && groupedSpots[selectedLevel] && (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {Object.keys(groupedSpots[selectedLevel]).sort().map(section => (
                        <Card key={`${selectedLevel}-${section}`} className="overflow-hidden shadow-sm">
                          <CardHeader className="py-2 px-3 bg-gray-50">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-xs font-medium">Section {section}</CardTitle>
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                {groupedSpots[selectedLevel][section].length} spots
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-2">
                            <div className="grid grid-cols-6 gap-1">
                              {groupedSpots[selectedLevel][section].map(spot => (
                                <div 
                                  key={spot.id} 
                                  className={`
                                    border rounded-sm p-1 text-center text-xs
                                    ${spot.isOccupied 
                                      ? 'bg-red-50 border-red-200 text-red-600' 
                                      : 'bg-green-50 border-green-200 text-green-600'}
                                  `}
                                  title={`Spot ${spot.spotNumber} - ${spot.isOccupied ? 'Occupied' : 'Vacant'}`}
                                >
                                  {spot.spotNumber}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 