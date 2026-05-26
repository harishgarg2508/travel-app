export interface Trip {
  id: string;
  fromCity: string;
  toCity: string;
  dateTime: string;
  vehicleType: VehicleType;
  imageUrl: string;
  seatsAvailable: number;
  price: number;
  createdAt: string;
}

export type VehicleType = 'Bus' | 'Car' | 'Tempo' | 'Mini Bus' | 'SUV' | 'Luxury';

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  seatsBooked: number;
  createdAt: string;
}

export interface UserData {
  uid: string;
  name: string;
  email: string;
}

export interface TripFormData {
  fromCity: string;
  toCity: string;
  dateTime: string;
  vehicleType: VehicleType;
  seatsAvailable: number;
  price: number;
  image: File | null;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  seatsBooked: number;
}

export const VEHICLE_TYPES: VehicleType[] = ['Bus', 'Car', 'Tempo', 'Mini Bus', 'SUV', 'Luxury'];

export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad',
  'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow',
  'Surat', 'Chandigarh', 'Indore', 'Bhopal', 'Nagpur',
  'Patna', 'Vadodara', 'Guwahati', 'Coimbatore', 'Kochi',
  'Mysore', 'Udaipur', 'Goa', 'Varanasi', 'Agra',
  'Amritsar', 'Rishikesh', 'Haridwar', 'Shimla', 'Manali',
  'Dehradun', 'Nashik', 'Aurangabad', 'Visakhapatnam', 'Bhubaneswar',
  'Jodhpur', 'Jaisalmer', 'Srinagar', 'Leh', 'Darjeeling',
  'Gangtok', 'Shillong', 'Ranchi', 'Raipur', 'Thiruvananthapuram',
  'Madurai', 'Trichy', 'Salem', 'Tirupati', 'Vijayawada',
];
