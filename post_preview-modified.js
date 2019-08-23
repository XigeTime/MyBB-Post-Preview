const post_preview = {

	saved_posts: {},

	options: {
        
        fetch_url: tid => `mybb/showthread.php?tid=${tid}`, 

        comments: true,

		fetch_selectors: {
			body: ".post"
		},

    },
    
    get_content: async (part, el, url, comments) => {

        url = `${url} ${post_preview.options.fetch_selectors[part]}${(!comments) ? ':eq(0)' : ''}`;        

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

		post_container.setAttribute("class", "post_container");

		// fetch post and author content
		post_container = await post_preview.get_content("body", post_container, link, comments);

		return post_container;

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

        el.appendChild(output);
        
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