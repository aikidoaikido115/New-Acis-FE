import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";

export interface CreateSupportTicketRequest {
  name: string;
  email?: string;
  subject: string;
  message: string;
}

export interface SupportTicket {
  support_ticket_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  reporter_role: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export type SupportTicketStatus = SupportTicket["status"];

export interface ListSupportTicketsQuery {
  search?: string;
  status?: SupportTicketStatus;
  reporterRole?: string;
}

class SupportTicketService {
  async create(payload: CreateSupportTicketRequest): Promise<SupportTicket> {
    const response = await apiClient.post<ApiResponse<SupportTicket>>("/api/support/tickets", payload);
    return response.data.result;
  }

  async list(query: ListSupportTicketsQuery = {}): Promise<SupportTicket[]> {
    const params = new URLSearchParams();

    if (query.search?.trim()) {
      params.set("search", query.search.trim());
    }

    if (query.status?.trim()) {
      params.set("status", query.status.trim());
    }

    if (query.reporterRole?.trim()) {
      params.set("reporterRole", query.reporterRole.trim());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/support/tickets?${queryString}` : "/api/support/tickets";
    const response = await apiClient.get<ApiResponse<SupportTicket[]>>(endpoint);
    return response.data.result;
  }

  async getById(id: string): Promise<SupportTicket> {
    const response = await apiClient.get<ApiResponse<SupportTicket>>(`/api/support/tickets/${id}`);
    return response.data.result;
  }

  async updateStatus(id: string, status: SupportTicketStatus): Promise<SupportTicket> {
    const response = await apiClient.patch<ApiResponse<SupportTicket>>(`/api/support/tickets/${id}/status`, { status });
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/support/tickets/${id}`);
  }
}

export const supportTicketService = new SupportTicketService();
export default supportTicketService;
