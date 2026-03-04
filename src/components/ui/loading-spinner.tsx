export function LoadingSpinner() {
	return (
		<div className="flex justify-center py-2">
			<div className="animate-spin">
				<div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
			</div>
		</div>
	);
}
