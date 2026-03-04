export interface ResidentStats {
  total: number;
  general: number;       // ผู้สูงอายุทั่วไป
  partial_assist: number; // ช่วยเหลือตนเองได้บางส่วน
  bedridden: number;     // ติดเตียง
}

export interface GenderStats {
  male: number;
  female: number;
}
