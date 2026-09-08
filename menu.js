
const slider = document.getElementById("Threshold");
const valueDisplay = document.getElementById("thresholdValue");

const DEFAULT_THRESHOLD = 1;

// Make sure the HTML elements actually exist
if (!slider || !valueDisplay) {
    console.error("TrueSight: Could not find Threshold or thresholdValue element.");
} else {

    // Load saved threshold
    browser.storage.local.get("postThreshold").then((result) => {

        const threshold = Number(
            result.postThreshold ?? DEFAULT_THRESHOLD
        );

        slider.value = threshold;
        valueDisplay.textContent = threshold;

        console.log("TrueSight menu: Loaded threshold =", threshold);
    });


    // Save whenever slider moves
    slider.addEventListener("input", () => {

        const threshold = Number(slider.value);

        valueDisplay.textContent = threshold;

        browser.storage.local.set({
            postThreshold: threshold
        }).then(() => {

            console.log(
                "TrueSight menu: Saved postThreshold =",
                threshold
            );

        }).catch((error) => {

            console.error(
                "TrueSight menu: Failed to save threshold:",
                error
            );

        });
    });
}

