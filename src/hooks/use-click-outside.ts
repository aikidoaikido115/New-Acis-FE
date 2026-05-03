import { useEffect, RefObject } from "react";

export function useClickOutside(
	callback: () => void,
	...refs: RefObject<HTMLElement | null>[]
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
	}, [callback, refs]);
}
