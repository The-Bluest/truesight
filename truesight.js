// Test to see if code is working
document.body.style.border = "10px solid blue";

// Persistent storage for flagged users
// To clear users in console while on X use command localStorage.removeItems("flaggedPosts");
let flaggedPosts = JSON.parse(localStorage.getItem("flaggedPosts") || "[]");

function savePosts() {
	localStorage.setItem('flaggedPosts', JSON.stringify(flaggedPosts));
}


// Moderation review/warning once user report hits 100
const threshold = 100;

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

    // Immediately re-check feed
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

			container.insertBefore(warning, buttonAgree);
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
				console.log("Post ID:", match[1]);
				return match[1];
			}
		}
	return null;
}

function getTotalFlags(username) {
	return flaggedPosts
		.filter(flag => flag.username === username)
		.reduuce((total, flag) => total + flag.count, 0);
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

        	<button class="save-flag">Flag Post</button>

        	<button class="cancel-flag">Close</button>

        	<div class="flag-status"></div>
    	`;

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

			form.classList.toggle("open");

        	if (existingFlag) {

            		existingFlag.count++; // If flag already exists it only increments the count

        	} else {

            		flaggedPosts.push({ // New flag sets count to one
                	post: post,
					username: username,
                	count: 1
            	});
        	}

        savePosts();

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
		// Prevents flag being added multiple times
    	if (article.dataset.flaggedFormAdded === "true") {
        	return;
    	}

    	article.dataset.flaggedFormAdded = "true";

    	const flaggedPost = flaggedPosts.find(flag => flag.post === post);

    	if (!flaggedPost) return;

    	const container = document.createElement("div");

    	container.className = "flagged-user-form";

		if (sensitivity === 1) {
			container.style.position = "absolute";
		}

    	container.innerHTML = `
        <div class="flagged-user-header">Flagged Post</div>

        <div class="flagged-user-info"><strong>@${flaggedPost.username}</strong></div>

        <div class="flagged-user-count">Flags: ${flaggedPost.count}</div>

        <button class="agree-flag">Agree</button>

        <button class="disagree-flag">Disagree</button>
    	`;

	article.appendChild(container);

	// Show moderator warning immediately if qualified
	updateWarning(container, flaggedPost);

    	// Agree button
    	container.querySelector(".agree-flag").addEventListener("click", () => {

            	flaggedPost.count++;

            	savePosts();

            	container.querySelector(".flagged-user-count").textContent = `Flags: ${flaggedPost.count}`;

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

				processTweets();

                return;
            }

            // Otherwise save the new count
            savePosts();

            container.querySelector(".flagged-user-count").textContent = `Flags: ${flaggedPost.count}`;

			updateWarning(container, flaggedPost);

        });
}

function postFlagged(post) {

	return flaggedPosts.some(flag => flag.post === post);

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

            flaggedForm(article, username, post);

            return;
        }


        // Check user's total flagged post count
        const reachedThreshold = postFlaggedCounter(username);


        if (reachedThreshold) {

            // User has reached the threshold
            article.classList.add("highlighted-user");

            addFlagForm(article, username, post);

        } else {

            // User has NOT reached the threshol remove highlighting if it was previously added.
            article.classList.remove("highlighted-user");

            addFlagForm(article, username, post);
        }
    });
}

// Initial scan
processTweets();

// Watch for new tweets appearing while scrolling
const observer = new MutationObserver(() => {

    processTweets();

});

observer.observe(document.body, {
    childList: true,
    subtree: true
});