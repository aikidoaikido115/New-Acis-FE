export type TimelineSortOrder = "newest" | "oldest";

const bangkokDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatBangkokDateKey(date: Date): string {
  return bangkokDateFormatter.format(date);
}

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  dateStyle: "medium",
  timeStyle: "short",
});

function toDateKey(date: Date): string {
  return bangkokDateFormatter.format(date);
}

export function getBangkokDateKey(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return bangkokDateFormatter.format(date);
}

export function formatBangkokDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return bangkokDateTimeFormatter.format(date);
}

export function filterAndSortByTimeline<T extends { created_at: string }>(
  items: T[],
  selectedDate: Date | null,
  sortOrder: TimelineSortOrder
): T[] {
  const dateKey = selectedDate ? toDateKey(selectedDate) : null;

  const filtered = dateKey
    ? items.filter((item) => getBangkokDateKey(item.created_at) === dateKey)
    : items;

  return [...filtered].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();

    if (sortOrder === "oldest") {
      return leftTime - rightTime;
    }

    return rightTime - leftTime;
  });
}