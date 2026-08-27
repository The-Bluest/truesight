// Test to see if code is working
document.body.style.border = "10px solid blue";

// Persistent storage for flagged users
// To clear users in console while on X use command localStorage.removeItems("flaggedUsers");
let flaggedUsers = JSON.parse(localStorage.getItem("flaggedUsers") || "[]");

function saveFlags() {
	localStorage.setItem('flaggedUsers', JSON.stringify(flaggedUsers));
}

// Moderation review/warning once user report hits 100 (change to threshold)
const threshold = 100;

// Moderator review warning is added/removed inside flagged user box
function updateWarning(container, user) {
	
	let warning = container.querySelector(".mod-warning");

	if (user.count >= threshold) {

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

// Flag form that allows the flagging of users and adds to array
function addFlagForm(article, username) {
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

        	<button class="save-flag">Flag User</button>

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

        	const existingFlag = flaggedUsers.find(flag => flag.username === username);

        	if (existingFlag) {

            		existingFlag.count++; // If flag already exists it only increments the count

        	} else {

            		flaggedUsers.push({ // New flag sets count to one
                	username: username,
                	count: 1
            	});

        }

        saveFlags();

        console.log("Flagged users:", flaggedUsers);

        const status = form.querySelector(".flag-status");

        status.textContent = "Flag Saved";

	// Immediately updates and shows users as flagged
        article.classList.add("highlighted-user");

        flaggedForm(article, username);
    	});
}

// Form for users who are already flagged to warn, agree and disagree
function flaggedForm(article, username) {

    	if (article.dataset.flaggedFormAdded === "true") {
        	return;
    	}

    	article.dataset.flaggedFormAdded = "true";

    	const user = flaggedUsers.find(flag => flag.username === username);

    	if (!user) return;

    	const container = document.createElement("div");

    	container.className = "flagged-user-form";

    	container.innerHTML = `
        <div class="flagged-user-header">Flagged User</div>

        <div class="flagged-user-info"><strong>@${user.username}</strong></div>

        <div class="flagged-user-count">Flags: ${user.count}</div>

        <button class="agree-flag">Agree</button>

        <button class="disagree-flag">Disagree</button>
    	`;

	article.appendChild(container);

	// Show moderator warning immediately if qualified
	updateWarning(container, user);

    	// Agree button
    	container.querySelector(".agree-flag").addEventListener("click", () => {

            	user.count++;

            	saveFlags();

            	container.querySelector(".flagged-user-count").textContent = `Flags: ${user.count}`;

				updateWarning(container, user);

        });


    	// Disagree button
    	container.querySelector(".disagree-flag").addEventListener("click", () => {

            	user.count--;

            	// If count reaches zero, completely remove the user
            	if (user.count <= 0) {

                flaggedUsers = flaggedUsers.filter(flag => flag.username !== username);

                saveFlags();

                container.remove();

                article.classList.remove("highlighted-user");

                delete article.dataset.flaggedFormAdded;

                console.log(`@${username} removed from flagged users`);

                return;
            }

            // Otherwise save the new count
            saveFlags();

            container.querySelector(".flagged-user-count").textContent = `Flags: ${user.count}`;

			updateWarning(container, user);

        });
}

function userFlagged(username) {
	return flaggedUsers.some(flag => flag.username === username);
}

function processTweets() {

    const articles = document.querySelectorAll("article");

    articles.forEach(article => {

        const username = getUsername(article);

        if (!username) return;
	
	if (userFlagged(username)){
		article.classList.add("highlighted-user");
		flaggedForm(article, username);
	} else {
		addFlagForm(article, username);
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
console.log(flaggedUsers);
