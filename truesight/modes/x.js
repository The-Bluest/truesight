// List the usernames you want to highlight
const targetUsers = [
    "elonmusk",
    "OpenAI",
    "jack",
    "sama",
    "SamAltman",
    "Grok",
    "Jeff",
    "Jeff Bezos"
    "AI"
];

function processTweets() {

    const articles = document.querySelectorAll("article");

    articles.forEach(article => {

        const links = article.querySelectorAll('a[href^="/"]');

        let username = null;

        links.forEach(link => {

            const href = link.getAttribute("href");

            if (!href) return;

            const match = href.match(/^\/([^\/]+)$/);

            if (match) {
                username = match[1];
            }

        });

        if (username && targetUsers.includes(username)) {

            article.classList.add("highlighted-user");

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
