function highlightFacebook() {

 //turns out facebook is kinda multimedia and doesn't have a universal framework. So instead looking straight for links that may impact performance but idk

    const possiblePosts = document.querySelectorAll(
        '[role="article"], [role="feed"] > div'
    );


    possiblePosts.forEach(post => {

        //scan post for profile link.
        const profileLinks = post.querySelectorAll(
            'a[href*="facebook.com"]'
        );


        let matchedUser = null;


        profileLinks.forEach(link => {

            const href = link.href;

            if (!href) {
                return;
            }


            /*
             * Look for:
             *
             * https://www.facebook.com/profile.php?id=123456
             */

            try {

                const url = new URL(href);

                const id = url.searchParams.get("id");


                if (
                    id &&
                    Object.prototype.hasOwnProperty.call(
                        users.facebook,
                        id
                    )
                ) {

                    matchedUser = id;

                }

            } catch (error) {

                console.debug(
                    "Facebook URL could not be parsed:",
                    href
                );

            }

        });


        /*
         * We found a configured Facebook user.
         */

        if (matchedUser) {

            post.classList.add("user-highlight");

            post.style.color =
                users.facebook[matchedUser];

        }

    });

}