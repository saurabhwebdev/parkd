import { useState, useEffect } from 'react';
import { 
  ParkingSpot, 
  ParkingZone,
  getParkingSpots, 
  toggleParkingSpotStatus, 
  deleteParkingSpot, 
  addParkingSpot,
  getParkingZones,
  getParkingSpotsByZone
} from '@/lib/parkingService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash, Filter, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Link } from "react-router-dom";

export default function ParkingManagement() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingZones, setLoadingZones] = useState(true);
  const [addingSpots, setAddingSpots] = useState(false);
  const [summary, setSummary] = useState({ total: 0, occupied: 0, vacant: 0 });
  const [newSpot, setNewSpot] = useState({
    spotNumber: '',
    level: '1',
    section: 'A',
    zoneId: '',
    isOccupied: false
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      const zonesData = await getParkingZones();
      setZones(zonesData);
      
      // Default for new spot form
      if (zonesData.length > 0 && zonesData[0].id) {
        setNewSpot(prev => ({ ...prev, zoneId: zonesData[0].id! }));
      }
      
      setLoadingZones(false);
    } catch (error) {
      console.error('Error fetching zones:', error);
      setLoadingZones(false);
      toast({
        title: "Error",
        description: "Failed to load parking zones",
        variant: "destructive"
      });
    }
  };

  const fetchParkingSpots = async (zoneId: string = 'all') => {
    try {
      setLoading(true);
      
      let spotsData: ParkingSpot[];
      
      if (zoneId === 'all') {
        spotsData = await getParkingSpots();
      } else {
        spotsData = await getParkingSpotsByZone(zoneId);
      }
      
      setSpots(spotsData);
      
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
    fetchZones();
    fetchParkingSpots();
  }, []);

  const handleToggleStatus = async (spotId: string, currentStatus: boolean) => {
    try {
      await toggleParkingSpotStatus(spotId, !currentStatus);
      // Update local state
      setSpots(spots.map(spot => 
        spot.id === spotId ? { ...spot, isOccupied: !currentStatus } : spot
      ));
      
      // Update summary
      const newOccupied = currentStatus 
        ? summary.occupied - 1 
        : summary.occupied + 1;
      setSummary({
        ...summary,
        occupied: newOccupied,
        vacant: summary.total - newOccupied
      });
      
      toast({
        title: "Success",
        description: `Spot marked as ${!currentStatus ? 'occupied' : 'vacant'}`,
      });
    } catch (error) {
      console.error('Error toggling spot status:', error);
      toast({
        title: "Error",
        description: "Failed to update spot status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    try {
      await deleteParkingSpot(spotId);
      
      // Find the spot to check if it was occupied
      const deletedSpot = spots.find(spot => spot.id === spotId);
      const wasOccupied = deletedSpot?.isOccupied || false;
      
      // Update local state
      const updatedSpots = spots.filter(spot => spot.id !== spotId);
      setSpots(updatedSpots);
      
      // Update summary
      setSummary({
        total: summary.total - 1,
        occupied: wasOccupied ? summary.occupied - 1 : summary.occupied,
        vacant: wasOccupied ? summary.vacant : summary.vacant - 1
      });
      
      toast({
        title: "Success",
        description: "Parking spot deleted",
      });
    } catch (error) {
      console.error('Error deleting spot:', error);
      toast({
        title: "Error",
        description: "Failed to delete parking spot",
        variant: "destructive"
      });
    }
  };

  const handleAddSpot = async () => {
    try {
      if (!newSpot.spotNumber.trim()) {
        toast({
          title: "Error",
          description: "Spot number is required",
          variant: "destructive"
        });
        return;
      }
      
      if (!newSpot.zoneId) {
        toast({
          title: "Error",
          description: "Please select a zone for this spot",
          variant: "destructive"
        });
        return;
      }
      
      // If bulk mode is enabled, handle comma-separated spot numbers
      if (isBulkMode) {
        await handleBulkAddSpots();
        return;
      }
      
      // Check for duplicate spot number
      const isDuplicate = spots.some(
        spot => spot.spotNumber === newSpot.spotNumber &&
               spot.level === newSpot.level &&
               spot.section === newSpot.section &&
               spot.zoneId === newSpot.zoneId
      );
      
      if (isDuplicate) {
        toast({
          title: "Error",
          description: "This spot already exists in the selected zone",
          variant: "destructive"
        });
        return;
      }
      
      const spotId = await addParkingSpot(newSpot);
      
      // Update local state with the new spot
      const newSpotWithId: ParkingSpot = {
        ...newSpot,
        id: spotId
      };
      
      setSpots([...spots, newSpotWithId]);
      
      // Update summary
      setSummary({
        total: summary.total + 1,
        occupied: newSpot.isOccupied ? summary.occupied + 1 : summary.occupied,
        vacant: newSpot.isOccupied ? summary.vacant : summary.vacant + 1
      });
      
      // Reset form and close dialog
      setNewSpot({
        spotNumber: '',
        level: '1',
        section: 'A',
        zoneId: newSpot.zoneId, // Keep the last selected zone for convenience
        isOccupied: false
      });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "New parking spot added",
      });
    } catch (error) {
      console.error('Error adding spot:', error);
      toast({
        title: "Error",
        description: "Failed to add parking spot",
        variant: "destructive"
      });
    }
  };

  // Handle bulk spot creation
  const handleBulkAddSpots = async () => {
    try {
      setAddingSpots(true);
      
      // Parse comma-separated spot numbers
      const spotNumbers = newSpot.spotNumber
        .split(',')
        .map(spot => spot.trim())
        .filter(spot => spot !== '');
      
      if (spotNumbers.length === 0) {
        toast({
          title: "Error",
          description: "No valid spot numbers provided",
          variant: "destructive"
        });
        setAddingSpots(false);
        return;
      }
      
      // Check for duplicates against existing spots
      const existingSpotNumbers = spots
        .filter(spot => 
          spot.level === newSpot.level && 
          spot.section === newSpot.section && 
          spot.zoneId === newSpot.zoneId
        )
        .map(spot => spot.spotNumber);
      
      const duplicates = spotNumbers.filter(num => existingSpotNumbers.includes(num));
      
      if (duplicates.length > 0) {
        toast({
          title: "Error",
          description: `The following spot numbers already exist: ${duplicates.join(', ')}`,
          variant: "destructive"
        });
        setAddingSpots(false);
        return;
      }
      
      // Add each spot
      const addedSpots: ParkingSpot[] = [];
      let successCount = 0;
      
      for (const spotNumber of spotNumbers) {
        try {
          const spotData = {
            ...newSpot,
            spotNumber
          };
          
          const spotId = await addParkingSpot(spotData);
          
          // Create spot with ID for local state
          const newSpotWithId: ParkingSpot = {
            ...spotData,
            id: spotId
          };
          
          addedSpots.push(newSpotWithId);
          successCount++;
        } catch (error) {
          console.error(`Error adding spot ${spotNumber}:`, error);
        }
      }
      
      // Update local state with all successfully added spots
      setSpots([...spots, ...addedSpots]);
      
      // Update summary
      const newOccupiedCount = newSpot.isOccupied ? addedSpots.length : 0;
      setSummary({
        total: summary.total + addedSpots.length,
        occupied: summary.occupied + newOccupiedCount,
        vacant: summary.vacant + (addedSpots.length - newOccupiedCount)
      });
      
      // Reset form and close dialog
      setNewSpot({
        spotNumber: '',
        level: '1',
        section: 'A',
        zoneId: newSpot.zoneId, // Keep the last selected zone for convenience
        isOccupied: false
      });
      setIsAddDialogOpen(false);
      setAddingSpots(false);
      setIsBulkMode(false);
      
      toast({
        title: "Success",
        description: `Added ${successCount} parking spots`,
      });
    } catch (error) {
      console.error('Error in bulk add spots:', error);
      setAddingSpots(false);
      toast({
        title: "Error",
        description: "Failed to add parking spots",
        variant: "destructive"
      });
    }
  };

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    fetchParkingSpots(zoneId);
  };

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    // Clear the spot number when switching modes
    setNewSpot({...newSpot, spotNumber: ''});
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Parking Management</h1>
          <p className="text-black/60 mt-1">Manage parking spots across different zones</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="w-full md:w-60">
            <Select value={selectedZone} onValueChange={handleZoneChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by zone" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id!}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" /> Add Spot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Parking Spot</DialogTitle>
                <DialogDescription>
                  Enter the details for the new parking spot.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="zoneId">Parking Zone</Label>
                  <Select 
                    value={newSpot.zoneId} 
                    onValueChange={(value) => setNewSpot({...newSpot, zoneId: value})}
                    disabled={zones.length === 0}
                  >
                    <SelectTrigger id="zoneId">
                      <SelectValue placeholder={zones.length === 0 ? "Loading zones..." : "Select zone"} />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id!}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {zones.length === 0 && (
                    <p className="text-xs text-black/60 mt-1">
                      No zones available. <Link to="/zone-management" className="text-black underline">Add a zone first</Link>
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkMode" className="cursor-pointer flex items-center">
                    <input
                      type="checkbox"
                      id="bulkMode"
                      checked={isBulkMode}
                      onChange={toggleBulkMode}
                      className="mr-2 rounded border-gray-300 text-black focus:ring-black"
                    />
                    Bulk Create Spots
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    type="button"
                    className="text-xs text-black/70 hover:text-black"
                    onClick={() => {
                      toast({
                        title: "Bulk Creation Help",
                        description: "Enter spot numbers separated by commas (e.g., 101, 102, 103) to create multiple spots with the same level and section."
                      });
                    }}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Help
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="spotNumber">
                    {isBulkMode ? "Spot Numbers (comma-separated)" : "Spot Number"}
                  </Label>
                  <Input
                    id="spotNumber"
                    value={newSpot.spotNumber}
                    onChange={(e) => setNewSpot({...newSpot, spotNumber: e.target.value})}
                    placeholder={isBulkMode ? "e.g. 101, 102, 103" : "e.g. 101"}
                  />
                  {isBulkMode && (
                    <p className="text-xs text-black/60 mt-1">
                      Enter spot numbers separated by commas
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={newSpot.level}
                      onValueChange={(value) => setNewSpot({...newSpot, level: value})}
                    >
                      <SelectTrigger id="level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '4', '5'].map(level => (
                          <SelectItem key={level} value={level}>Level {level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={newSpot.section}
                      onValueChange={(value) => setNewSpot({...newSpot, section: value})}
                    >
                      <SelectTrigger id="section">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A', 'B', 'C', 'D', 'E'].map(section => (
                          <SelectItem key={section} value={section}>Section {section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOccupied"
                    checked={newSpot.isOccupied}
                    onChange={(e) => setNewSpot({...newSpot, isOccupied: e.target.checked})}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <Label htmlFor="isOccupied" className="cursor-pointer">Initially occupied</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleAddSpot} 
                  disabled={zones.length === 0 || addingSpots}
                >
                  {addingSpots ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    `Add ${isBulkMode ? 'Spots' : 'Spot'}`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-black/60">Total Spots</p>
                <h3 className="text-2xl font-bold">{summary.total}</h3>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {selectedZone === 'all' ? 'All Zones' : zones.find(z => z.id === selectedZone)?.name || ''}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-black/60">Available</p>
                <h3 className="text-2xl font-bold">{summary.vacant}</h3>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 px-3 py-1">
                {summary.total > 0 ? `${Math.round((summary.vacant / summary.total) * 100)}%` : '0%'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-black/60">Occupied</p>
                <h3 className="text-2xl font-bold">{summary.occupied}</h3>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 px-3 py-1">
                {summary.total > 0 ? `${Math.round((summary.occupied / summary.total) * 100)}%` : '0%'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration with Zone Management */}
      {zones.length === 0 && !loadingZones && (
        <Card className="mb-8 border-dashed">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-medium">No Parking Zones Available</h3>
                <p className="text-sm text-black/60 mt-1">
                  You need to create parking zones before adding parking spots
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

      {/* Spots Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : spots.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No parking spots available{selectedZone !== 'all' ? ' in this zone' : ''}.</p>
        </div>
      ) : (
        // Parking spots grid with smaller cards
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {spots.map((spot) => (
            <Card key={spot.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold">{spot.spotNumber}</h3>
                    <Badge variant={spot.isOccupied ? "destructive" : "secondary"} className="text-xs px-1 py-0">
                      {spot.isOccupied ? 'Occupied' : 'Vacant'}
                    </Badge>
                  </div>
                  <p className="text-xs text-black/60">
                    L{spot.level}, Sec {spot.section} · {zones.find(z => z.id === spot.zoneId)?.name || 'Unknown'}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-xs px-2 flex-1"
                      onClick={() => handleToggleStatus(spot.id!, spot.isOccupied)}
                    >
                      {spot.isOccupied ? 'Mark Vacant' : 'Mark Occupied'}
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700" 
                      onClick={() => handleDeleteSpot(spot.id!)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 