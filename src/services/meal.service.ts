import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { Menu, MealPlan, CreateMealPlanRequest } from '@/types/meal';

class MealService {
  /**
   * Get all menus
   * GET /api/meals/menus
   */
  async getAllMenus(): Promise<Menu[]> {
    const response = await apiClient.get<ApiResponse<Menu[]>>('/api/meals/menus');
    return response.data.result;
  }

  /**
   * Get menu by ID
   * GET /api/meals/menus/{id}
   */
  async getMenuById(id: string): Promise<Menu> {
    const response = await apiClient.get<ApiResponse<Menu>>(`/api/meals/menus/${id}`);
    return response.data.result;
  }

  /**
   * Create menu
   * POST /api/meals/menus
   */
  async createMenu(payload: Omit<Menu, 'menu_id'>): Promise<Menu> {
    const response = await apiClient.post<ApiResponse<Menu>>('/api/meals/menus', payload);
    return response.data.result;
  }

  /**
   * Update menu
   * PATCH /api/meals/menus/{id}
   */
  async updateMenu(id: string, payload: Partial<Menu>): Promise<Menu> {
    const response = await apiClient.patch<ApiResponse<Menu>>(`/api/meals/menus/${id}`, payload);
    return response.data.result;
  }

  /**
   * Get all meal plans
   * GET /api/meals/meal-plans
   */
  async getAllMealPlans(): Promise<MealPlan[]> {
    const response = await apiClient.get<ApiResponse<MealPlan[]>>('/api/meals/meal-plans');
    return response.data.result;
  }

  /**
   * Get meal plan by ID
   * GET /api/meals/meal-plans/{id}
   */
  async getMealPlanById(id: string): Promise<MealPlan> {
    const response = await apiClient.get<ApiResponse<MealPlan>>(`/api/meals/meal-plans/${id}`);
    return response.data.result;
  }

  /**
   * Get today's meal plans
   * GET /api/meals/meal-plans/today
   */
  async getMealPlansToday(): Promise<MealPlan[]> {
    const response = await apiClient.get<ApiResponse<MealPlan[]>>('/api/meals/meal-plans/today');
    return response.data.result;
  }

  /**
   * Create meal plan (with AI allergy check)
   * POST /api/meals/meal-plans
   */
  async createMealPlan(payload: CreateMealPlanRequest): Promise<{
    meal_plan: MealPlan;
    allergy_check?: any;
    has_ai_warning: boolean;
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/api/meals/meal-plans', payload);
    return response.data.result;
  }

  /**
   * Create meal plan (manual mode, skip AI check)
   * POST /api/meals/meal-plans/manual
   */
  async createMealPlanManual(payload: CreateMealPlanRequest): Promise<{
    meal_plan: MealPlan;
    allergy_check?: null;
    has_ai_warning: false;
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/api/meals/meal-plans/manual', payload);
    return response.data.result;
  }

  /**
   * Update meal plan
   * PATCH /api/meals/meal-plans/{id}
   */
  async updateMealPlan(id: string, payload: Partial<MealPlan>): Promise<MealPlan> {
    const response = await apiClient.patch<ApiResponse<MealPlan>>(`/api/meals/meal-plans/${id}`, payload);
    return response.data.result;
  }
}

export const mealService = new MealService();
export default mealService;
