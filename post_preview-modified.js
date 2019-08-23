const post_preview = {

	saved_posts: {},

	options: {
		/* 
			Fetch URL is the target thread's URL. This works with both the standard MyBB URL's and
			SEO URL's. Any URL that has a unique thread id should work.
			Grab any threads URL then replace the thread id with ${tid} then paste in the fetch URL section.

			For example;
			 - https://example.com/thread-1111.html
			 becomes: https://example.com/thread-${tid}.html

			 - https://example.com/showthread.php?tid=1111
			 becomes: https://example.com/showthread.php?tid=${tid}
		*/

		// fetch url: tid => `https://example.com/showthread.php?tid=${tid}`
		fetch_url: tid => `https://example/thread-${tid}.html`,

		preview_class: "post_preview", // Class name for the container of the post preview.

		fetch_selectors: {
			body: ".post_body", // Class name of the post content
			author: ".author_avatar", // Class name of the author's section.
		},

		preview_css: {
			height: 100,
			width: 500, 
			margin: 30, // distance in pixels the preview box should be from the post title
		}

	},


	get_post: async (el,url) => {
		url = `${url} ${post_preview.options.fetch_selectors.body}:eq(0)`;

		await new Promise((resolve,reject) => {
			$(el).load(url, (response,status,xhr) => {

				if (status == "error") reject(xhr);
				resolve(response);

			})
		})
		.catch(xhr => console.log(`Unable to fetch post content: ${xhr.status}, ${xhr.statusText}`));

		return el;

	},

	get_author: async (el,url) => {
		url = `${url} ${post_preview.options.fetch_selectors.author}:eq(0)`;
		
		await new Promise((resolve,reject) => {
			$(el).load(url, { limit: 1 }, (response,status,xhr) => {

				if (status == "error") reject(xhr);
				resolve(response);

			});
		})
		.catch(xhr => console.log(`Unable to fetch content: ${xhr.status}, ${xhr.statusText}`));

		return el;

	},

	get_preview: async post => {
		
		// create container for our post and author sections of the preview
		let post_container = document.createElement("div");
		let author = document.createElement("div");

		
		author.setAttribute("class", "post_author");

		// build fetch url
		let url = post_preview.options.fetch_url(post); 

		// fetch post and author content
		post_container = await post_preview.get_post(post_container, url);
		author = await post_preview.get_author(author, url);

		return { a: author, p: post_container };

	},

	preview: async e => {
		if (!e) return;
		
		// remove any lingering previews
		post_preview.remove_previews();

		let selector = e.target.closest("[data-preview-post]");
	
		// build preview container
		let preview_container = document.createElement("div");
		preview_container.setAttribute("class", post_preview.options.preview_class);

		// add a loader to the preview container for time being
		let loader = document.createElement("span");
		loader.id = "preview_loader";
		loader.innerText = "Loading preview...";

		preview_container.appendChild(loader);
		
		// output preview with loader & position correctly against link
		selector.appendChild(preview_container);
		$(preview_container).css({
			height: post_preview.options.preview_css.height + "px",
			width: post_preview.options.preview_css.width + "px",
			bottom: 40 + "px"
		});

		// extract requested post id from link url
		let post_id = selector.dataset.previewPost;

		// if we have already loaded this preview use that data otherwise send ajax request for page
		let post;
		if (!post_preview.saved_posts[post_id]) {
			// send request
			post = await post_preview.get_preview(post_id);
			// save data so we don't need to request it again
			post_preview.saved_posts[post_id] = post;
		} else {
			// if data is already available, simply use that
			post = post_preview.saved_posts[post_id];
		}
		
		// remove loader and output our fetched data
		loader.outerHTML = null;
		post_preview.output_preview(preview_container,post)

	},

	output_preview: (container,output) => {
		container.appendChild(output.a);
		container.appendChild(output.p);
	},

	remove_previews: () => {
		$("." + post_preview.options.preview_class).remove();
	}
}

// add hover handler
$(document).ready(() => {
    $("[data-preview-post]").hover((e) => {
	post_preview.preview(e);
    }, () => {
	post_preview.remove_previews();
    })
})