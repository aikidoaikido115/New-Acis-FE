import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';

export type WarehouseCategory = 'MED' | 'EQU' | 'CON';
export type WarehouseTransactionType = 'เพิ่มสินค้าใหม่' | 'เติมสินค้า' | 'เบิกสินค้า' | 'นำออก';
export type WarehouseApprovalStatus = 'รออนุมัติ' | 'อนุมัติ' | 'ไม่อนุมัติ';

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  description: string;
  quantity: number;
  minimumQuantity?: number;
  unit: string;
  category: WarehouseCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseTransaction {
  id: string;
  code: string;
  type: WarehouseTransactionType;
  itemCode: string;
  itemName: string;
  quantity: number;
  operator: string;
  date: string;
  approvalStatus: WarehouseApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface ListWarehouseItemsQuery {
  search?: string;
  category?: WarehouseCategory;
}

export interface CreateWarehouseItemRequest {
  code?: string;
  name: string;
  description: string;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  category: WarehouseCategory;
}

export interface UpdateWarehouseItemRequest {
  code?: string;
  name?: string;
  description?: string;
  quantity?: number;
  minimumQuantity?: number;
  unit?: string;
  category?: WarehouseCategory;
}

export interface AdjustWarehouseItemRequest {
  mode: 'restock' | 'withdraw';
  quantity: number;
}

export interface ListWarehouseTransactionsQuery {
  startDate?: string;
  endDate?: string;
  searchItem?: string;
  searchUser?: string;
  status?: WarehouseApprovalStatus;
  type?: WarehouseTransactionType;
}

class WarehouseService {
  async getItems(query: ListWarehouseItemsQuery = {}): Promise<WarehouseItem[]> {
    const params = new URLSearchParams();

    if (query.search) {
      params.append('search', query.search);
    }
    if (query.category) {
      params.append('category', query.category);
    }

    const qs = params.toString();
    const url = qs ? `/api/warehouse/items?${qs}` : '/api/warehouse/items';
    const response = await apiClient.get<ApiResponse<WarehouseItem[]>>(url);
    return response.data.result;
  }

  async createItem(payload: CreateWarehouseItemRequest): Promise<WarehouseItem> {
    const response = await apiClient.post<ApiResponse<WarehouseItem>>('/api/warehouse/items', payload);
    return response.data.result;
  }

  async updateItem(id: string, payload: UpdateWarehouseItemRequest): Promise<WarehouseItem> {
    const response = await apiClient.patch<ApiResponse<WarehouseItem>>(`/api/warehouse/items/${id}`, payload);
    return response.data.result;
  }

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/warehouse/items/${id}`);
  }

  async adjustItem(id: string, payload: AdjustWarehouseItemRequest): Promise<WarehouseItem> {
    const response = await apiClient.post<ApiResponse<WarehouseItem>>(`/api/warehouse/items/${id}/adjust`, payload);
    return response.data.result;
  }

  async getTransactions(query: ListWarehouseTransactionsQuery = {}): Promise<WarehouseTransaction[]> {
    const params = new URLSearchParams();

    if (query.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query.searchItem) {
      params.append('searchItem', query.searchItem);
    }
    if (query.searchUser) {
      params.append('searchUser', query.searchUser);
    }
    if (query.status) {
      params.append('status', query.status);
    }
    if (query.type) {
      params.append('type', query.type);
    }

    const qs = params.toString();
    const url = qs ? `/api/warehouse/transactions?${qs}` : '/api/warehouse/transactions';
    const response = await apiClient.get<ApiResponse<WarehouseTransaction[]>>(url);
    return response.data.result;
  }

  async getTransactionById(id: string): Promise<WarehouseTransaction> {
    const response = await apiClient.get<ApiResponse<WarehouseTransaction>>(`/api/warehouse/transactions/${id}`);
    return response.data.result;
  }

  async approveTransactions(transactionIds: string[]): Promise<WarehouseTransaction[]> {
    const response = await apiClient.patch<ApiResponse<WarehouseTransaction[]>>('/api/warehouse/transactions/approve', {
      transactionIds,
    });
    return response.data.result;
  }

  async rejectTransactions(transactionIds: string[], reason: string): Promise<WarehouseTransaction[]> {
    const response = await apiClient.patch<ApiResponse<WarehouseTransaction[]>>('/api/warehouse/transactions/reject', {
      transactionIds,
      reason,
    });
    return response.data.result;
  }
}

export const warehouseService = new WarehouseService();
export default warehouseService;
