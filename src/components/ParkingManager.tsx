import { useState, useEffect } from 'react';
import { getParkingSpots } from '@/lib/parkingService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function ParkingManager() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, occupied: 0, vacant: 0 });

  const fetchParkingSpots = async () => {
    try {
      setLoading(true);
      const spotsData = await getParkingSpots();
      
      // Calculate summary
      const total = spotsData.length;
      const occupied = spotsData.filter(spot => spot.isOccupied).length;
      const vacant = total - occupied;
      setSummary({ total, occupied, vacant });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load parking spots",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchParkingSpots();
  }, []);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Spots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Occupied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{summary.occupied}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Vacant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{summary.vacant}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 