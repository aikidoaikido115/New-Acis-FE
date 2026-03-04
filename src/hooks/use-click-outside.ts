import { useEffect, RefObject } from "react";

export function useClickOutside(
	refs: RefObject<HTMLElement | null>[],
	callback: () => void
) {
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const isOutside = refs.every(
				(ref) => !ref.current?.contains(event.target as Node)
			);
			if (isOutside) callback();
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [refs, callback]);
}
