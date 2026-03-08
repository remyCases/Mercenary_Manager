export const DialogConfirm = (() => {
	const dialog = document.getElementById("confirmDialog");
	const confirmButton = dialog.querySelector(".confirmButton");
	const cancelButton = dialog.querySelector(".cancelButton");
	const confirmMessage = dialog.querySelector("#confirmMessage");
	let pendingAction = null;

	function init() {
		document.addEventListener("click", (e) => {
			const button = e.target.closest("button.danger");
			if (!button) return;

			e.preventDefault();
			e.stopPropagation();

			pendingAction = button;

			const message = button.dataset.confirmMessage ||
				`Are you sure you want to ${button.textContent.toLowerCase()} ?`;
			confirmMessage.textContent = message;
			confirmDialog.showModal();
		});

		dialog.addEventListener("close", () => {
			pendingAction = null;
		});

		confirmButton.addEventListener("click", () => {
			if (pendingAction) {
				pendingAction.dispatchEvent(new Event("confirmed"));
				pendingAction.click();
			}
			confirmDialog.close();
			pendingAction = null;
		});

		cancelButton.addEventListener("click", () => {
			dialog.close();
			pendingAction = null;
		});
	}

	return { init, open };
})();

DialogConfirm.init();
