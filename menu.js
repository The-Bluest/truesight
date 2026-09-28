
const slider = document.getElementById("Threshold");
const valueDisplay = document.getElementById("thresholdValue");
const thresholdDescription = document.getElementById("thresholdDescription");

const DEFAULT_THRESHOLD = 5;

function updateProfileImage(flagCount) {

    const profileImage = document.getElementById("profileImage");

    if (!profileImage) {
        return;
    }

    if (flagCount >= 10) {
        profileImage.src = "./icons/gold.png";
    } else if (flagCount >= 5) {
        profileImage.src = "./icons/silver.png";
    } else {
        profileImage.src = "./icons/bronze.png";
    }
}

// Load flag count when menu opens
browser.storage.local.get("flagCount").then((result) => {

    const flagCount = Number(result.flagCount ?? 0);

    console.log(
        "TrueSight menu: Loaded flagCount =",
        flagCount
    );

    updateProfileImage(flagCount);

}).catch((error) => {

    console.error(
        "TrueSight: Failed to load flagCount:",
        error
    );

});


// Update image if flagCount changes while menu is open
browser.storage.onChanged.addListener((changes, areaName) => {

    if (areaName !== "local") {
        return;
    }

    if (!changes.flagCount) {
        return;
    }

    const newFlagCount = Number(
        changes.flagCount.newValue ?? 0
    );

    console.log(
        "TrueSight menu: flagCount changed to",
        newFlagCount
    );

    updateProfileImage(newFlagCount);
});

const childMode = document.getElementById("childMode");

if (childMode) {
    browser.storage.local.get("childMode").then((result) => {
        childMode.checked = result.childMode ?? false;

        console.log(
            "TrueSight menu: Loaded childMode =",
            childMode.checked
        );
    });

    childMode.addEventListener("change", () => {
        browser.storage.local.set({
            childMode: childMode.checked
        });
    });
}

function updateThresholdDescription(threshold) {

    if (!thresholdDescription) {
        return;
    }

    if (threshold === 1) {
        thresholdDescription.textContent =
            "Maximum Sensitivity.";

    } else if (threshold >= 2 && threshold < 25) {
        thresholdDescription.textContent =
            "High Sensitivity.";

    } else if (threshold >= 25 && threshold < 50) {
        thresholdDescription.textContent =
            "Moderate-High Sensitivity.";

    } else if (threshold >= 50 && threshold < 100) {
        thresholdDescription.textContent =
            "Moderate Sensitivity.";

    } else if (threshold === 100) {
        thresholdDescription.textContent =
            "Minimum Sensitivity.";

    } else {
        thresholdDescription.textContent =
            "Highlight users once their posts reach this number of flags.";
    }
}

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
        updateThresholdDescription(threshold);

        console.log("TrueSight menu: Loaded threshold =", threshold);
    });


    // Save whenever slider moves
    slider.addEventListener("input", () => {

        const threshold = Number(slider.value);

        valueDisplay.textContent = threshold;
        updateThresholdDescription(threshold);

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
