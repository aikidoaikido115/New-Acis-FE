"use client";
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { MealHistoryView } from "./MealHistoryView";
import { Input } from "@/components/ui/input";
import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";
import { mealService } from "@/services/meal.service";
import { useToast } from "@/components/ui/toast";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import type { Menu, CreateMealPlanRequest } from "@/types/meal";

type MealView = "main" | "history";
type MealKey = "breakfast" | "lunch" | "dinner";

const BreakfastIcon = () => (
  <svg width="22" height="10" viewBox="0 0 22 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.25 8.25L17.0775 6.6275L18.15 4.125L15.4 3.80875L15.125 1.1L12.6225 2.1725L11 0L9.3775 2.1725L6.875 1.1L6.55875 3.85L3.85 4.125L4.9225 6.6275L2.75 8.25H0V9.625H22V8.25H19.25ZM5.5 8.25C5.54887 6.8085 6.14272 5.43919 7.16171 4.41842C8.1807 3.39764 9.54896 2.80139 10.9904 2.75C12.4336 2.79648 13.8053 3.38927 14.8281 4.40851C15.8509 5.42774 16.4485 6.79735 16.5 8.24038L5.5 8.25Z" fill="black"/>
  </svg>
);

const LunchIcon = () => (
  <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.96818 14.0284H7.48636C7.67727 14.0284 7.84773 13.9765 7.99773 13.8726C8.14773 13.7686 8.24318 13.6258 8.28409 13.4439L8.55 12.4697H2.90455L3.17046 13.4439C3.21137 13.6258 3.30682 13.7686 3.45682 13.8726C3.60682 13.9765 3.77727 14.0284 3.96818 14.0284ZM1.63637 6.23486C1.86818 6.23486 2.06264 6.30968 2.21973 6.45931C2.37682 6.60895 2.45509 6.79392 2.45455 7.01422V7.79357C2.45455 8.01439 2.376 8.19962 2.21891 8.34925C2.06182 8.49889 1.86764 8.57345 1.63637 8.57293C1.40509 8.57241 1.21091 8.49759 1.05382 8.34847C0.89673 8.19936 0.818184 8.01439 0.818184 7.79357V7.01422C0.818184 6.7934 0.89673 6.60843 1.05382 6.45931C1.21091 6.3102 1.40509 6.23538 1.63637 6.23486ZM5.68636 4.63718C5.85 4.4813 6.04446 4.40337 6.26973 4.40337C6.495 4.40337 6.68918 4.4813 6.85227 4.63718L7.425 5.18273C7.58864 5.3386 7.67045 5.52356 7.67045 5.73763C7.67045 5.95169 7.58864 6.13692 7.425 6.29331C7.26136 6.4497 7.06718 6.52764 6.84245 6.52712C6.61773 6.5266 6.42327 6.44866 6.25909 6.29331L5.68636 5.72828C5.52273 5.5724 5.44091 5.39055 5.44091 5.18273C5.44091 4.9749 5.52273 4.79305 5.68636 4.63718ZM1.63637 4.67614C1.40455 4.67614 1.21037 4.60158 1.05382 4.45247C0.897275 4.30335 0.81873 4.11812 0.818184 3.89679C0.818184 3.68896 0.917184 3.54296 1.11518 3.45879C1.31318 3.37462 1.48691 3.26083 1.63637 3.11743C2.31818 3.11743 2.89773 2.89012 3.375 2.43549C3.85227 1.98087 4.09091 1.42882 4.09091 0.779357C4.09091 0.558539 4.16946 0.373572 4.32655 0.224455C4.48364 0.0753379 4.67782 0.000519571 4.90909 0C5.12727 0 5.28082 0.0943022 5.36973 0.282907C5.45864 0.471511 5.57782 0.636995 5.72727 0.779357C5.72727 1.85747 5.32827 2.77659 4.53027 3.53672C3.73227 4.29686 2.76764 4.67666 1.63637 4.67614ZM7.36364 0.779357C7.36364 0.558539 7.44218 0.373572 7.59927 0.224455C7.75636 0.0753379 7.95055 0.000519571 8.18182 0H9C9.23182 0 9.42627 0.0748184 9.58336 0.224455C9.74045 0.374092 9.81873 0.559059 9.81818 0.779357C9.81764 0.999656 9.73909 1.18488 9.58255 1.33504C9.426 1.4852 9.23182 1.55975 9 1.55871H8.18182C7.95 1.55871 7.75582 1.4839 7.59927 1.33426C7.44273 1.18462 7.36418 0.999656 7.36364 0.779357ZM0.818184 15.5871C0.586366 15.5871 0.392184 15.5123 0.235639 15.3627C0.0790937 15.2131 0.000548276 15.0281 2.82132e-06 14.8078C-0.000542633 14.5875 0.0780028 14.4025 0.235639 14.2529C0.393275 14.1032 0.587457 14.0284 0.818184 14.0284H1.63637C1.62273 13.9895 1.61237 13.9539 1.60527 13.9217C1.59818 13.8894 1.58809 13.8536 1.575 13.8141L1.06364 11.8852C0.995457 11.6384 1.04318 11.4145 1.20682 11.2134C1.37046 11.0123 1.58864 10.9115 1.86137 10.911H9.59318C9.86591 10.911 10.0841 11.0118 10.2477 11.2134C10.4114 11.415 10.4591 11.6389 10.3909 11.8852L9.87955 13.8141C9.86591 13.8531 9.85582 13.8889 9.84927 13.9217C9.84273 13.9544 9.83236 13.99 9.81818 14.0284H14.85L15.4023 7.79357H10.7795L10.8409 8.51448C10.8682 8.7353 10.7967 8.93014 10.6265 9.099C10.4564 9.26786 10.2551 9.35229 10.0227 9.35229C9.80455 9.35229 9.62045 9.28422 9.47045 9.1481C9.32045 9.01197 9.23182 8.83973 9.20455 8.63138L9.08182 7.07267C9.05455 6.85185 9.12273 6.65701 9.28636 6.48815C9.45 6.31929 9.64773 6.23486 9.87955 6.23486H16.3023C16.5341 6.23486 16.7318 6.31929 16.8955 6.48815C17.0591 6.65701 17.1273 6.85185 17.1 7.07267L16.5068 14.0284H17.1818C17.4136 14.0284 17.6081 14.1032 17.7652 14.2529C17.9223 14.4025 18.0005 14.5875 18 14.8078C17.9995 15.0281 17.9209 15.2133 17.7644 15.3635C17.6078 15.5136 17.4136 15.5882 17.1818 15.5871H0.818184Z" fill="black"/>
  </svg>
);

const DinnerIcon = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 12.5215C0 12.7055 0.064 12.8575 0.2 12.9775C0.336 13.1055 0.504 13.1615 0.696 13.1615H15.584C15.776 13.1615 15.936 13.0975 16.064 12.9775C16.2 12.8495 16.264 12.6975 16.264 12.5215C16.264 12.3295 16.2 12.1615 16.072 12.0335C16.0095 11.9674 15.9337 11.9154 15.8496 11.8809C15.7654 11.8464 15.6749 11.8302 15.584 11.8335H0.696C0.504 11.8335 0.344 11.8975 0.208 12.0335C0.072 12.1695 0 12.3375 0 12.5215ZM2.088 10.0335C2.088 10.2255 2.16 10.3775 2.296 10.5055C2.408 10.6495 2.56 10.7215 2.768 10.7215H17.656C17.84 10.7215 17.992 10.6575 18.12 10.5215C18.248 10.3855 18.304 10.2255 18.304 10.0335C18.306 9.94776 18.2907 9.86251 18.2591 9.78281C18.2275 9.7031 18.1802 9.63055 18.12 9.56948C18.0589 9.50929 17.9864 9.46199 17.9067 9.43038C17.827 9.39878 17.7417 9.38351 17.656 9.38548H2.768C2.576 9.38548 2.416 9.44948 2.288 9.56948C2.152 9.69748 2.088 9.84948 2.088 10.0335ZM2.208 8.09748V8.05748C2.176 8.17748 2.208 8.23348 2.304 8.23348H3.456C3.504 8.23348 3.552 8.19348 3.608 8.11348C3.8 7.69748 4.08 7.36148 4.456 7.09748C4.832 6.83348 5.248 6.68148 5.696 6.64948L6.12 6.58548C6.216 6.58548 6.272 6.53748 6.272 6.44148L6.32 6.04148C6.408 5.17748 6.768 4.46548 7.408 3.88148C8.048 3.30548 8.808 3.01748 9.68 3.01748C10.536 3.01748 11.296 3.30548 11.936 3.87348C12.576 4.44148 12.952 5.15348 13.04 6.00948L13.096 6.46548C13.096 6.56148 13.152 6.60948 13.264 6.60948H14.528C15.04 6.60948 15.512 6.74548 15.928 7.02548C16.344 7.29748 16.664 7.66548 16.864 8.11348C16.92 8.19348 16.976 8.23348 17.04 8.23348H18.176C18.272 8.23348 18.312 8.17748 18.296 8.05748C18.12 7.60948 18 7.32948 17.928 7.20948C18.504 6.68948 18.912 6.00148 19.128 5.15348L19.264 4.62548C19.2749 4.60558 19.28 4.58298 19.2785 4.56033C19.2771 4.53767 19.2693 4.51588 19.256 4.49748C19.232 4.46548 19.2 4.44148 19.16 4.44148L18.664 4.26548C17.952 4.05748 17.408 3.64148 17.032 3.00148C16.656 2.36148 16.56 1.68148 16.736 0.953484L16.84 0.489484C16.88 0.417484 16.848 0.353484 16.736 0.305484L16.064 0.121484C15.2058 -0.0943055 14.3004 -0.0212005 13.488 0.329483C12.6648 0.668784 11.9722 1.26325 11.512 2.02548C10.88 1.77748 10.264 1.65748 9.68 1.65748C8.568 1.65748 7.584 2.00948 6.712 2.70548C5.84 3.40148 5.288 4.29748 5.032 5.38548C4.36 5.54548 3.768 5.86548 3.256 6.35348C2.744 6.84148 2.408 7.42548 2.208 8.09748ZM3.472 14.9615C3.472 15.1535 3.544 15.3055 3.68 15.4335C3.816 15.5775 3.976 15.6495 4.152 15.6495H19.072C19.256 15.6495 19.416 15.5855 19.544 15.4495C19.672 15.3135 19.736 15.1535 19.736 14.9615C19.736 14.7775 19.672 14.6255 19.544 14.4975C19.416 14.3695 19.256 14.3135 19.072 14.3135H4.16C3.968 14.3135 3.808 14.3775 3.68 14.4975C3.544 14.6255 3.472 14.7775 3.472 14.9615ZM12.68 2.74548C12.96 2.28948 13.336 1.92948 13.808 1.68148C14.28 1.43348 14.776 1.32948 15.304 1.37748C15.248 2.20948 15.44 2.99348 15.864 3.72148C16.296 4.44948 16.888 4.98548 17.64 5.33748C17.52 5.61748 17.32 5.90548 17.04 6.19348C16.3377 5.60141 15.4465 5.28068 14.528 5.28948H14.272C14.016 4.24148 13.488 3.39348 12.68 2.74548Z" fill="black"/>
  </svg>
);

const mealTabs = [
  { key: "breakfast", label: "มื้อเช้า", icon: BreakfastIcon },
  { key: "lunch", label: "มื้อกลางวัน", icon: LunchIcon },
  { key: "dinner", label: "มื้อเย็น", icon: DinnerIcon },
] as const;

interface SecondaryMenu {
  menuId: string;
  menuName: string;
  servings: number | string;
  note: string;
}

interface MealData {
  mainMenuId: string;
  mainMenuName: string;
  mainServings: number | string;
  mainNote: string;
  secondaryMenus: SecondaryMenu[];
  additionalNote: string;
}

interface AllergyStatDetail {
  allergy_id: string;
  allergy_name: string;
  resident_count: number;
}

interface ResidentAllergyStatsResponse {
  total_allergic: number;
  total_not_allergic: number;
  allergy_details: AllergyStatDetail[];
}

interface NumberOfResidentsDashboardResponse {
  total_residents: number;
}

interface MenuResult {
  menu_id: string;
  menu_name: string;
  description: string;
}

interface CreateMealPlanPayload extends CreateMealPlanRequest {}

const createEmptyMealData = (): MealData => ({
  mainMenuId: "",
  mainMenuName: "",
  mainServings: "",
  mainNote: "",
  secondaryMenus: [],
  additionalNote: "",
});

export default function ManageMealPage() {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<MealView>("main");
  const [isSaving, setIsSaving] = useState(false);
  const [allergyStats, setAllergyStats] = useState<ResidentAllergyStatsResponse | null>(null);
  const [totalResidents, setTotalResidents] = useState<number | null>(null);
  const [statsError, setStatsError] = useState<string>("");
  const [availableMenus, setAvailableMenus] = useState<Menu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuNote, setNewMenuNote] = useState("");
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [humanInTheLoop, setHumanInTheLoop] = useState(false);
  
  // เก็บ warning message เฉพาะกรณีที่ต้องการจัดการ state ภายใน
  const [aiWarningMessage, setAiWarningMessage] = useState<string>("");

  const [mealsData, setMealsData] = useState<Record<MealKey, MealData>>({
    breakfast: createEmptyMealData(),
    lunch: createEmptyMealData(),
    dinner: createEmptyMealData(),
  });

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const fetchWithFallback = async <T,>(primary: string, fallback: string) => {
    try {
      return await apiClient.get<ApiResponse<T>>(primary);
    } catch (err: unknown) {
      if ((err as { status_code?: number })?.status_code === 404) {
        return await apiClient.get<ApiResponse<T>>(fallback);
      }
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [allergyResult, totalResult] = await Promise.allSettled([
          fetchWithFallback<ResidentAllergyStatsResponse>(
            "/api/emr/dashboard/resident-allergy-stats",
            "/emr/dashboard/resident-allergy-stats"
          ),
          fetchWithFallback<NumberOfResidentsDashboardResponse>(
            "/api/emr/dashboard/residents",
            "/emr/dashboard/residents"
          ),
        ]);

        if (!isMounted) {
          return;
        }

        if (allergyResult.status === "fulfilled") {
          setAllergyStats(allergyResult.value.data.result);
        }

        if (totalResult.status === "fulfilled") {
          setTotalResidents(totalResult.value.data.result.total_residents);
        }

        if (allergyResult.status === "rejected" && totalResult.status === "rejected") {
          setStatsError("");
        } else {
          setStatsError("");
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatsError("");
        }
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setIsLoadingMenus(true);
        const menus = await mealService.getAllMenus();
        setAvailableMenus(menus);
      } catch (error) {
        console.error("Failed to fetch menus:", error);
        showToast({ message: "ไม่สามารถดึงข้อมูลเมนูได้", type: "error" });
      } finally {
        setIsLoadingMenus(false);
      }
    };

    fetchMenus();
  }, [showToast]);

  const handleSave = async (activeTab: MealKey) => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setAiWarningMessage(""); // Clear warning state

    try {
      const tab = mealTabs.find(t => t.key === activeTab);
      if (!tab) {
        throw new Error("ไม่พบข้อมูลมื้ออาหาร");
      }

      const meal = mealsData[activeTab];

      // Validation
      if (!meal.mainMenuId.trim()) {
        throw new Error(`กรุณาเลือกเมนูหลักของ${tab.label}`);
      }
      if (!meal.mainServings || Number(meal.mainServings) <= 0) {
        throw new Error(`กรุณากรอกจำนวนเมนูหลักของ${tab.label}`);
      }

      let mainMenuId = meal.mainMenuId;
      if (meal.mainMenuId === "custom") {
        const newMenu = await mealService.createMenu({
          menu_name: meal.mainMenuName.trim(),
          description: meal.mainNote?.trim() || "",
        });
        mainMenuId = newMenu.menu_id;
      }

      let backupMenuId: string | undefined = undefined;
      let backupAmount: number | undefined = undefined;

      const secondary = meal.secondaryMenus[0];
      const hasSecondary = secondary
        ? secondary.menuId.trim() !== "" || String(secondary.servings).trim() !== ""
        : false;

      if (secondary && hasSecondary) {
        if (!secondary.menuId.trim()) {
          throw new Error(`กรุณากรอกชื่อเมนูรองของ${tab.label}`);
        }
        if (!secondary.servings || Number(secondary.servings) <= 0) {
          throw new Error(`กรุณากรอกจำนวนเมนูรองของ${tab.label}`);
        }
        backupMenuId = secondary.menuId;
        backupAmount = Number.parseInt(String(secondary.servings), 10) || 0;
      }

      const payload: CreateMealPlanRequest = {
        menu_id: mainMenuId,
        main_amount: Number.parseInt(String(meal.mainServings), 10) || 0,
        meal_type: activeTab as "breakfast" | "lunch" | "dinner",
        human_in_the_loop: humanInTheLoop,
      };

      if (backupMenuId && backupMenuId.trim()) {
        payload.backup_menu_id = backupMenuId;
        if (backupAmount !== undefined && backupAmount > 0) {
          payload.backup_amount = backupAmount;
        }
      }

       if (humanInTheLoop) {
        await mealService.createMealPlanManual(payload);
      } else {
        const result = await mealService.createMealPlan(payload);
        if (result?.has_ai_warning && !backupMenuId) {
          showToast({
            title: "ตรวจพบเมนูเสี่ยงแพ้",
            message: "ระบบพบว่ามีผู้สูงอายุแพ้เมนูหลัก กรุณาเพิ่ม 'เมนูรอง' หรือปิดระบบ AI ตรวจสอบ",
            type: "info",
          });
          setIsSaving(false);
          return;
        }
      }
      showToast({
        title: "บันทึกสำเร็จ",
        message: `ระบบได้บันทึกข้อมูลการจัดเตรียมอาหาร${tab.label}เรียบร้อยแล้ว`,
        type: "success",
      });

      setMealsData(prev => ({
        ...prev,
        [activeTab]: createEmptyMealData()
      }));
      setAiWarningMessage("");
    } catch (err: unknown) {
      const rawMessage = typeof (err as { message?: string })?.message === "string"
        ? (err as { message: string }).message
        : "บันทึกข้อมูลไม่สำเร็จ";

      const translateErrorMessage = (msg: string): string => {
        const lowerMsg = msg.toLowerCase();
        
        if (lowerMsg.includes("both main and backup menus are not safe for allergy group")) {
          return "ทั้งเมนูหลักและเมนูรองไม่ปลอดภัยสำหรับผู้ที่มีประวัติแพ้อาหารกลุ่มนี้ กรุณาเปลี่ยนเมนูใหม่";
        }

        if (lowerMsg.includes("backup menu is not safe for allergy group")) {
          const parts = msg.split(":");
          const reason = parts.length > 1 ? parts[1].trim() : "กรุณาเปลี่ยนเมนูรองใหม่";
          return `เมนูรองไม่ปลอดภัยสำหรับผู้ที่มีประวัติแพ้อาหาร: ${reason}`;
        }

        if (lowerMsg.includes("main menu is not safe") || lowerMsg.includes("main menu may not be safe")) {
          const parts = msg.split(":");
          const reason = parts.length > 1 ? parts[1].trim() : "กรุณาเพิ่มเมนูรอง หรือเปลี่ยนเมนูหลักใหม่";
          return `เมนูหลักไม่ปลอดภัยสำหรับผู้ที่มีประวัติแพ้อาหาร: ${reason}`;
        }

        if (lowerMsg.includes("unauthorized")) {
          return "เซสชั่นหมดอายุหรือไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่";
        }
        if (lowerMsg.includes("internal server error")) {
          return "ระบบหลังบ้านเกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
        }

        return msg; 
      };

      const translatedMessage = translateErrorMessage(rawMessage);

      showToast({
        title: "เกิดข้อผิดพลาด",
        message: translatedMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMenu = () => {
    setShowAddMenuModal(true);
  };

  const handleCreateMenu = (menuName: string) => {
    setNewMenuName(menuName);
    setShowAddMenuModal(true);
  };

  const handleSaveNewMenu = async () => {
    if (!newMenuName.trim()) {
      showToast({ message: "กรุณากรอกชื่อเมนู", type: "error" });
      return;
    }

    try {
      setIsAddingMenu(true);
      const newMenu = await mealService.createMenu({
        menu_name: newMenuName.trim(),
        description: newMenuNote.trim() || "",
      });
      setAvailableMenus(prev => [...prev, newMenu]);
      setNewMenuName("");
      setNewMenuNote("");
      setShowAddMenuModal(false);
      showToast({ message: "เพิ่มเมนูใหม่สำเร็จ", type: "success" });
    } catch (error) {
      console.error("Failed to create menu:", error);
      showToast({ message: "ไม่สามารถเพิ่มเมนูได้", type: "error" });
    } finally {
      setIsAddingMenu(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-full">
      {view === "history" ? (
        <MealHistoryView onBack={() => setView("main")} 
        availableMenus={availableMenus}
        />
        
      ) : (
        <MealMainView
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onShowHistory={() => setView("history")}
          mealsData={mealsData}
          setMealsData={setMealsData}
          isSaving={isSaving}
          allergyStats={allergyStats}
          totalResidents={totalResidents}
          statsError={statsError}
          availableMenus={availableMenus}
          setAvailableMenus={setAvailableMenus}
          isLoadingMenus={isLoadingMenus}
          onAddMenu={handleAddMenu}
          humanInTheLoop={humanInTheLoop}
          onHumanInTheLoopChange={setHumanInTheLoop}
          onCreateMenu={handleCreateMenu}
          onSaveWithTab={handleSave}
        />
      )}

      {/* Add Menu Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มเมนูใหม่</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="กรอกชื่อเมนู"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 text-slate-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียดเมนู <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder={"กรอกส่วนประกอบเมนู \nเช่น นม, ไข่, \nใช้ , คั่นระหว่างส่วนประกอบ"}
                  value={newMenuNote}
                  onChange={(e) => setNewMenuNote(e.target.value)}
                  className="w-full px-3 py-2 text-slate-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddMenuModal(false);
                  setNewMenuName("");
                  setNewMenuNote("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                disabled={isAddingMenu}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveNewMenu}
                disabled={isAddingMenu}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isAddingMenu ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MealMainViewProps {
  selectedDate: Date;
  onDateChange: (date: Date | null) => void;
  onShowHistory: () => void;
  mealsData: Record<MealKey, MealData>;
  setMealsData: Dispatch<SetStateAction<Record<MealKey, MealData>>>;
  isSaving: boolean;
  allergyStats: ResidentAllergyStatsResponse | null;
  totalResidents: number | null;
  statsError: string;
  availableMenus: Menu[];
  setAvailableMenus: Dispatch<SetStateAction<Menu[]>>; 
  isLoadingMenus: boolean;
  onAddMenu: () => void;
  humanInTheLoop: boolean;
  onHumanInTheLoopChange: (value: boolean) => void;
  onCreateMenu: (menuName: string) => void;
  onSaveWithTab: (tab: MealKey) => Promise<void>;
}

function MealMainView({
  selectedDate,
  onDateChange,
  onShowHistory,
  mealsData,
  setMealsData,
  isSaving,
  allergyStats,
  totalResidents,
  statsError,
  availableMenus,
  setAvailableMenus,
  isLoadingMenus,
  onAddMenu,
  humanInTheLoop,
  onHumanInTheLoopChange,
  onCreateMenu,
  onSaveWithTab,
}: MealMainViewProps) {
  const [activeTab, setActiveTab] = useState<MealKey>("breakfast");
  const [isAllergyListOpen, setIsAllergyListOpen] = useState(true);

  const updateMealData = (key: MealKey, updates: Partial<MealData>) => {
    setMealsData(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  };

  const handleAddSecondaryMenu = (mealKey: MealKey) => {
    const current = mealsData[mealKey];
    if (current.secondaryMenus.length > 0) {
      return;
    }
    updateMealData(mealKey, { secondaryMenus: [{ menuId: "", menuName: "", servings: "", note: "" }] });
  };

  const updateSecondaryMenu = (mealKey: MealKey, index: number, updates: Partial<SecondaryMenu>) => {
    setMealsData(prev => {
      const currentMeal = prev[mealKey];
      const updatedSecondary = [...currentMeal.secondaryMenus];
      updatedSecondary[index] = { ...updatedSecondary[index], ...updates };
      return {
        ...prev,
        [mealKey]: { ...currentMeal, secondaryMenus: updatedSecondary }
      };
    });
  };

  const currentMealData = mealsData[activeTab];
  const menuOptions = availableMenus.map(menu => ({
    value: menu.menu_id,
    label: menu.menu_name
  }));

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-headline-6 font-bold text-gray-800">
          จัดการมื้ออาหาร
        </h2>
        <div className="flex flex-row items-center justify-between sm:justify-end gap-2 w-full sm:w-auto sm:ml-auto">  
          <button
            onClick={onShowHistory}
            className="whitespace-nowrap px-2 sm:px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-lg text-[12px] sm:text-body-small font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600 shrink-0"
          >
            <span className="text-sm">[ รายการแผนอาหารที่บันทึก ]</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {statsError ? (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-sm font-semibold text-rose-700">
              {statsError}
            </span>
          ) : (
            [
              {
                label: `ทั้งหมด ${
                  allergyStats
                    ? (allergyStats.total_allergic ?? 0) + (allergyStats.total_not_allergic ?? 0)
                    : (totalResidents !== null ? totalResidents : "-")
                } คน`,
                tone: "bg-slate-100 text-slate-700 border-slate-200",
              },
              {
                label: allergyStats
                  ? `ไม่แพ้ ${allergyStats.total_not_allergic ?? 0} คน`
                  : "ไม่แพ้ - คน",
                tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
              },
              {
                label: allergyStats
                  ? `แพ้ ${allergyStats.total_allergic ?? 0} คน`
                  : "แพ้ - คน",
                tone: "bg-rose-100 text-rose-700 border-rose-200",
              },
            ].map((stat) => (
              <span
                key={stat.label}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${stat.tone}`}
              >
                {stat.label}
              </span>
            ))
          )}
        </div>
        {allergyStats && allergyStats.allergy_details && allergyStats.allergy_details.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 transition-all duration-300">
            <div 
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsAllergyListOpen(!isAllergyListOpen)}
            >
              <h3 className="text-sm font-semibold text-rose-700">รายการการแพ้อาหารของผู้พักอาศัย</h3>
              <button 
                type="button" 
                className="text-rose-500 hover:text-rose-700 transition-transform duration-200 focus:outline-none"
                style={{ transform: isAllergyListOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {isAllergyListOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {allergyStats.allergy_details.map((detail, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white rounded px-3 py-2 border border-rose-100 shadow-sm">
                    <span className="text-gray-700">{detail.allergy_name}</span>
                    <span className="font-semibold text-rose-600">{detail.resident_count} คน</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-2 sm:gap-4">
          {mealTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon && <span className="inline-block">{tab.icon()}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-700">
            {mealTabs.find(t => t.key === activeTab)?.label}
          </div>

          <div className="mt-6 space-y-6">
            {/* Main Menu */}
            <div className="space-y-2">
              <h3 className="text-body-small font-semibold text-gray-700">เมนูหลัก</h3>
              <div className="flex flex-row gap-3 items-end w-full md:w-4/5 lg:w-2/3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    เมนู <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={menuOptions}
                    value={currentMealData.mainMenuId}
                    onChange={(menuId) => {
                      const selectedMenu = availableMenus.find(m => m.menu_id === menuId);
                      updateMealData(activeTab, {
                        mainMenuId: menuId,
                        mainMenuName: selectedMenu?.menu_name || ""
                      });
                    }}
                    placeholder="เลือกเมนูหลัก"
                    allowCreate={true}
                    onCreate={onCreateMenu}
                    createLabel="+ เพิ่มเมนู"
                  />
                </div>
                <div className="w-24 sm:w-32 shrink-0">
                  <label className="block text-xs text-gray-500 mb-1">
                    จำนวน (เสิร์ฟ) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-slate-500 placeholder:text-slate-500 w-full"
                    value={currentMealData.mainServings ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      updateMealData(activeTab, { mainServings: val });
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Secondary Menus */}
            <div className="space-y-3">
             <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-body-small font-semibold text-gray-700">
                เมนูรอง (สำหรับคนแพ้อาหาร)
              </h3>
              <h4 className="text-xs text-gray-500">
                หากไม่มีคนแพ้อาหาร สามารถเว้นว่างไว้ได้
              </h4>
            </div>
              <div className="space-y-3">
                {currentMealData.secondaryMenus.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleAddSecondaryMenu(activeTab)}
                    className="inline-flex items-center rounded-full bg-[#0093EF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#007AC9] transition-colors"
                  >
                    + เพิ่มเมนูรอง
                  </button>
                ) : (
                  currentMealData.secondaryMenus.slice(0, 1).map((secondary, index) => (
                      <div key={index} className="flex flex-row gap-3 items-end w-full md:w-4/5 lg:w-2/3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">เมนู</label>
                          <SearchableDropdown
                            options={menuOptions}
                            value={secondary.menuId}
                            onChange={(menuId) => {
                              const selectedMenu = availableMenus.find(m => String(m.menu_id) === String(menuId));
                              if (selectedMenu) {
                                updateSecondaryMenu(activeTab, index, {
                                  menuId: String(menuId),
                                  menuName: selectedMenu.menu_name
                                });
                              }
                            }}
                            placeholder="เลือกเมนูรอง"
                            allowCreate={true}
                            onCreate={onCreateMenu}
                            createLabel="+ เพิ่มเมนู"
                          />
                        </div>
                        <div className="w-24 sm:w-32 shrink-0">
                          <label className="block text-xs text-gray-500 mb-1">จำนวน (เสิร์ฟ)</label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-slate-500 placeholder:text-slate-500 w-full"
                            value={secondary.servings ?? ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^\d]/g, "");
                              updateSecondaryMenu(activeTab, index, { servings: val });
                            }}
                          />
                        </div>
                      </div>
                  ))
                )}
              </div>
            </div>          
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-center">
          <div className="w-full md:w-4/5 lg:w-8/12 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shadow-sm">          <svg
            className="w-5 h-5 text-gray-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-700 text-center">โปรดทราบ:</span> ข้อมูลการแพ้อาหารและการตรวจสอบสารก่อภูมิแพ้โดย AI อาจไม่ถูกต้อง 100% กรุณาตรวจสอบความถูกต้องของเมนูอาหารอีกครั้งก่อนบันทึก
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 justify-center">
        <input
          id="human-in-the-loop"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={humanInTheLoop}
          onChange={(e) => onHumanInTheLoopChange(e.target.checked)}
        />
        <label htmlFor="human-in-the-loop" className="text-sm text-gray-700 cursor-pointer select-none">
          ปิดระบบ AI ตรวจสอบการแพ้อาหาร (ข้ามการตรวจสอบโดยระบบ)
        </label>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          className="rounded-xl bg-[#4B7B5A] px-6 py-2.5 text-body-small font-semibold text-white hover:bg-[#3E694C] transition-colors disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
          onClick={() => onSaveWithTab(activeTab)}
          disabled={isSaving}
        >
          บันทึก{mealTabs.find(t => t.key === activeTab)?.label}
        </button>
      </div>
    </>
  );
}