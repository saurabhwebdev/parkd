import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

// ======== Parking Spots ========

export interface ParkingSpot {
  id?: string;
  spotNumber: string;
  isOccupied: boolean;
  level: string;
  section: string;
  zoneId: string;
  createdAt?: any;
  updatedAt?: any;
}

// Collection reference
const parkingSpotsCollection = collection(db, 'parkingSpots');

// Add a new parking spot
export const addParkingSpot = async (spotData: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(parkingSpotsCollection, {
      ...spotData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding parking spot:', error);
    throw error;
  }
};

// Get all parking spots
export const getParkingSpots = async (): Promise<ParkingSpot[]> => {
  try {
    const querySnapshot = await getDocs(parkingSpotsCollection);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as ParkingSpot));
  } catch (error) {
    console.error('Error getting parking spots:', error);
    throw error;
  }
};

// Get parking spots by zone
export const getParkingSpotsByZone = async (zoneId: string): Promise<ParkingSpot[]> => {
  try {
    const q = query(parkingSpotsCollection, where("zoneId", "==", zoneId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as ParkingSpot));
  } catch (error) {
    console.error('Error getting parking spots by zone:', error);
    throw error;
  }
};

// Toggle parking spot status (occupied/vacant)
export const toggleParkingSpotStatus = async (spotId: string, isOccupied: boolean) => {
  try {
    const spotRef = doc(db, 'parkingSpots', spotId);
    await updateDoc(spotRef, {
      isOccupied,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating parking spot status:', error);
    throw error;
  }
};

// Delete a parking spot
export const deleteParkingSpot = async (spotId: string) => {
  try {
    const spotRef = doc(db, 'parkingSpots', spotId);
    await deleteDoc(spotRef);
    return true;
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    throw error;
  }
};

// Get summary of parking spots (total, occupied, vacant)
export const getParkingSpotsSummary = async () => {
  try {
    const spots = await getParkingSpots();
    const total = spots.length;
    const occupied = spots.filter(spot => spot.isOccupied).length;
    const vacant = total - occupied;
    
    return {
      total,
      occupied,
      vacant,
      occupancyRate: total > 0 ? (occupied / total) * 100 : 0
    };
  } catch (error) {
    console.error('Error getting parking spots summary:', error);
    throw error;
  }
};

// ======== Parking Zones ========

export interface ParkingZone {
  id?: string;
  name: string;
  description?: string;
  hourlyRate: number;
  currency: string;
  createdAt?: any;
  updatedAt?: any;
}

const parkingZonesCollection = collection(db, 'parkingZones');

// Add a new parking zone
export const addParkingZone = async (zoneData: Omit<ParkingZone, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(parkingZonesCollection, {
      ...zoneData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding parking zone:', error);
    throw error;
  }
};

// Get all parking zones
export const getParkingZones = async (): Promise<ParkingZone[]> => {
  try {
    const querySnapshot = await getDocs(parkingZonesCollection);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as ParkingZone));
  } catch (error) {
    console.error('Error getting parking zones:', error);
    throw error;
  }
};

// Get a parking zone by ID
export const getParkingZoneById = async (zoneId: string): Promise<ParkingZone | null> => {
  try {
    const zoneRef = doc(db, 'parkingZones', zoneId);
    const zoneSnap = await getDoc(zoneRef);
    
    if (zoneSnap.exists()) {
      return {
        id: zoneSnap.id,
        ...zoneSnap.data()
      } as ParkingZone;
    }
    return null;
  } catch (error) {
    console.error('Error getting parking zone:', error);
    throw error;
  }
};

// Update a parking zone
export const updateParkingZone = async (zoneId: string, zoneData: Partial<ParkingZone>) => {
  try {
    const zoneRef = doc(db, 'parkingZones', zoneId);
    await updateDoc(zoneRef, {
      ...zoneData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating parking zone:', error);
    throw error;
  }
};

// Delete a parking zone
export const deleteParkingZone = async (zoneId: string) => {
  try {
    const zoneRef = doc(db, 'parkingZones', zoneId);
    await deleteDoc(zoneRef);
    return true;
  } catch (error) {
    console.error('Error deleting parking zone:', error);
    throw error;
  }
};

// ======== Parking Entries/Exits ========

export enum VehicleStatus {
  PARKED = 'parked',
  EXITED = 'exited'
}

export interface ParkingRecord {
  id?: string;
  licensePlate: string;
  entryTime: Timestamp;
  exitTime?: Timestamp;
  parkingSpotId: string;
  zoneId: string;
  status: VehicleStatus;
  fee?: number;
  currency?: string;
  durationMinutes?: number;
  createdAt?: any;
  updatedAt?: any;
}

const parkingRecordsCollection = collection(db, 'parkingRecords');

// Record vehicle entry
export const recordVehicleEntry = async (data: {
  licensePlate: string;
  parkingSpotId: string;
  zoneId: string;
}) => {
  try {
    // Mark the spot as occupied
    await toggleParkingSpotStatus(data.parkingSpotId, true);
    
    // Create entry record
    const docRef = await addDoc(parkingRecordsCollection, {
      ...data,
      entryTime: serverTimestamp(),
      status: VehicleStatus.PARKED,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error recording vehicle entry:', error);
    throw error;
  }
};

// Record vehicle exit
export const recordVehicleExit = async (recordId: string) => {
  try {
    // Get the current record
    const recordRef = doc(db, 'parkingRecords', recordId);
    const recordSnap = await getDoc(recordRef);
    
    if (!recordSnap.exists()) {
      throw new Error('Parking record not found');
    }
    
    const recordData = recordSnap.data() as ParkingRecord;
    
    // Calculate duration in minutes
    const exitTime = Timestamp.now();
    const entryTime = recordData.entryTime;
    const durationMinutes = Math.ceil((exitTime.toMillis() - entryTime.toMillis()) / (1000 * 60));
    
    // Get zone hourly rate
    const zoneSnap = await getDoc(doc(db, 'parkingZones', recordData.zoneId));
    if (!zoneSnap.exists()) {
      throw new Error('Zone not found');
    }
    
    const zoneData = zoneSnap.data() as ParkingZone;
    const hourlyRate = zoneData.hourlyRate;
    const currency = zoneData.currency || 'USD';
    
    // Calculate fee
    const hours = Math.ceil(durationMinutes / 60);
    const fee = hours * hourlyRate;
    
    // Update record with exit info
    await updateDoc(recordRef, {
      exitTime,
      status: VehicleStatus.EXITED,
      fee,
      durationMinutes,
      currency,
      updatedAt: serverTimestamp()
    });
    
    // Mark the spot as vacant
    await toggleParkingSpotStatus(recordData.parkingSpotId, false);
    
    return {
      id: recordId,
      licensePlate: recordData.licensePlate,
      entryTime: entryTime,
      exitTime: exitTime,
      durationMinutes,
      fee,
      currency,
      status: VehicleStatus.EXITED
    };
  } catch (error) {
    console.error('Error recording vehicle exit:', error);
    throw error;
  }
};

// Get active parking records (vehicles currently parked)
export const getActiveParkingRecords = async (): Promise<ParkingRecord[]> => {
  try {
    const q = query(
      parkingRecordsCollection, 
      where("status", "==", VehicleStatus.PARKED)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as ParkingRecord));
  } catch (error) {
    console.error('Error getting active parking records:', error);
    throw error;
  }
};

// Get parking record by ID
export const getParkingRecordById = async (recordId: string): Promise<ParkingRecord | null> => {
  try {
    const recordRef = doc(db, 'parkingRecords', recordId);
    const recordSnap = await getDoc(recordRef);
    
    if (recordSnap.exists()) {
      return {
        id: recordSnap.id,
        ...recordSnap.data()
      } as ParkingRecord;
    }
    return null;
  } catch (error) {
    console.error('Error getting parking record:', error);
    throw error;
  }
};

// Get parking records by license plate
export const getParkingRecordsByLicensePlate = async (licensePlate: string): Promise<ParkingRecord[]> => {
  try {
    const q = query(
      parkingRecordsCollection, 
      where("licensePlate", "==", licensePlate),
      orderBy("entryTime", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as ParkingRecord));
  } catch (error) {
    console.error('Error getting parking records by license plate:', error);
    throw error;
  }
};

// ======== Reporting ========

// Get daily revenue
export const getDailyRevenue = async (date: Date): Promise<{amount: number, currency: string}> => {
  try {
    // Start of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // End of day
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);
    
    const q = query(
      parkingRecordsCollection,
      where("status", "==", VehicleStatus.EXITED),
      where("exitTime", ">=", startTimestamp),
      where("exitTime", "<=", endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    let totalRevenue = 0;
    
    // Track currencies and amounts
    const currencyAmounts: { [currency: string]: number } = {};
    
    querySnapshot.docs.forEach((doc) => {
      const record = doc.data() as ParkingRecord;
      totalRevenue += record.fee || 0;
      
      // Track by currency
      const currency = record.currency || 'USD';
      if (!currencyAmounts[currency]) {
        currencyAmounts[currency] = 0;
      }
      currencyAmounts[currency] += record.fee || 0;
    });
    
    // Find the most used currency
    let primaryCurrency = 'USD';
    let maxAmount = 0;
    
    Object.entries(currencyAmounts).forEach(([currency, amount]) => {
      if (amount > maxAmount) {
        primaryCurrency = currency;
        maxAmount = amount;
      }
    });
    
    // If no records with fees, try to get currency from the first zone
    if (Object.keys(currencyAmounts).length === 0) {
      try {
        const zones = await getParkingZones();
        if (zones.length > 0) {
          primaryCurrency = zones[0].currency || 'USD';
        }
      } catch (zoneError) {
        console.error('Error getting zones for currency:', zoneError);
        // Keep default USD if zones can't be fetched
      }
    }
    
    return {
      amount: totalRevenue,
      currency: primaryCurrency
    };
  } catch (error) {
    console.error('Error getting daily revenue:', error);
    throw error;
  }
};

// Get occupancy report
export const getOccupancyReport = async (): Promise<{
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
}> => {
  try {
    // Get all zones
    const zones = await getParkingZones();
    const zoneMap: { [id: string]: string } = {};
    zones.forEach(zone => {
      if (zone.id) {
        zoneMap[zone.id] = zone.name;
      }
    });
    
    // Get all spots
    const spots = await getParkingSpots();
    
    // Initialize report data
    let total = spots.length;
    let occupied = spots.filter(spot => spot.isOccupied).length;
    let vacant = total - occupied;
    let occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
    
    // Initialize zone data
    const byZone: {
      [zoneId: string]: {
        zoneName: string;
        total: number;
        occupied: number;
        vacant: number;
        occupancyRate: number;
      }
    } = {};
    
    // Group spots by zone
    spots.forEach(spot => {
      if (!byZone[spot.zoneId]) {
        byZone[spot.zoneId] = {
          zoneName: zoneMap[spot.zoneId] || 'Unknown Zone',
          total: 0,
          occupied: 0,
          vacant: 0,
          occupancyRate: 0
        };
      }
      
      byZone[spot.zoneId].total++;
      if (spot.isOccupied) {
        byZone[spot.zoneId].occupied++;
      } else {
        byZone[spot.zoneId].vacant++;
      }
    });
    
    // Calculate occupancy rates for each zone
    Object.keys(byZone).forEach(zoneId => {
      const zone = byZone[zoneId];
      zone.occupancyRate = zone.total > 0 ? (zone.occupied / zone.total) * 100 : 0;
    });
    
    return {
      total,
      occupied,
      vacant,
      occupancyRate,
      byZone
    };
  } catch (error) {
    console.error('Error getting occupancy report:', error);
    throw error;
  }
};

// Get parking records history within a date range
export const getParkingRecordsHistory = async (startDate: Date, endDate: Date): Promise<ParkingRecord[]> => {
  try {
    // Ensure end of day for the end date
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(adjustedEndDate);
    
    // Query for all records (both parked and exited) within the date range
    const q = query(
      parkingRecordsCollection,
      where("entryTime", ">=", startTimestamp),
      where("entryTime", "<=", endTimestamp),
      orderBy("entryTime", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as ParkingRecord));
  } catch (error) {
    console.error('Error getting parking records history:', error);
    throw error;
  }
}; 