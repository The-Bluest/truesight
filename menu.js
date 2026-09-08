const slider = document.getElementById("Threshold");
const valueDisplay = document.getElementById("thresholdValue");

const DEFAULT = 1;
// we go, thresholdValue > Threshold > postThreshold (Theshold is a wierd word)

// Load saved value
browser.storage.local.get("postThreshold").then((result) => {

    const threshold = Number(
        result.postThreshold ?? DEFAULT
    );

    slider.value = threshold;
    valueDisplay.textContent = threshold;
});


// Save whenever slider moves
slider.addEventListener("input", () => {

    const threshold = Number(slider.value);

    valueDisplay.textContent = threshold;

    browser.storage.local.set({
        postThreshold: threshold
    });
});