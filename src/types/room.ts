export interface Room {
  id: string;
  // Some API responses return room_id instead of id
  room_id?: string;
  room_number: string;
  floor: number;
  capacity: number;
  current_occupancy: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomRequest {
  room_number: string;
  floor: number;
  capacity: number;
}
