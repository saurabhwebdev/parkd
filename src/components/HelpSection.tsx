import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Layers, Car, AreaChart, LogOut, Plus, User } from "lucide-react";

export default function HelpSection() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Help Center</h1>
      <p className="text-lg mb-8">
        Welcome to Parkd! This guide will help you understand how to use our parking management system.
      </p>

      <Tabs defaultValue="overview" className="mb-10">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Overview Section */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Understanding the Parkd parking management system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Parkd</h3>
                <p className="mb-4">
                  Parkd is a comprehensive parking management system designed to help you manage parking zones, 
                  spots, and track vehicle entry and exit. The system is organized into several key areas:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="border border-black/10 rounded-lg p-6 flex space-x-4">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Spots Management</h4>
                      <p className="text-sm text-black/70">Create and manage individual parking spots</p>
                    </div>
                  </div>
                  
                  <div className="border border-black/10 rounded-lg p-6 flex space-x-4">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Zone Management</h4>
                      <p className="text-sm text-black/70">Organize your parking into logical zones with different rates</p>
                    </div>
                  </div>
                  
                  <div className="border border-black/10 rounded-lg p-6 flex space-x-4">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Entry/Exit</h4>
                      <p className="text-sm text-black/70">Record when vehicles enter and exit the parking facility</p>
                    </div>
                  </div>
                  
                  <div className="border border-black/10 rounded-lg p-6 flex space-x-4">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <AreaChart className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Reports</h4>
                      <p className="text-sm text-black/70">Generate analytics and reports on parking usage</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Create parking zones for different areas of your facility</li>
                  <li>Add parking spots to each zone</li>
                  <li>Begin recording vehicle entries and exits</li>
                  <li>Generate reports to analyze usage patterns</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Section */}
        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>Management Features</CardTitle>
              <CardDescription>
                Detailed explanation of each management feature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <div className="flex items-center mb-4">
                  <MapPin className="mr-2 h-6 w-6" />
                  <h3 className="text-xl font-semibold">Spots Management</h3>
                </div>
                <div className="ml-8 space-y-4">
                  <p>
                    The Spots Management section allows you to create and manage individual parking spots 
                    within your zones.
                  </p>
                  
                  <div className="bg-black/5 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Create new parking spots with unique identifiers</li>
                      <li>Assign spots to specific zones</li>
                      <li>Organize spots by level and section for easy navigation</li>
                      <li>View spot occupancy status in real-time</li>
                      <li>Edit or delete spots as needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center mb-4">
                  <Layers className="mr-2 h-6 w-6" />
                  <h3 className="text-xl font-semibold">Zone Management</h3>
                </div>
                <div className="ml-8 space-y-4">
                  <p>
                    The Zone Management section allows you to create and organize parking zones, each with 
                    its own pricing structure.
                  </p>
                  
                  <div className="bg-black/5 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Create zones for different areas (e.g., "Floor 1", "VIP Section")</li>
                      <li>Set different hourly rates for each zone</li>
                      <li>Add descriptions to help identify zone purposes</li>
                      <li>Modify zone details as needed</li>
                      <li>Delete zones when they're no longer needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center mb-4">
                  <Car className="mr-2 h-6 w-6" />
                  <h3 className="text-xl font-semibold">Entry/Exit</h3>
                </div>
                <div className="ml-8 space-y-4">
                  <p>
                    The Entry/Exit section allows you to record when vehicles enter and exit your parking facility.
                  </p>
                  
                  <div className="bg-black/5 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Record vehicle entries with license plate information</li>
                      <li>Select available parking spots for incoming vehicles</li>
                      <li>Process vehicle exits and calculate parking fees</li>
                      <li>View currently parked vehicles in real-time</li>
                      <li>Generate receipts for exiting vehicles</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center mb-4">
                  <AreaChart className="mr-2 h-6 w-6" />
                  <h3 className="text-xl font-semibold">Reports</h3>
                </div>
                <div className="ml-8 space-y-4">
                  <p>
                    The Reports section provides analytics and insights into your parking facility usage.
                  </p>
                  
                  <div className="bg-black/5 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>View occupancy rates across different zones</li>
                      <li>Analyze parking duration patterns</li>
                      <li>Track revenue by zone and time period</li>
                      <li>Export reports for further analysis</li>
                      <li>Visualize data with interactive charts and graphs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Section */}
        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>End-to-End Workflow</CardTitle>
              <CardDescription>
                Understanding the complete parking management process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-10">
                <div className="relative">
                  {/* Step 1 */}
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white">
                        1
                      </div>
                      <div className="w-px h-full bg-black/20 mt-2"></div>
                    </div>
                    <div className="pb-8">
                      <h3 className="text-xl font-bold mb-2">Setup Zones</h3>
                      <p className="mb-4">
                        Start by creating parking zones to organize your parking facility. Each zone can have 
                        different pricing and characteristics.
                      </p>
                      <div className="bg-black/5 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">How to create a zone:</h4>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Navigate to Zone Management</li>
                          <li>Click "Add Zone" button</li>
                          <li>Enter zone name (e.g., "Floor 1", "VIP Section")</li>
                          <li>Add an optional description</li>
                          <li>Set the hourly rate for this zone</li>
                          <li>Click "Add Zone" to save</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white">
                        2
                      </div>
                      <div className="w-px h-full bg-black/20 mt-2"></div>
                    </div>
                    <div className="pb-8">
                      <h3 className="text-xl font-bold mb-2">Create Parking Spots</h3>
                      <p className="mb-4">
                        Add individual parking spots to each zone. Spots can be organized by level and section 
                        for easier management.
                      </p>
                      <div className="bg-black/5 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">How to add parking spots:</h4>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Navigate to Spots Management</li>
                          <li>Click "Add Spot" button</li>
                          <li>Enter spot number (e.g., "A1", "B12")</li>
                          <li>Select the zone this spot belongs to</li>
                          <li>Specify level and section information</li>
                          <li>Click "Add Spot" to save</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white">
                        3
                      </div>
                      <div className="w-px h-full bg-black/20 mt-2"></div>
                    </div>
                    <div className="pb-8">
                      <h3 className="text-xl font-bold mb-2">Record Vehicle Entry</h3>
                      <p className="mb-4">
                        When a vehicle enters your facility, record its details and assign it to an available spot.
                      </p>
                      <div className="bg-black/5 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">How to record a vehicle entry:</h4>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Navigate to Entry/Exit</li>
                          <li>Click "Record Entry" button</li>
                          <li>Enter the vehicle's license plate</li>
                          <li>Select the parking zone</li>
                          <li>Choose an available parking spot</li>
                          <li>Click "Record Entry" to save</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white">
                        4
                      </div>
                      <div className="w-px h-full bg-black/20 mt-2"></div>
                    </div>
                    <div className="pb-8">
                      <h3 className="text-xl font-bold mb-2">Record Vehicle Exit</h3>
                      <p className="mb-4">
                        When a vehicle leaves, process its exit, calculate the fee, and free up the parking spot.
                      </p>
                      <div className="bg-black/5 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">How to record a vehicle exit:</h4>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Navigate to Entry/Exit</li>
                          <li>Find the vehicle in the "Currently Parked" list</li>
                          <li>Click the "Exit" button for that vehicle</li>
                          <li>Confirm the exit</li>
                          <li>View the calculated fee and parking duration</li>
                          <li>The spot will automatically be marked as available</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white">
                        5
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Generate Reports</h3>
                      <p className="mb-4">
                        Analyze your parking facility's performance and usage patterns through reports.
                      </p>
                      <div className="bg-black/5 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">How to generate reports:</h4>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Navigate to Reports</li>
                          <li>Select the time period for analysis</li>
                          <li>View occupancy rates, revenue, and other metrics</li>
                          <li>Use filters to focus on specific zones or date ranges</li>
                          <li>Export reports if needed for further analysis</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Section */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions and answers about using Parkd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">How do I set up my parking facility from scratch?</h3>
                  <p>
                    Start by creating zones, then add parking spots to each zone. Once your structure is set up,
                    you can begin recording vehicle entries and exits.
                  </p>
                </div>
                
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Can I change the hourly rate for a zone?</h3>
                  <p>
                    Yes! Navigate to Zone Management, find the zone you want to modify, click the Edit button,
                    and update the hourly rate.
                  </p>
                </div>
                
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">What happens if a vehicle stays overnight?</h3>
                  <p>
                    The system will continue to track the vehicle's stay and calculate the fee based on the
                    total duration when the vehicle exits, regardless of how long it stays.
                  </p>
                </div>
                
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">How is the parking fee calculated?</h3>
                  <p>
                    The fee is calculated by multiplying the zone's hourly rate by the duration of the stay.
                    The system automatically rounds up to the next hour.
                  </p>
                </div>
                
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Can I delete a parking spot that's currently occupied?</h3>
                  <p>
                    For safety reasons, you cannot delete an occupied parking spot. The vehicle must exit first,
                    then you can delete the spot if needed.
                  </p>
                </div>
                
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">How do I view historical parking data?</h3>
                  <p>
                    Use the Reports section to view historical data. You can filter by date range and zone to
                    analyze specific periods or areas of your facility.
                  </p>
                </div>
                
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Can multiple users access the system simultaneously?</h3>
                  <p>
                    Yes, Parkd supports multiple users accessing the system at the same time, making it perfect
                    for facilities with multiple attendants or managers.
                  </p>
                </div>
                
                <div className="border border-black/10 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Is there a mobile version of Parkd?</h3>
                  <p>
                    Yes, Parkd is fully responsive and works on desktop, tablet, and mobile devices, allowing you
                    to manage your parking facility from anywhere.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 