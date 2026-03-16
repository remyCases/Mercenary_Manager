export const DialogLowOnFood = (() => {
	const modal = document.getElementById("lowOnFoodDialog");
	const button = modal.querySelector("#lowOnFoodButton");

	function open() {
		modal.showModal();
	}

	function init() {
		button.addEventListener("click", () => {
			modal.close();
		});
	}

	function getModal() {
		return modal;
	}

	return { init, open, getModal };
})();

DialogLowOnFood.init();
