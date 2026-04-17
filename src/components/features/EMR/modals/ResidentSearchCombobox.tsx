"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

interface ResidentSearchComboboxProps {
  residents?: Resident[];
  rooms?: Room[];
  options?: ResidentComboboxOption[];
  value: string;
  onChange: (residentId: string) => void;
  onClear: () => void;
  autoFocus?: boolean;
  label?: string;
  placeholder?: string;
}

export interface ResidentComboboxOption {
  id: string;
  fullName: string;
  nickname?: string;
  roomNumber?: string;
  floorLabel?: string;
  subLabel?: string;
  searchText: string;
  floorValue?: string;
}

export function ResidentSearchCombobox({
  residents = [],
  rooms = [],
  options,
  value,
  onChange,
  onClear,
  autoFocus = false,
  label = "ผู้ป่วย",
  placeholder = "ค้นหาชื่อผู้ป่วย...",
}: ResidentSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const roomById = useMemo(() => {
    return new Map(
      rooms.map((room) => {
        const id = room.room_id || room.id;
        return [id, room] as const;
      })
    );
  }, [rooms]);

  const mappedOptions = useMemo<ResidentComboboxOption[]>(() => {
    if (options && options.length > 0) {
      return options;
    }

    return residents
      .map((resident) => {
        const id = resident.resident_id || resident.id;
        const fullName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || "-";
        const nickname = resident.nickname || "";
        const room = resident.room_id ? roomById.get(resident.room_id) : undefined;
        const roomNumber = room?.room_number ? `ห้อง ${room.room_number}` : "ไม่ระบุห้อง";
        const floorValue = String(room?.floor ?? resident.floor ?? "");
        const floorLabel = floorValue ? `ชั้น ${floorValue}` : "ไม่ระบุชั้น";
        const searchText = `${fullName} ${nickname} ${roomNumber} ${floorLabel}`.toLowerCase();

        return {
          id,
          fullName,
          nickname,
          roomNumber,
          floorLabel,
          subLabel: `${roomNumber} | ${floorLabel}`,
          searchText,
          floorValue,
        };
      })
      .filter((resident) => !!resident.id);
  }, [options, residents, roomById]);

  const selectedResident = useMemo(() => {
    return mappedOptions.find((resident) => resident.id === value) || null;
  }, [mappedOptions, value]);

  const floorOptions = useMemo(() => {
    const floors = Array.from(
      new Set(
        mappedOptions
          .map((option) => option.floorValue)
          .filter((option): option is string => typeof option === "string" && option !== "")
      )
    ).sort((a, b) => Number(a) - Number(b));

    return floors;
  }, [mappedOptions]);

  const filteredResidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mappedOptions.filter((resident) => {
      const matchesFloor = floorFilter === "all" || resident.floorValue === floorFilter;
      const matchesQuery = !normalizedQuery || resident.searchText.includes(normalizedQuery);
      return matchesFloor && matchesQuery;
    });
  }, [mappedOptions, query, floorFilter]);

  useEffect(() => {
    if (autoFocus && !selectedResident && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, selectedResident]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }

    if (filteredResidents.length === 0) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex((prev) => {
      if (prev < 0 || prev >= filteredResidents.length) {
        return 0;
      }
      return prev;
    });
  }, [isOpen, filteredResidents]);

  useClickOutside(() => setIsOpen(false), containerRef);

  const handleSelect = (residentId: string) => {
    onChange(residentId);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      if (filteredResidents.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (!isOpen) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filteredResidents.length === 0) {
        return;
      }
      setHighlightedIndex((prev) => {
        if (prev < 0) {
          return 0;
        }
        return Math.min(prev + 1, filteredResidents.length - 1);
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredResidents.length === 0) {
        return;
      }
      setHighlightedIndex((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      if (highlightedIndex >= 0 && filteredResidents[highlightedIndex]) {
        event.preventDefault();
        handleSelect(filteredResidents[highlightedIndex].id);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="resident-search" className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {selectedResident ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-full bg-blue-100 p-1.5 text-blue-600">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-blue-900">{selectedResident.fullName}</p>
              <p className="truncate text-xs text-blue-700">
                {selectedResident.subLabel || [selectedResident.roomNumber, selectedResident.floorLabel].filter(Boolean).join(" | ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label="ลบผู้ป่วยที่เลือก"
            className="rounded p-1 text-blue-600 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2" ref={containerRef}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="resident-search"
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              placeholder={placeholder}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-black placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {isOpen ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredResidents.length > 0 ? (
                  filteredResidents.map((resident, index) => (
                    <button
                      key={resident.id}
                      type="button"
                      onClick={() => handleSelect(resident.id)}
                      className={`w-full border-b border-gray-100 px-3 py-2 text-left last:border-b-0 ${
                        index === highlightedIndex ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-black">{resident.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {resident.subLabel || [resident.roomNumber, resident.floorLabel].filter(Boolean).join(" | ")}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-center text-sm text-slate-500">ไม่พบผู้ป่วยตามเงื่อนไข</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="min-w-28">
            <select
              value={floorFilter}
              onChange={(event) => setFloorFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="กรองตามชั้น"
            >
              <option value="all">ทุกชั้น</option>
              {floorOptions.map((floor) => (
                <option key={floor} value={floor}>
                  ชั้น {floor}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
