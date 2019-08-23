const post_preview = {

	saved_posts: {},

	options: {
        preview_class: "post_preview",
        
        fetch_url: tid => `http://localhost:90/mybb1.8.21/showthread.php?tid=${tid}`, 

        comments: true,

		fetch_selectors: {
			body: ".post"
		},

		preview_css: {
			height: 800,
			width: 500, 
			margin: 30, // distance in pixels the preview box should be from the post title
		}

    },
    
    get_content: async (part, el, url, comments) => {

        if (comments) {
            url = `${url} ${post_preview.options.fetch_selectors[part]}`;
        } else {
            url = `${url} ${post_preview.options.fetch_selectors[part]}:eq(0)`;
        }
        

        await new Promise((resolve,reject) => {
			$(el).load(url, (response,status,xhr) => {

				if (status == "error") reject(xhr);
				resolve(response);

			})
        })
        .catch(xhr => console.log(`Unable to fetch post content: ${xhr.status}, ${xhr.statusText}`));

		return el;
    },

	get_preview: async (link,comments) => {
		
		// create container for our post and author sections of the preview
		let post_container = document.createElement("div");
		let author = document.createElement("div");
		let username = document.createElement("div");

		
		author.setAttribute("class", "post_author");
		post_container.setAttribute("class", "post_container");

		// fetch post and author content
		post_container = await post_preview.get_content("body", post_container, link, comments);
        // author = await post_preview.get_content("author_avatar", author, link);
        // username = await post_preview.get_content("username", username, link)

		return { avatar: author, name: username, body: post_container };

	},

	preview: async (e) => {
        let selector,comments;

        if (!e.target || e.target.classList.contains("get-preview-replys")) {
            e = post_preview.post_id;
            comments = true;
        } else {
            selector = e.target;
            // get post link
            post_preview.post_id = selector.dataset.previewPost;
        }
        
        let link = post_preview.options.fetch_url(post_preview.post_id);

		// preview container
		let preview_container = document.querySelector(".preview-box");
        if ($(preview_container).width() === 0) {
            $(preview_container).animate({
                width: $(".sidebar-menu").width(),
                padding: "1rem"
            },200);
        }
        
		// if we have already loaded this preview use that data otherwise send ajax request for page
		let post;
		if (!post_preview.saved_posts[link] || comments) {
			// send request
			post = await post_preview.get_preview(link,comments);
			// save data so we don't need to request it again
			post_preview.saved_posts[link] = post;
		} else {
			// if data is already available, simply use that
			post = post_preview.saved_posts[link];
        }

        let comment_button;
        if (post_preview.options.comments && !comments) {
            comment_button = document.createElement("button");
            comment_button.onclick = post_preview.preview;
            comment_button.classList = "get-preview-replys button";
            comment_button.innerText = "View Replys"
        }
        
        post_preview.output_preview(preview_container,post,comment_button);

	},

	output_preview: (container,output,comment_button) => {
        let el = document.createElement("div");
        container.innerHTML = null;

        arr = Object.values(output);
        for (let item of arr) {
            if (!item.classList.contains("post_container")) {
                el.appendChild(item);
            }
        }
        
        container.appendChild(el);
        container.appendChild(output.body);
        if (comment_button) container.appendChild(comment_button);

        $(".bc-page,.sidebar-menu").bind("click", post_preview.remove_previews);
	},

	remove_previews: e => {
        $(".preview-box").animate({
            width: 0,
            padding: 0
        },200);
        $(".preview-box").html(null);
        $(".bc-page,.sidebar-menu").unbind("click", post_preview.remove_previews);
	}
}

// add post previews
$("body").on("click", "[data-preview-post]", e => post_preview.preview(event));