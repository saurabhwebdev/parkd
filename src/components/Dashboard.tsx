import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  MapPin, Layers, Car, AreaChart, ArrowRight, 
  PieChart, Settings, Users, Loader2, ParkingCircle 
} from "lucide-react";
import { 
  getParkingSpotsSummary, 
  getOccupancyReport, 
  getParkingZones,
  getActiveParkingRecords
} from "@/lib/parkingService";
import { toast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parkingData, setParkingData] = useState({
    totalSpots: 0,
    availableSpots: 0,
    occupiedSpots: 0,
    occupancyRate: 0,
    revenue: 0,
    currency: 'USD',
    zonesCount: 0,
    activeVehicles: 0
  });

  // Define management modules for consistent navigation
  const managementModules = [
    {
      path: "/zone-management",
      name: "Zone Management",
      description: "Create and organize zones",
      icon: <Layers className="w-5 h-5 group-hover:text-white" />,
      order: 1
    },
    {
      path: "/parking-management",
      name: "Spots Management",
      description: "Add and assign spots",
      icon: <MapPin className="w-5 h-5 group-hover:text-white" />,
      order: 2
    },
    {
      path: "/parking-layout",
      name: "Parking Layout",
      description: "Visualize facility layout",
      icon: <ParkingCircle className="w-5 h-5 group-hover:text-white" />,
      order: 3
    },
    {
      path: "/vehicle-entry-exit",
      name: "Entry/Exit",
      description: "Manage vehicle movement",
      icon: <Car className="w-5 h-5 group-hover:text-white" />,
      order: 4
    },
    {
      path: "/reports",
      name: "Reports",
      description: "View analytics & data",
      icon: <AreaChart className="w-5 h-5 group-hover:text-white" />,
      order: 5
    }
  ];

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch parking summary
        const summary = await getParkingSpotsSummary();
        
        // Fetch zones
        const zones = await getParkingZones();
        
        // Fetch active parking records
        const activeRecords = await getActiveParkingRecords();
        
        // Calculate estimated revenue (just a simple calculation for display)
        let estimatedRevenue = 0;
        let primaryCurrency = 'USD';
        
        // Track currencies and amounts
        const currencyAmounts: { [currency: string]: number } = {};
        
        activeRecords.forEach(record => {
          estimatedRevenue += record.fee || 0;
          
          // Track by currency
          const currency = record.currency || 'USD';
          if (!currencyAmounts[currency]) {
            currencyAmounts[currency] = 0;
          }
          currencyAmounts[currency] += record.fee || 0;
        });
        
        // Find the most used currency
        let maxAmount = 0;
        
        Object.entries(currencyAmounts).forEach(([currency, amount]) => {
          if (amount > maxAmount) {
            primaryCurrency = currency;
            maxAmount = amount;
          }
        });
        
        // If no active records with fees, get currency from first zone
        if (Object.keys(currencyAmounts).length === 0 && zones.length > 0) {
          primaryCurrency = zones[0].currency || 'USD';
        }
        
        setParkingData({
          totalSpots: summary.total,
          availableSpots: summary.vacant,
          occupiedSpots: summary.occupied,
          occupancyRate: summary.occupancyRate,
          revenue: estimatedRevenue,
          currency: primaryCurrency,
          zonesCount: zones.length,
          activeVehicles: activeRecords.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white min-h-[calc(100vh-4rem-12rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
          <p className="text-black/60">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[calc(100vh-4rem-12rem)]">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-black/60 mt-2">Welcome back! Manage your parking facility efficiently.</p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black text-white hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/70 text-sm">Total Spots</p>
                  <h3 className="text-2xl font-bold mt-1">{parkingData.totalSpots}</h3>
                  <p className="text-white/70 text-xs mt-2">
                    {parkingData.zonesCount} Parking Zones
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Car className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-black/60 text-sm">Available</p>
                  <h3 className="text-2xl font-bold mt-1">{parkingData.availableSpots}</h3>
                  <p className="text-green-500 text-xs mt-2">
                    {parkingData.availableSpots > 0 
                      ? `${Math.round((parkingData.availableSpots / parkingData.totalSpots) * 100)}% availability`
                      : 'No spots available'}
                  </p>
                </div>
                <div className="bg-black/5 p-3 rounded-lg">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-black/60 text-sm">Occupied</p>
                  <h3 className="text-2xl font-bold mt-1">{parkingData.occupiedSpots}</h3>
                  <p className="text-black/60 text-xs mt-2">
                    {parkingData.occupiedSpots > 0 
                      ? `${Math.round(parkingData.occupancyRate)}% occupancy`
                      : 'No occupied spots'}
                  </p>
                </div>
                <div className="bg-black/5 p-3 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-black/60 text-sm">Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {getCurrencySymbol(parkingData.currency)}{parkingData.revenue.toFixed(2)}
                  </h3>
                  <p className="text-green-500 text-xs mt-2">
                    {parkingData.activeVehicles} active vehicles
                  </p>
                </div>
                <div className="bg-black/5 p-3 rounded-lg">
                  <PieChart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Management Modules Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Parking Management</h2>
            <p className="text-sm text-black/60">
              Integrated modules for complete facility management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {managementModules.sort((a, b) => a.order - b.order).map((module) => (
              <Link key={module.path} to={module.path}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-black/10 hover:border-black/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-black/5 rounded-lg">
                        {module.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{module.order}. {module.name}</h3>
                        <p className="text-sm text-black/60 mt-1">{module.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        
        {/* System Status */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6">System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Recent Activity</h3>
                  <Link to="/reports" className="text-sm text-black/60 hover:text-black">
                    <div className="flex items-center">
                      <span>View Reports</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </Link>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black/5">
                    <div className="flex items-center">
                      <Car className="h-5 w-5 mr-3" />
                      <div>
                        <p className="text-sm font-medium">Active Vehicles</p>
                        <p className="text-xs text-black/60">Currently parked</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold">{parkingData.activeVehicles}</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black/5">
                    <div className="flex items-center">
                      <Layers className="h-5 w-5 mr-3" />
                      <div>
                        <p className="text-sm font-medium">Zones</p>
                        <p className="text-xs text-black/60">Configured areas</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold">{parkingData.zonesCount}</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-black/5">
                    <div className="flex items-center">
                      <AreaChart className="h-5 w-5 mr-3" />
                      <div>
                        <p className="text-sm font-medium">Occupancy Rate</p>
                        <p className="text-xs text-black/60">Overall facility</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold">{Math.round(parkingData.occupancyRate)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Management Quick Links</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <Link to="/zone-management" className="flex items-center p-3 rounded-lg border border-black/10 hover:bg-black hover:text-white group transition-all duration-300">
                    <Layers className="h-5 w-5 mr-3 group-hover:text-white" />
                    <div>
                      <p className="text-sm font-medium">Zone Management</p>
                      <p className="text-xs text-black/60 group-hover:text-white/60">Configure parking zones</p>
                    </div>
                  </Link>
                  
                  <Link to="/parking-management" className="flex items-center p-3 rounded-lg border border-black/10 hover:bg-black hover:text-white group transition-all duration-300">
                    <MapPin className="h-5 w-5 mr-3 group-hover:text-white" />
                    <div>
                      <p className="text-sm font-medium">Spot Management</p>
                      <p className="text-xs text-black/60 group-hover:text-white/60">Add spots to zones</p>
                    </div>
                  </Link>
                  
                  <Link to="/parking-layout" className="flex items-center p-3 rounded-lg border border-black/10 hover:bg-black hover:text-white group transition-all duration-300">
                    <ParkingCircle className="h-5 w-5 mr-3 group-hover:text-white" />
                    <div>
                      <p className="text-sm font-medium">Parking Layout</p>
                      <p className="text-xs text-black/60 group-hover:text-white/60">View zone layouts</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}