import { useState, useEffect } from 'react';
import { ParkingZone, addParkingZone, getParkingZones, updateParkingZone, deleteParkingZone } from '@/lib/parkingService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CurrencyInput from 'react-currency-input-field';
import currencyList from 'currency-list';

// Define common currencies manually to avoid issues with the currency-list package
const commonCurrencies = [
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' }
];

// Try to get additional currencies from the package, but fallback to common currencies if it fails
let allCurrencies = [];
try {
  const packageCurrencies = Object.values(currencyList.getAll() || {});
  if (packageCurrencies && packageCurrencies.length > 0) {
    allCurrencies = packageCurrencies
      .filter(c => c && c.name && c.code) // Filter out invalid entries
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    allCurrencies = [...commonCurrencies];
  }
} catch (error) {
  console.error('Error loading currencies from package:', error);
  allCurrencies = [...commonCurrencies];
}

export default function ZoneManagement() {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentZone, setCurrentZone] = useState<ParkingZone | null>(null);
  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    hourlyRate: 0,
    currency: 'USD'
  });
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

  // Get currency symbol
  const getCurrencySymbol = (code: string) => {
    const currency = allCurrencies.find(c => c.code === code) || 
                    commonCurrencies.find(c => c.code === code);
    return currency ? currency.symbol : '$';
  };

  const fetchZones = async () => {
    try {
      setLoading(true);
      const zonesData = await getParkingZones();
      
      // Set default currency for zones that don't have one
      const updatedZones = zonesData.map(zone => {
        if (!zone.currency) {
          return { ...zone, currency: 'USD' };
        }
        return zone;
      });
      
      setZones(updatedZones);
      setLoading(false);
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

  const handleAddZone = async () => {
    try {
      if (!newZone.name.trim()) {
        toast({
          title: "Error",
          description: "Zone name is required",
          variant: "destructive"
        });
        return;
      }

      if (newZone.hourlyRate <= 0) {
        toast({
          title: "Error",
          description: "Hourly rate must be greater than zero",
          variant: "destructive"
        });
        return;
      }
      
      const zoneId = await addParkingZone(newZone);
      
      // Update local state with the new zone
      const newZoneWithId: ParkingZone = {
        ...newZone,
        id: zoneId
      };
      
      setZones([...zones, newZoneWithId]);
      
      // Reset form and close dialog
      setNewZone({
        name: '',
        description: '',
        hourlyRate: 0,
        currency: 'USD'
      });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "New parking zone added",
      });
    } catch (error) {
      console.error('Error adding zone:', error);
      toast({
        title: "Error",
        description: "Failed to add parking zone",
        variant: "destructive"
      });
    }
  };

  const handleEditZone = async () => {
    try {
      if (!currentZone || !currentZone.id) return;
      
      if (!currentZone.name.trim()) {
        toast({
          title: "Error",
          description: "Zone name is required",
          variant: "destructive"
        });
        return;
      }

      if (currentZone.hourlyRate <= 0) {
        toast({
          title: "Error",
          description: "Hourly rate must be greater than zero",
          variant: "destructive"
        });
        return;
      }
      
      await updateParkingZone(currentZone.id, {
        name: currentZone.name,
        description: currentZone.description,
        hourlyRate: currentZone.hourlyRate,
        currency: currentZone.currency || 'USD'
      });
      
      // Update local state
      setZones(zones.map(zone => 
        zone.id === currentZone.id ? currentZone : zone
      ));
      
      setIsEditDialogOpen(false);
      setCurrentZone(null);
      
      toast({
        title: "Success",
        description: "Parking zone updated",
      });
    } catch (error) {
      console.error('Error updating zone:', error);
      toast({
        title: "Error",
        description: "Failed to update parking zone",
        variant: "destructive"
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!window.confirm("Are you sure you want to delete this zone? This will also affect parking spots in this zone.")) {
      return;
    }
    
    try {
      await deleteParkingZone(zoneId);
      
      // Update local state
      setZones(zones.filter(zone => zone.id !== zoneId));
      
      toast({
        title: "Success",
        description: "Parking zone deleted",
      });
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast({
        title: "Error",
        description: "Failed to delete parking zone",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (zone: ParkingZone) => {
    // Ensure currency is set
    const zoneWithCurrency = {
      ...zone,
      currency: zone.currency || 'USD'
    };
    setCurrentZone(zoneWithCurrency);
    setIsEditDialogOpen(true);
  };

  // Handle showing all currencies
  const handleShowAllCurrencies = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAllCurrencies(true);
  };

  // Display currencies - either all or just common ones
  const displayCurrencies = showAllCurrencies ? allCurrencies : commonCurrencies;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Parking Zones</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" /> Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Parking Zone</DialogTitle>
              <DialogDescription>
                Enter the details for the new parking zone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Zone Name</Label>
                <Input
                  id="name"
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                  placeholder="e.g. Floor 1, Outdoor Area"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newZone.description}
                  onChange={(e) => setNewZone({...newZone, description: e.target.value})}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={newZone.currency}
                  onValueChange={(value) => setNewZone({...newZone, currency: value})}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {displayCurrencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                    {!showAllCurrencies && (
                      <button
                        className="w-full py-2 px-2 text-center cursor-pointer hover:bg-gray-100 text-blue-600"
                        onClick={handleShowAllCurrencies}
                        type="button"
                      >
                        Show all currencies
                      </button>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Hourly Rate ({getCurrencySymbol(newZone.currency)})</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newZone.hourlyRate}
                  onChange={(e) => setNewZone({...newZone, hourlyRate: parseFloat(e.target.value)})}
                  placeholder="e.g. 5.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddZone}>Add Zone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Zone Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parking Zone</DialogTitle>
            <DialogDescription>
              Update the details for this parking zone.
            </DialogDescription>
          </DialogHeader>
          {currentZone && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Zone Name</Label>
                <Input
                  id="edit-name"
                  value={currentZone.name}
                  onChange={(e) => setCurrentZone({...currentZone, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={currentZone.description || ''}
                  onChange={(e) => setCurrentZone({...currentZone, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Select
                  value={currentZone.currency}
                  onValueChange={(value) => setCurrentZone({...currentZone, currency: value})}
                >
                  <SelectTrigger id="edit-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {displayCurrencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                    {!showAllCurrencies && (
                      <button
                        className="w-full py-2 px-2 text-center cursor-pointer hover:bg-gray-100 text-blue-600"
                        onClick={handleShowAllCurrencies}
                        type="button"
                      >
                        Show all currencies
                      </button>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-hourlyRate">
                  Hourly Rate ({getCurrencySymbol(currentZone.currency)})
                </Label>
                <Input
                  id="edit-hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentZone.hourlyRate}
                  onChange={(e) => setCurrentZone({...currentZone, hourlyRate: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditZone}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zones List */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <div className="col-span-3 flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : zones.length === 0 ? (
          <div className="col-span-3 text-center py-10">
            <p className="text-gray-500">No parking zones available. Add your first zone!</p>
          </div>
        ) : (
          zones.map((zone) => (
            <Card key={zone.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{zone.name}</CardTitle>
                {zone.description && <CardDescription>{zone.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="font-medium">
                  Hourly Rate: {getCurrencySymbol(zone.currency || 'USD')}{zone.hourlyRate.toFixed(2)} {zone.currency || 'USD'}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(zone)}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteZone(zone.id!)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}