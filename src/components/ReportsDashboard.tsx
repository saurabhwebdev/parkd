import { useState, useEffect } from 'react';
import { getDailyRevenue, getOccupancyReport, getParkingZones } from '@/lib/parkingService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, RefreshCw, Layers, MapPin, ArrowRightLeft, ParkingCircle, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<{amount: number, currency: string}>({amount: 0, currency: 'USD'});
  const [occupancyReport, setOccupancyReport] = useState<{
    total: number;
    occupied: number;
    vacant: number;
    occupancyRate: number;
    byZone: {
      [zoneId: string]: {
        zoneName: string;
        total: number;
        occupied: number;
        vacant: number;
        occupancyRate: number;
      }
    }
  } | null>(null);

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Get today's date
      const today = new Date();
      
      // Get daily revenue
      const dailyRevenue = await getDailyRevenue(today);
      
      // Get zones to check for default currency if needed
      const zones = await getParkingZones();
      
      // If there's no revenue or the currency is defaulted to USD,
      // and we have zones available, use the first zone's currency
      if ((dailyRevenue.amount === 0 || dailyRevenue.currency === 'USD') && zones.length > 0) {
        dailyRevenue.currency = zones[0].currency || 'USD';
      }
      
      setRevenue(dailyRevenue);
      
      // Get occupancy report
      const occupancy = await getOccupancyReport();
      setOccupancyReport(occupancy);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-black/60 mt-1">View parking data and performance metrics</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/zone-management" className="flex items-center">
              <Layers className="mr-2 h-4 w-4" />
              Manage Zones
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/parking-layout" className="flex items-center">
              <ParkingCircle className="mr-2 h-4 w-4" />
              View Layout
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={fetchReports}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Zone Management Integration Notice */}
      {occupancyReport && Object.keys(occupancyReport.byZone).length === 0 && (
        <Card className="mb-8 border-dashed">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-medium">No Parking Zone Data Available</h3>
                <p className="text-sm text-black/60 mt-1">
                  You need to create parking zones and add spots to generate reports
                </p>
              </div>
              <Button asChild>
                <Link to="/zone-management" className="flex items-center">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Go to Zone Management
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Today's Revenue</CardTitle>
                    <CardDescription>
                      {format(new Date(), 'MMMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-black/5 rounded-lg">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {getCurrencySymbol(revenue.currency)}{revenue.amount.toFixed(2)}
                  <span className="text-sm text-muted-foreground ml-1">{revenue.currency}</span>
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Overall Occupancy</CardTitle>
                    <CardDescription>
                      Current parking usage
                    </CardDescription>
                  </div>
                  {occupancyReport && (
                    <Badge variant={occupancyReport.occupancyRate > 80 ? "destructive" : "outline"}>
                      {occupancyReport.occupancyRate.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {occupancyReport && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-black/60">
                        {occupancyReport.occupied} of {occupancyReport.total} spots occupied
                      </span>
                    </div>
                    <Progress 
                      value={occupancyReport.occupancyRate} 
                      className={`h-2 ${
                        occupancyReport.occupancyRate > 80 
                          ? 'bg-red-100' 
                          : occupancyReport.occupancyRate > 50 
                            ? 'bg-orange-100' 
                            : 'bg-green-100'
                      }`} 
                    />
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Available Spots</CardTitle>
                    <CardDescription>
                      Vacant parking spots
                    </CardDescription>
                  </div>
                  {occupancyReport && (
                    <Badge variant={occupancyReport.vacant < 5 ? "destructive" : "secondary"}>
                      {occupancyReport.vacant}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-green-500">
                    {occupancyReport?.vacant || 0}
                  </p>
                  <p className="text-sm text-black/60">
                    {occupancyReport && occupancyReport.total > 0 ? 
                      `${(100 - occupancyReport.occupancyRate).toFixed(1)}% available` : 
                      'No data'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Occupancy by Zone */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Occupancy by Zone</CardTitle>
                  <CardDescription>
                    Breakdown of parking usage by zone
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/zone-management" className="flex items-center text-sm">
                    <Layers className="mr-1 h-3 w-3" />
                    Manage Zones
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {occupancyReport && Object.keys(occupancyReport.byZone).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Total Spots</TableHead>
                        <TableHead>Occupied</TableHead>
                        <TableHead>Vacant</TableHead>
                        <TableHead>Occupancy Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(occupancyReport.byZone).map(([zoneId, data]) => (
                        <TableRow key={zoneId}>
                          <TableCell className="font-medium">{data.zoneName}</TableCell>
                          <TableCell>{data.total}</TableCell>
                          <TableCell>{data.occupied}</TableCell>
                          <TableCell>{data.vacant}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">{data.occupancyRate.toFixed(1)}%</span>
                              <Progress 
                                value={data.occupancyRate} 
                                className={`h-2 w-24 ${
                                  data.occupancyRate > 80 
                                    ? 'bg-red-100' 
                                    : data.occupancyRate > 50 
                                      ? 'bg-orange-100' 
                                      : 'bg-green-100'
                                }`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No zone data available</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/zone-management">
                      Set Up Parking Zones
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-black/60">
                Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
              </p>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 