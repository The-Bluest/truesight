// Persistent storage for flagged users
// To clear users in console while on X use command localStorage.removeItems("flaggedPosts");
let flaggedPosts = JSON.parse(localStorage.getItem("flaggedPosts") || "[]");

let flagCount = 0;
browser.storage.local.get("flagCount").then((result) => {
	flagCount = Number(result.flagCount ?? 0);
	console.log("TrueSight: Loaded flagCount =", flagCount);
});

function savePosts() {
	localStorage.setItem('flaggedPosts', JSON.stringify(flaggedPosts));
}

// Child mode setting
let childMode = false;

// Load saved child mode
browser.storage.local.get("childMode").then((result) => {
    childMode = result.childMode ?? false;

    console.log("TrueSight: Loaded childMode =", childMode);

    // Process tweets after the setting has loaded
    processTweets();

}).catch((error) => {
    console.error("TrueSight: Failed to load childMode:", error);

    // Still process tweets using the default value
    processTweets();
});


// Listen for child mode changes from the menu
browser.storage.onChanged.addListener((changes, areaName) => {

    if (areaName !== "local") {
        return;
    }

    if (!changes.childMode) {
        return;
    }

    childMode = changes.childMode.newValue ?? false;

    console.log(
        "TrueSight: childMode changed to",
        childMode
    );

    processTweets();
});

// Moderation review/warning once user report hits 100
const threshold = 10;

// Post threshold controlled by the menu
let postThreshold = 5;


// Load the saved threshold from fiefox storage
browser.storage.local.get("postThreshold").then((result) => {

    postThreshold = Number(result.postThreshold ?? 1);
    console.log("TrueSight: Loaded postThreshold =", postThreshold);

    // Process posts after the setting has loaded
    processTweets();

}).catch((error) => {

    console.error(
        "TrueSight: Failed to load postThreshold:",
        error
    );

});


// Listen for changes made by menu.js should fix restart requirement 
browser.storage.onChanged.addListener((changes, areaName) => {

    if (areaName !== "local") {
        return;
    }

    if (!changes.postThreshold) {
        return;
    }

    postThreshold = Number(
        changes.postThreshold.newValue ?? 1
    );

    console.log(
        "TrueSight: postThreshold changed to",
        postThreshold
    );

    processTweets();
});



// Moderator review warning is added/removed inside flagged user box
function updateWarning(container, user) {
	
	let warning = container.querySelector(".mod-warning");

	const totalFlags = getTotalFlags(user.username);

	if (totalFlags >= threshold) {

		if (!warning) {

			warning = document.createElement("div");

			warning.className = "mod-warning"; 

			warning.innerHTML = `<strong>This user is undergoing moderation review.</strong>`;

			const buttonAgree = container.querySelector(".agree-flag");

			if (buttonAgree) {
    			container.insertBefore(warning, buttonAgree);
			} else {
    			container.appendChild(warning);
			}

		}
	}
	
	else if (warning) {

		warning.remove();
	}
}

// Removed from processTweets function to allow us to use it in different areas
function getUsername(article) {

	const links = article.querySelectorAll('a[href^="/"]');

	for (const link of links) {

        	const href = link.getAttribute("href");

        	if (!href) continue;

        	const match = href.match(/^\/([^\/]+)$/);

        	if (match) {
            		return match[1];
        	}
	}

   	return null;
}

function getPosts(article) {
	
	const posts = article.querySelectorAll('a[href^="/"]');

	for (const post of posts) {

			const href = post.getAttribute("href");

			if (!href) continue;

			const match = href.match(/^\/[^\/]+\/[^\/]+\/([^\/]+)$/);

			if (match) {
				return match[1];
			}
		}
	return null;
}

function getTotalFlags(username) {
	return flaggedPosts
		.filter(flag => flag.username === username)
		.reduce((total, flag) => total + flag.count, 0);
}

function postFlaggedCounter(username) {

    const flaggedPostsCount = flaggedPosts
        .filter(flag => flag.username === username)
        .reduce((total, flag) => {
            return total + flag.count;
        }, 0);

    console.log(
        `TrueSight: @${username} has ${flaggedPostsCount} flags. Threshold: ${postThreshold}`
    );

    return flaggedPostsCount >= postThreshold;
}

// Flag form that allows the flagging of users and adds to array
function addFlagForm(article, username, post) {
	// Prevents flag being added multiple times
	if (article.dataset.flagAdded === "true") {
        	return;
	}

	article.dataset.flagAdded = "true";

	// CSS applied
	const container = document.createElement("div");
	container.className = "user-flag-container";


	// Flag button for pop-up
	const flagButton = document.createElement("button");

	flagButton.className = "flag-button";
	flagButton.textContent = "F";
	flagButton.title = `Flag @${username}`;

	// Form for once button is clicked
	const form = document.createElement("div");

	form.className = "flag-form";
	
	form.innerHTML = `
        	<strong>Flag @${username}</strong>

			<select class="reason-select">
				<option value="" disabled selected hidden>Select reason...</option>
        		<option value="1">1 - AI Images</option>
        		<option value="2">2 - AI Text</option>
        		<option value="3">3 - Other</option>
				<option value="4">4 - N/A</option>
    		</select>

        	<button class="save-flag">Flag Post</button>

        	<button class="cancel-flag">Close</button>

        	<div class="flag-status"></div>
    `;

	form.addEventListener("click", (event) => {
    	event.stopPropagation();
	});

	container.appendChild(flagButton);
	container.appendChild(form);
	
	article.style.position = "relative";

	article.appendChild(container);

	// Open / close form
	flagButton.addEventListener("click", (event) => {

        	event.stopPropagation();

        	form.classList.toggle("open");
    	});


	// Cancel flag pop up
	form.querySelector(".cancel-flag").addEventListener("click", () => {
		
		form.classList.remove("open");

	});


	// Save flag to array
	form.querySelector(".save-flag").addEventListener("click", () => {

        	const existingFlag = flaggedPosts.find(flag => flag.post === post);

			const reason = form.querySelector(".reason-select").value;

			if (reason === "") {

				const status = form.querySelector(".flag-status");

				status.textContent = "Please select a rason.";

				return;
			}

			form.classList.remove("open");

        	if (existingFlag) {

            		existingFlag.count++; // If flag already exists it only increments the count

					existingFlag.reason = reason; // Update reason if changed

        	} else {

            		flaggedPosts.push({ // New flag sets count to one
                	post: post,
					username: username,
					reason: reason,
                	count: 1
            	});
        	}

        savePosts();
		flagCount++; // Increment the total flag count

		browser.storage.local.set({ flagCount: flagCount });

		console.log("TrueSight: Flag count =", flagCount);
		console.log("Flagged posts:", flaggedPosts);

        console.log("Flagged posts:", flaggedPosts);

        const status = form.querySelector(".flag-status");

        status.textContent = "Flag Saved";

		// Immediately updates and shows users as flagged
        article.classList.add("highlighted-user");
		
		//Hide button after flagging for better UI
		flagButton.style.display = "none";

        flaggedForm(article, username, post);
    	});
}

//Temporary variable to hold the sensitivity level
let sensitivity = 0; //Default sensitivity level is 0

// Form for users who are already flagged to warn, agree and disagree
function flaggedForm(article, username, post) {
		console.log("flaggedForm() CALLED");

		const reasonNames = {
			"1": "AI Images",
			"2": "AI Text",
			"3": "Other",
			"4": "N/A"
		};

		// Prevents flag being added multiple times
    	if (article.dataset.flaggedFormAdded === "true") {
    		return;
		}

    	article.dataset.flaggedFormAdded = "true";

    	const flaggedPost = flaggedPosts.find(flag => flag.post === post);

    	if (!flaggedPost) return;

    	const container = document.createElement("div");

    	container.className = "flagged-user-form";

		if (childMode) {
			container.style.position = "absolute";
			container.style.top = "0";
			container.style.left = "0";
			container.style.width = "100%";
			container.style.height = "100%";
			container.style.zIndex = "9999";
			container.style.padding = "0";
			container.style.margin = "0";

			// Cover and block interaction with the post
			container.style.backgroundColor = "white";
			container.style.pointerEvents = "auto";

			// Hide moderation controls
			container.querySelector(".agree-flag")?.remove();
			container.querySelector(".disagree-flag")?.remove();
			container.querySelector(".close-flagged-form")?.remove();
		}

		container.innerHTML = `
			<div class="flagged-user-header">Flagged Post</div>

			<div class="flagged-user-info">
				<strong>@${flaggedPost.username}</strong>
			</div>

			<div class="flagged-user-count">
				Flags: ${flaggedPost.count}
			</div>

			<div class="flagged-user-total">
				Total Flags: ${getTotalFlags(flaggedPost.username)}
			</div>

			<div class="flagged-user-info">
				Reason: ${reasonNames[flaggedPost.reason]}
			</div>

			<button class="agree-flag">Agree</button>

			<button class="disagree-flag">Disagree</button>

			<button class="close-flagged-form">Close</button>
		`;

	article.appendChild(container);

	// Disable/hide moderation buttons in child mode
    if (childMode) {
        const agreeButton = container.querySelector(".agree-flag");
        const disagreeButton = container.querySelector(".disagree-flag");
        const closeButton = container.querySelector(".close-flagged-form");

        [agreeButton, disagreeButton, closeButton].forEach(button => {
            if (button) {
                button.disabled = true;
                button.style.display = "none";
            }
        });
    }

	// Show moderator warning immediately if qualified
	updateWarning(container, flaggedPost);
	
    	// Agree button
    	container.querySelector(".agree-flag").addEventListener("click", () => {

            	flaggedPost.count++;

            	savePosts();

            	container.querySelector(".flagged-user-count").textContent = `Flags: ${flaggedPost.count}`;

				container.querySelector(".flagged-user-total").textContent = `Total Flags: ${getTotalFlags(flaggedPost.username)}`;

				updateWarning(container, flaggedPost);

        });


    	// Disagree button
    	container.querySelector(".disagree-flag").addEventListener("click", () => {

            	flaggedPost.count--;

            	// If count reaches zero, completely remove the user
            	if (flaggedPost.count <= 0) {

                flaggedPosts = flaggedPosts.filter(flag => flag.post !== post);

                savePosts();

                container.remove();

                article.classList.remove("highlighted-user");

                delete article.dataset.flaggedFormAdded;

                console.log(`@${username} removed from flagged posts`);

                return;
            }

            // Otherwise save the new count
            savePosts();

            container.querySelector(".flagged-user-count").textContent = `Flags: ${flaggedPost.count}`;

			container.querySelector(".flagged-user-total").textContent = `Total Flags: ${getTotalFlags(flaggedPost.username)}`;

			updateWarning(container, flaggedPost);

        });
		
		// Close Flagged Form
		const closeButton = container.querySelector(".close-flagged-form");

		closeButton.addEventListener("click", (event) => {
			console.log("CLOSE BUTTON CLICKED");
			console.log("container:", container);
			console.log("container parent:", container.parentElement);

			event.preventDefault();
			event.stopPropagation();

			container.remove();

			console.log("container after remove:", container.parentElement);
		});
}

function postFlagged(post) {

	return flaggedPosts.some(flag => flag.post === post);

}

function blockAllPosts(article) {
	// Don't create multiple overlays
    if (article.querySelector(".child-mode-block")) {
        return;
    }

    const block = document.createElement("div");

    block.className = "child-mode-block";

    block.innerHTML = `
        <strong>Post hidden</strong>
        <div>This post has been hidden due to moderation.</div>
    `;

    article.style.position = "relative";

    block.style.position = "absolute";
    block.style.top = "0";
    block.style.left = "0";
    block.style.width = "100%";
    block.style.height = "100%";
    block.style.zIndex = "9999";
    block.style.backgroundColor = "white";
    block.style.display = "flex";
    block.style.flexDirection = "column";
    block.style.alignItems = "center";
    block.style.justifyContent = "flex-start";
    block.style.textAlign = "center";
    block.style.padding = "20px";
    block.style.boxSizing = "border-box";

    article.appendChild(block);
}

function processTweets() {

    const articles = document.querySelectorAll("article");

    articles.forEach(article => {

        const username = getUsername(article);
        const post = getPosts(article);

        if (!username || !post) {
            return;
        }


        // Already individually flagged post
        if (postFlagged(post)) {

            article.classList.add("highlighted-user");

			highlightUsername(article, username, true);

            flaggedForm(article, username, post);

            return;
        }


        // Check user's total flagged post count
        const reachedThreshold = postFlaggedCounter(username);


        if (reachedThreshold) {

            // User has reached the threshold
            article.classList.add("highlighted-user");

			highlightUsername(article, username, true);

			if (childMode) {
				blockAllPosts(article);
			} else {
	            addFlagForm(article, username, post);
			}

        } else {

            // User has NOT reached the threshol remove highlighting if it was previously added.
            article.classList.remove("highlighted-user");

			highlightUsername(article, username, false);

            addFlagForm(article, username, post);
        }
    });
}

function highlightUsername(article, username, highlight) {
	const links = article.querySelectorAll('a[href^="/"]');

	links.forEach(link => {
		const href = link.getAttribute("href");

		if (href === `/${username}`) {
			link.classList.toggle("highlighted-username", highlight);
		}
	});
}

// Initial scan
//processTweets();

// Watch for new tweets appearing while scrolling
const observer = new MutationObserver(() => {

	processTweets();

});

observer.observe(document.body, {
	childList: true,
	subtree: true
});