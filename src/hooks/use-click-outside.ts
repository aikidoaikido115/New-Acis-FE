import { useEffect, RefObject, useCallback } from "react";

export function useClickOutside(
	callback: () => void,
	...refs: RefObject<HTMLElement | null>[]
) {
	const memoizedCallback = useCallback(callback, [callback]);
	
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const isOutside = refs.every(
				(ref) => !ref.current?.contains(event.target as Node)
			);
			if (isOutside) memoizedCallback();
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [refs, memoizedCallback]);
}
