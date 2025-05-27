import { useState, useEffect, useRef } from 'react';
import { 
  ParkingSpot, 
  ParkingZone, 
  ParkingRecord, 
  VehicleStatus,
  getParkingSpots, 
  getParkingZones, 
  recordVehicleEntry, 
  recordVehicleExit,
  getActiveParkingRecords,
  getParkingRecordById,
  getParkingSpotsByZone,
  getParkingRecordsHistory
} from '@/lib/parkingService';
import { processLicensePlate, cleanup, initTesseract } from '@/lib/licensePlateDetection';
import { loadOpenCV } from '@/lib/opencvLoader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, LogOut, Layers, MapPin, ArrowRightLeft, ParkingCircle, ChevronUp, ChevronDown, Filter, Camera } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Define sort options
type SortField = 'licensePlate' | 'zone' | 'entryTime' | 'exitTime' | 'duration' | 'fee' | 'status';
type SortDirection = 'asc' | 'desc';

export default function VehicleEntryExit() {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [activeRecords, setActiveRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(false);
  
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedSpot, setSelectedSpot] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [exitDetails, setExitDetails] = useState<{
    id: string;
    licensePlate: string;
    entryTime: Date;
    exitTime: Date;
    durationMinutes: number;
    fee: number;
    currency?: string;
  } | null>(null);
  
  const [currentRecord, setCurrentRecord] = useState<string>('');

  // History state variables
  const [historyRecords, setHistoryRecords] = useState<ParkingRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("active");
  
  // Sort and filter state
  const [sortField, setSortField] = useState<SortField>('entryTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [licensePlateFilter, setLicensePlateFilter] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all' | null>(null);

  // Add camera related state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Add loading state for OpenCV
  const [isOpenCVLoading, setIsOpenCVLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch zones
      const zonesData = await getParkingZones();
      setZones(zonesData);
      
      // Fetch active parking records
      const recordsData = await getActiveParkingRecords();
      setActiveRecords(recordsData);

      // Fetch all parking spots to show available spots count
      const spotsData = await getParkingSpots();
      setSpots(spotsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleZoneChange = async (zoneId: string) => {
    setSelectedZone(zoneId);
    setSelectedSpot('');
    
    if (!zoneId) return;
    
    try {
      setLoadingSpots(true);
      const spotsData = await getParkingSpotsByZone(zoneId);
      // Filter out spots that are already occupied
      const availableSpots = spotsData.filter(spot => !spot.isOccupied);
      setSpots(availableSpots);
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

  const handleEntrySubmit = async () => {
    if (!selectedZone || !selectedSpot || !licensePlate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await recordVehicleEntry({
        licensePlate: licensePlate.toUpperCase(),
        parkingSpotId: selectedSpot,
        zoneId: selectedZone
      });
      
      // Clear form
      setLicensePlate('');
      setSelectedSpot('');
      setIsEntryDialogOpen(false);
      
      // Refresh data
      fetchData();
      
      toast({
        title: "Success",
        description: "Vehicle entry recorded",
      });
    } catch (error) {
      console.error('Error recording entry:', error);
      toast({
        title: "Error",
        description: "Failed to record vehicle entry",
        variant: "destructive"
      });
    }
  };

  const openExitDialog = (recordId: string) => {
    setCurrentRecord(recordId);
    setIsExitDialogOpen(true);
  };

  const handleExitSubmit = async () => {
    if (!currentRecord) return;
    
    try {
      const result = await recordVehicleExit(currentRecord);
      
      setExitDetails({
        id: result.id,
        licensePlate: result.licensePlate,
        entryTime: result.entryTime.toDate(),
        exitTime: result.exitTime.toDate(),
        durationMinutes: result.durationMinutes,
        fee: result.fee,
        currency: result.currency
      });
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Error recording exit:', error);
      toast({
        title: "Error",
        description: "Failed to record vehicle exit",
        variant: "destructive"
      });
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Format duration in a readable way
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hours`;
    } else {
      return `${hours} hours, ${mins} minutes`;
    }
  };

  // Get zone name by ID
  const getZoneName = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : 'Unknown Zone';
  };

  // Fetch history records
  const fetchHistoryRecords = async () => {
    try {
      setLoadingHistory(true);
      const historyData = await getParkingRecordsHistory(startDate, endDate);
      setHistoryRecords(historyData);
      setLoadingHistory(false);
    } catch (error) {
      console.error('Error fetching history data:', error);
      setLoadingHistory(false);
      toast({
        title: "Error",
        description: "Failed to load history data",
        variant: "destructive"
      });
    }
  };

  // Trigger history fetch when date range changes
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistoryRecords();
    }
  }, [startDate, endDate, activeTab]);

  // Filter and sort history records
  const filteredAndSortedHistoryRecords = (): ParkingRecord[] => {
    // First filter the records
    let filtered = [...historyRecords];
    
    if (licensePlateFilter) {
      filtered = filtered.filter(record => 
        record.licensePlate.toLowerCase().includes(licensePlateFilter.toLowerCase())
      );
    }
    
    if (zoneFilter && zoneFilter !== 'all') {
      filtered = filtered.filter(record => record.zoneId === zoneFilter);
    }
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    
    // Then sort the filtered records
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'licensePlate':
          comparison = a.licensePlate.localeCompare(b.licensePlate);
          break;
        case 'zone':
          comparison = getZoneName(a.zoneId).localeCompare(getZoneName(b.zoneId));
          break;
        case 'entryTime':
          comparison = a.entryTime.toMillis() - b.entryTime.toMillis();
          break;
        case 'exitTime':
          // Handle null exitTime (still parked)
          if (!a.exitTime && !b.exitTime) comparison = 0;
          else if (!a.exitTime) comparison = 1;
          else if (!b.exitTime) comparison = -1;
          else comparison = a.exitTime.toMillis() - b.exitTime.toMillis();
          break;
        case 'duration':
          // Handle null duration (still parked)
          if (!a.durationMinutes && !b.durationMinutes) comparison = 0;
          else if (!a.durationMinutes) comparison = 1;
          else if (!b.durationMinutes) comparison = -1;
          else comparison = a.durationMinutes - b.durationMinutes;
          break;
        case 'fee':
          // Handle null fee (still parked)
          if (!a.fee && !b.fee) comparison = 0;
          else if (!a.fee) comparison = 1;
          else if (!b.fee) comparison = -1;
          else comparison = a.fee - b.fee;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  // Toggle sort direction or set new sort field
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setLicensePlateFilter('');
    setZoneFilter(null);
    setStatusFilter(null);
  };

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

  // Function to start the camera
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Make sure video is playing before allowing capture
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            console.log('Camera started successfully');
          }
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
      setIsCameraOpen(false);
    }
  };

  // Function to stop the camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log('Camera stopped');
    }
  };

  // Function to capture image and detect license plate
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas reference not available');
      return;
    }
    
    setIsProcessing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Could not get canvas context');
      setIsProcessing(false);
      return;
    }
    
    try {
      console.log('Capturing image...');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      console.log('Image captured, processing with OpenCV and Tesseract...');
      
      // Process the image to detect and recognize license plate
      const licensePlateText = await processLicensePlate(canvas);
      
      if (licensePlateText) {
        console.log('License plate detected:', licensePlateText);
        // Set the license plate text in the input field
        setLicensePlate(licensePlateText);
        
        toast({
          title: "License Plate Detected",
          description: `Detected plate: ${licensePlateText}`,
        });
      } else {
        console.log('No license plate detected');
        toast({
          title: "Detection Failed",
          description: "No license plate detected. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing license plate:', error);
      toast({
        title: "Detection Error",
        description: "An error occurred while processing the image.",
        variant: "destructive"
      });
    } finally {
      // Close camera dialog and processing state
      setIsCameraOpen(false);
      setIsProcessing(false);
      stopCamera();
    }
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
      cleanup(); // Clean up Tesseract worker
    };
  }, []);

  // Function to handle camera button click
  const handleCameraClick = async () => {
    try {
      setIsOpenCVLoading(true);
      
      // Start loading OpenCV.js and initialize Tesseract
      console.log('Loading OpenCV and initializing Tesseract...');
      
      // Initialize Tesseract worker in advance
      await initTesseract();
      
      // Load OpenCV
      await loadOpenCV();
      
      console.log('Libraries loaded successfully');
      
      // Open camera dialog
      setIsCameraOpen(true);
      
      // Start camera after dialog is open
      setTimeout(startCamera, 100);
    } catch (error) {
      console.error('Error loading libraries:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load image processing libraries. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsOpenCVLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Vehicle Entry/Exit</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8">
            <Link to="/zone-management" className="flex items-center">
              <Layers className="mr-1 h-3 w-3" />
              Zones
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-8">
            <Link to="/parking-layout" className="flex items-center">
              <ParkingCircle className="mr-1 h-3 w-3" />
              Layout
            </Link>
          </Button>
          <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="h-8">
                <Plus className="mr-1 h-3 w-3" /> Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Vehicle Entry</DialogTitle>
                <DialogDescription>
                  Enter the vehicle details to record its entry into the parking facility.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="licensePlate" className="flex items-center">
                    License Plate <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="licensePlate"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="e.g. ABC123"
                      className="uppercase flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCameraClick}
                      disabled={isOpenCVLoading}
                      title="Scan license plate"
                    >
                      {isOpenCVLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the vehicle's license plate number or use camera to scan
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="zone" className="flex items-center">
                    Parking Zone <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={selectedZone}
                    onValueChange={handleZoneChange}
                  >
                    <SelectTrigger id="zone" className={selectedZone ? "" : "text-muted-foreground"}>
                      <SelectValue placeholder="Select a parking zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No zones available</div>
                      ) : (
                        zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id!}>
                            {zone.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {zones.length === 0 ? (
                    <p className="text-xs text-red-500">
                      No zones available. <Link to="/zone-management" className="underline">Add a zone first</Link>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Select the zone where the vehicle will park
                    </p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="spot" className="flex items-center">
                    Parking Spot <span className="text-red-500 ml-1">*</span>
                  </Label>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="spot"
                        variant="outline"
                        role="combobox"
                        disabled={!selectedZone || loadingSpots}
                        className={`w-full justify-between text-left font-normal ${
                          loadingSpots ? "text-muted-foreground animate-pulse" : 
                          selectedSpot ? "" : "text-muted-foreground"
                        }`}
                      >
                        {selectedSpot ? 
                          spots.find(spot => spot.id === selectedSpot)?.spotNumber || "Select a parking spot" : 
                          loadingSpots ? "Loading spots..." : "Select a parking spot"
                        }
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="max-h-[300px] overflow-auto">
                        {spots.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No available spots</div>
                        ) : (
                          (() => {
                            // Group spots by level and section
                            const availableSpots = spots.filter(spot => !spot.isOccupied);
                            
                            if (availableSpots.length === 0) {
                              return <div className="p-2 text-sm text-muted-foreground">No available spots</div>;
                            }
                            
                            // Group by level first
                            const spotsByLevel: Record<string, ParkingSpot[]> = {};
                            availableSpots.forEach(spot => {
                              if (!spotsByLevel[spot.level]) {
                                spotsByLevel[spot.level] = [];
                              }
                              spotsByLevel[spot.level].push(spot);
                            });
                            
                            // Sort levels
                            const sortedLevels = Object.keys(spotsByLevel).sort();
                            
                            return sortedLevels.map(level => {
                              // Group by section within each level
                              const spotsBySection: Record<string, ParkingSpot[]> = {};
                              spotsByLevel[level].forEach(spot => {
                                if (!spotsBySection[spot.section]) {
                                  spotsBySection[spot.section] = [];
                                }
                                spotsBySection[spot.section].push(spot);
                              });
                              
                              // Sort sections
                              const sortedSections = Object.keys(spotsBySection).sort();
                              
                              return (
                                <div key={level} className="mb-2">
                                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                                    Level {level}
                                  </div>
                                  {sortedSections.map(section => (
                                    <div key={`${level}-${section}`} className="mb-2">
                                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                        Section {section}
                                      </div>
                                      <div className="grid grid-cols-4 gap-1 p-1">
                                        {spotsBySection[section]
                                          .sort((a, b) => a.spotNumber.localeCompare(b.spotNumber, undefined, { numeric: true }))
                                          .map(spot => (
                                            <Button 
                                              key={spot.id} 
                                              variant={selectedSpot === spot.id ? "default" : "outline"}
                                              className="h-8 text-xs px-2"
                                              onClick={() => {
                                                setSelectedSpot(spot.id!);
                                              }}
                                            >
                                              {spot.spotNumber}
                                            </Button>
                                          ))
                                        }
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            });
                          })()
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {selectedZone && spots.filter(spot => !spot.isOccupied).length === 0 && !loadingSpots ? (
                    <p className="text-xs text-red-500">
                      No available spots in this zone. <Link to="/parking-management" className="underline">Add more spots</Link>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {!selectedZone ? "Select a zone first to see available spots" : "Select an available parking spot"}
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEntryDialogOpen(false);
                    // Reset form fields
                    setLicensePlate('');
                    setSelectedSpot('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEntrySubmit} 
                  disabled={!selectedZone || !selectedSpot || !licensePlate.trim()}
                  className={!selectedZone || !selectedSpot || !licensePlate.trim() ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Record Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {zones.length === 0 && !loading ? (
        <Card className="border-dashed mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <div>
                <h3 className="text-base font-medium">No Parking Zones Available</h3>
                <p className="text-xs text-black/60">
                  You need to create parking zones before recording vehicle entries
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
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-black/60">Active Vehicles</p>
                    <h3 className="text-2xl font-bold">{activeRecords.length}</h3>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <ParkingCircle className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-black/60">Available Spots</p>
                    <h3 className="text-2xl font-bold">
                      {spots.filter(spot => !spot.isOccupied).length}
                    </h3>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-black/60">Total Zones</p>
                    <h3 className="text-2xl font-bold">{zones.length}</h3>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="w-full mb-2 bg-transparent border-b p-0 h-auto">
              <div className="flex">
                <TabsTrigger 
                  value="active" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2 h-auto"
                >
                  Active Vehicles
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2 h-auto"
                >
                  Vehicle History
                </TabsTrigger>
              </div>
            </TabsList>

            <TabsContent value="active" className="mt-0">
              {/* Active Vehicles Section */}
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Currently Parked Vehicles</CardTitle>
                    <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                      <Link to="/reports">
                        View Reports
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {activeRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No vehicles currently parked</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-medium">License Plate</TableHead>
                            <TableHead className="text-xs font-medium">Zone</TableHead>
                            <TableHead className="text-xs font-medium">Entry Time</TableHead>
                            <TableHead className="text-xs font-medium text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeRecords.map(record => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium text-sm py-2">{record.licensePlate}</TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="font-normal text-xs">
                                  {getZoneName(record.zoneId)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">{formatDate(record.entryTime.toDate())}</TableCell>
                              <TableCell className="text-right py-2">
                                <Dialog open={isExitDialogOpen && currentRecord === record.id} onOpenChange={(open) => {
                                  setIsExitDialogOpen(open);
                                  if (!open) {
                                    setExitDetails(null);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openExitDialog(record.id!)}
                                      className="h-7 text-xs"
                                    >
                                      <LogOut className="mr-1 h-3 w-3" />
                                      Exit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Record Vehicle Exit</DialogTitle>
                                      <DialogDescription>
                                        {exitDetails ? 'Vehicle exit has been recorded.' : 'Confirm the exit of this vehicle.'}
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    {exitDetails ? (
                                      <div className="space-y-4">
                                        <div className="p-4 bg-black/5 rounded-lg space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-sm font-medium">License Plate:</span>
                                            <span className="text-sm">{exitDetails.licensePlate}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm font-medium">Entry Time:</span>
                                            <span className="text-sm">{formatDate(exitDetails.entryTime)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm font-medium">Exit Time:</span>
                                            <span className="text-sm">{formatDate(exitDetails.exitTime)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm font-medium">Duration:</span>
                                            <span className="text-sm">{formatDuration(exitDetails.durationMinutes)}</span>
                                          </div>
                                          <div className="flex justify-between border-t pt-2 mt-2">
                                            <span className="font-medium">Fee:</span>
                                            <span className="font-bold">
                                              {getCurrencySymbol(exitDetails.currency)}{exitDetails.fee.toFixed(2)} {exitDetails.currency || 'USD'}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <DialogFooter>
                                          <Button 
                                            onClick={() => {
                                              setIsExitDialogOpen(false);
                                              setExitDetails(null);
                                            }}
                                          >
                                            Close
                                          </Button>
                                        </DialogFooter>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="py-4">
                                          <p className="text-center">
                                            Are you sure you want to record the exit for vehicle <strong>{record.licensePlate}</strong>?
                                          </p>
                                        </div>
                                        <DialogFooter>
                                          <Button variant="outline" onClick={() => setIsExitDialogOpen(false)}>Cancel</Button>
                                          <Button onClick={handleExitSubmit}>Confirm Exit</Button>
                                        </DialogFooter>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {/* Vehicle History Section */}
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Vehicle History</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => {
                        const csvContent = [
                          ["License Plate", "Zone", "Entry Time", "Exit Time", "Duration", "Fee", "Status"].join(","),
                          ...filteredAndSortedHistoryRecords().map(record => [
                            record.licensePlate,
                            getZoneName(record.zoneId),
                            formatDate(record.entryTime.toDate()),
                            record.exitTime ? formatDate(record.exitTime.toDate()) : "-",
                            record.durationMinutes ? formatDuration(record.durationMinutes) : "-",
                            record.fee ? `${getCurrencySymbol(record.currency)}${record.fee.toFixed(2)} ${record.currency || 'USD'}` : "-",
                            record.status === VehicleStatus.PARKED ? "Parked" : "Exited"
                          ].join(","))
                        ].join("\n");
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.setAttribute('href', url);
                        a.setAttribute('download', `vehicle-history-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`);
                        a.click();
                      }}
                    >
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Filters Section */}
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="flex-1 min-w-[180px]">
                        <Label htmlFor="start-date" className="text-xs mb-1 block">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="start-date"
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-8 text-xs"
                            >
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {startDate ? format(startDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={(date) => date && setStartDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="flex-1 min-w-[180px]">
                        <Label htmlFor="end-date" className="text-xs mb-1 block">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="end-date"
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-8 text-xs"
                            >
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {endDate ? format(endDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={(date) => date && setEndDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="flex items-end">
                        <Button onClick={fetchHistoryRecords} size="sm" className="h-8 mb-0 text-xs">
                          Apply
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[180px]">
                        <Label htmlFor="license-filter" className="text-xs mb-1 block">License Plate</Label>
                        <Input
                          id="license-filter"
                          value={licensePlateFilter}
                          onChange={(e) => setLicensePlateFilter(e.target.value)}
                          placeholder="Filter by license plate"
                          className="h-8 text-xs"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-[180px]">
                        <Label htmlFor="zone-filter" className="text-xs mb-1 block">Zone</Label>
                        <Select
                          value={zoneFilter || undefined}
                          onValueChange={setZoneFilter}
                        >
                          <SelectTrigger id="zone-filter" className="h-8 text-xs">
                            <SelectValue placeholder="All zones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All zones</SelectItem>
                            {zones.map(zone => (
                              <SelectItem key={zone.id} value={zone.id!}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1 min-w-[180px]">
                        <Label htmlFor="status-filter" className="text-xs mb-1 block">Status</Label>
                        <Select
                          value={statusFilter || undefined}
                          onValueChange={(value) => setStatusFilter(value as VehicleStatus | 'all' | null)}
                        >
                          <SelectTrigger id="status-filter" className="h-8 text-xs">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value={VehicleStatus.PARKED}>Currently Parked</SelectItem>
                            <SelectItem value={VehicleStatus.EXITED}>Exited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button variant="outline" onClick={resetFilters} size="sm" className="h-8 mb-0 text-xs">
                          <Filter className="mr-1 h-3 w-3" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {loadingHistory ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No vehicle records found in the selected date range</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="cursor-pointer text-xs font-medium" onClick={() => handleSort('licensePlate')}>
                              <div className="flex items-center">
                                License Plate
                                {sortField === 'licensePlate' && (
                                  sortDirection === 'asc' ? 
                                    <ChevronUp className="ml-1 h-3 w-3" /> : 
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-xs font-medium" onClick={() => handleSort('zone')}>
                              <div className="flex items-center">
                                Zone
                                {sortField === 'zone' && (
                                  sortDirection === 'asc' ? 
                                    <ChevronUp className="ml-1 h-3 w-3" /> : 
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-xs font-medium" onClick={() => handleSort('entryTime')}>
                              <div className="flex items-center">
                                Entry Time
                                {sortField === 'entryTime' && (
                                  sortDirection === 'asc' ? 
                                    <ChevronUp className="ml-1 h-3 w-3" /> : 
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-xs font-medium" onClick={() => handleSort('exitTime')}>
                              <div className="flex items-center">
                                Exit Time
                                {sortField === 'exitTime' && (
                                  sortDirection === 'asc' ? 
                                    <ChevronUp className="ml-1 h-3 w-3" /> : 
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-xs font-medium" onClick={() => handleSort('duration')}>
                              <div className="flex items-center">
                                Duration
                                {sortField === 'duration' && (
                                  sortDirection === 'asc' ? 
                                    <ChevronUp className="ml-1 h-3 w-3" /> : 
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-xs font-medium" onClick={() => handleSort('fee')}>
                              <div className="flex items-center">
                                Fee
                                {sortField === 'fee' && (
                                  sortDirection === 'asc' ? 
                                    <ChevronUp className="ml-1 h-3 w-3" /> : 
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-xs font-medium" onClick={() => handleSort('status')}>
                              <div className="flex items-center">
                                Status
                                {sortField === 'status' && (
                                  sortDirection === 'asc' ? 
                                    <ChevronUp className="ml-1 h-3 w-3" /> : 
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedHistoryRecords().map(record => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium text-sm py-2">{record.licensePlate}</TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="font-normal text-xs">
                                  {getZoneName(record.zoneId)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">{formatDate(record.entryTime.toDate())}</TableCell>
                              <TableCell className="text-xs py-2">
                                {record.exitTime ? formatDate(record.exitTime.toDate()) : "-"}
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                {record.durationMinutes ? formatDuration(record.durationMinutes) : "-"}
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                {record.fee ? `${getCurrencySymbol(record.currency)}${record.fee.toFixed(2)}` : "-"}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge 
                                  variant={record.status === VehicleStatus.PARKED ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {record.status === VehicleStatus.PARKED ? "Parked" : "Exited"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="text-xs text-black/60 mt-3 px-2">
                        Showing {filteredAndSortedHistoryRecords().length} of {historyRecords.length} records
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Camera Dialog for License Plate Detection */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => {
        setIsCameraOpen(open);
        if (!open) {
          stopCamera();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan License Plate</DialogTitle>
            <DialogDescription>
              Position the camera so the license plate is clearly visible
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCameraOpen(false);
                  stopCamera();
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={captureImage}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 