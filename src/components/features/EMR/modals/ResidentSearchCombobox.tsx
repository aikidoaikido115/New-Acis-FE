"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

interface ResidentSearchComboboxProps {
  residents: Resident[];
  rooms: Room[];
  value: string;
  onChange: (residentId: string) => void;
  onClear: () => void;
  autoFocus?: boolean;
}

interface ResidentOption {
  id: string;
  fullName: string;
  nickname: string;
  roomNumber: string;
  floorLabel: string;
  searchText: string;
  floorValue: string;
}

export function ResidentSearchCombobox({
  residents,
  rooms,
  value,
  onChange,
  onClear,
  autoFocus = false,
}: ResidentSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState<string>("all");
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

  const options = useMemo<ResidentOption[]>(() => {
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
          searchText,
          floorValue,
        };
      })
      .filter((resident) => !!resident.id);
  }, [residents, roomById]);

  const selectedResident = useMemo(() => {
    return options.find((resident) => resident.id === value) || null;
  }, [options, value]);

  const floorOptions = useMemo(() => {
    const floors = Array.from(
      new Set(
        options
          .map((option) => option.floorValue)
          .filter((option) => option !== "")
      )
    ).sort((a, b) => Number(a) - Number(b));

    return floors;
  }, [options]);

  const filteredResidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return options.filter((resident) => {
      const matchesFloor = floorFilter === "all" || resident.floorValue === floorFilter;
      const matchesQuery = !normalizedQuery || resident.searchText.includes(normalizedQuery);
      return matchesFloor && matchesQuery;
    });
  }, [options, query, floorFilter]);

  useEffect(() => {
    if (autoFocus && !selectedResident && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, selectedResident]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (residentId: string) => {
    onChange(residentId);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="resident-search" className="block text-sm font-medium text-gray-700">
        ผู้ป่วย
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
                {selectedResident.roomNumber} | {selectedResident.floorLabel}
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
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              placeholder="ค้นหาชื่อผู้ป่วย..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {isOpen ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredResidents.length > 0 ? (
                  filteredResidents.map((resident) => (
                    <button
                      key={resident.id}
                      type="button"
                      onClick={() => handleSelect(resident.id)}
                      className="w-full border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-800">{resident.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {resident.roomNumber} | {resident.floorLabel}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-center text-sm text-gray-500">ไม่พบผู้ป่วยตามเงื่อนไข</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="min-w-28">
            <select
              value={floorFilter}
              onChange={(event) => setFloorFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
