export const ModalQueue = (() => {
	let queue = [];
	let isProcessing = false;
	let allowed = true;

	function maskModals() {
		allowed = false;
	}

	async function forceProcessModals() {
		allowed = true;
		if (!isProcessing) {
			await process();
		}
	}

	async function add(modalElement) {
		queue.push(modalElement);
		if (!isProcessing && allowed) {
			await process();
		}
	}

	async function process() {
		isProcessing = true;
		while (queue.length > 0) {
			const modal = queue.shift();
			await showAndWait(modal);
		}
		isProcessing = false;
	}

	function showAndWait(modal) {
		return new Promise((resolve) => {
			document.body.appendChild(modal);
			modal.showModal();
			modal.addEventListener("close", () => resolve(), { once: true });
		});
	}

	return { add, maskModals, forceProcessModals };
})();

