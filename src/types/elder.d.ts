export interface Resident {
  id: string;
  name: string;
  nickname: string;
  room: string;
  floor: number;
  care: string; // 'general' | 'partial' | 'bedridden' when raw, display text when processed
  admitted: string;
  discharged: string;
  active: boolean;
}

export interface ResidentDisplayData extends Omit<Resident, 'care'> {
  care: string; // Always display text like "ผู้สูงอายุทั่วไป"
}