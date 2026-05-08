import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { ActivityParticipation } from '@/types/activity-participation';

export interface RelativeDashboardNote {
  id: string;
  content: string;
  created_at: string;
}

export interface RelativeDashboardData {
  resident_id: string;
  resident_name: string;
  date: string;
  last_updated_at?: string;
  notes: RelativeDashboardNote[];
  participations?: ActivityParticipation[];
}

export interface RelativeEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface RelativeMedication {
  name: string;
  dose: string;
  frequency: string;
  notes: string;
}

export interface RelativePatientInfoData {
  resident_id: string;
  profile_image?: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  gender: string;
  date_of_birth: string;
  age: number;
  id_card_number: string;
  purpose_of_stay?: string;
  check_in_date: string;
  status: string;
  pre_existing_conditions: string[];
  pre_existing_conditions_note?: string;
  surgical_history: string[];
  medications: RelativeMedication[];
  resuscitation_status?: string;
  food_allergies: string[];
  drug_allergies: string[];
  emergency_hospital?: string;
  emergency_hospital_phone?: string;
  emergency_contacts: RelativeEmergencyContact[];
}

class RelativePortalService {
  async getDashboard(date?: string): Promise<RelativeDashboardData> {
    const params = new URLSearchParams();
    if (date) {
      params.append('date', date);
    }

    const qs = params.toString();
    const url = qs ? `/api/relative/dashboard?${qs}` : '/api/relative/dashboard';
    const response = await apiClient.get<ApiResponse<RelativeDashboardData>>(url);
    return response.data.result;
  }

  async getPatientInfo(): Promise<RelativePatientInfoData> {
    const response = await apiClient.get<ApiResponse<RelativePatientInfoData>>('/api/relative/patient-info');
    return response.data.result;
  }
}

export const relativePortalService = new RelativePortalService();
export default relativePortalService;
