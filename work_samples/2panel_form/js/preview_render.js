//use the same data structure for posting form inputs to server?
let placeholder = {
	name: "Johnny Doe",
	tagline: "Tagline",
	email: "hello@mywebsite.com",
	bio: {
		highlight: "Bio goes here.",
		body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
	},
	social : {
		insta: {
			handle: "@johndoe",
			following_count: "--"
		},
		twitter: {
			handle: "@johndoe",
			following_count: "--"
		},
		youtube: {
			handle: "johndoe",
			following_count: "--"
		}
	}
}

function updateShort(e){

	//get element-to-be-rendered from input's id
	let id = $(e).attr("id");
	id = "#" + id.substring(2);

	let val = $(e).val();

	if (val) {
		$(id).html(val);
		$(id).removeClass("untouched");
	} else { //if input has no value, put back placeholder
		$(id).html(eval("placeholder."+id.substring(1)));
		$(id).addClass("untouched");
	}

	//keep the email link clickable
	if (id == "#email") {
		$(id).attr("href", "mailto:" + (val || placeholder.email));
	}

}

/*-----------------------------------*/
//content / client / press item inputs -> preview cards

let item_config = {
	content: {
		row: "#featuredcontent",
		card: ".content_item",
		text: ".caption",
		text_placeholder: "Caption goes here",
		link: true
	},
	client: {
		row: "#clientlist",
		card: ".client_item",
		text: ".client_text_wrapper div",
		text_placeholder: "Client Name",
		link: false
	},
	press: {
		row: "#presslist",
		card: ".press_item",
		text: ".title",
		text_placeholder: "Title Goes Here",
		link: true
	}
};

function updateItem(e) {

	//which item group is this input from? (works for added inputs too)
	let type = $(e).closest("#content_inputs").length ? "content" :
	           $(e).closest("#client_inputs").length ? "client" :
	           $(e).closest("#press_inputs").length ? "press" : null;
	if (!type) return;

	let conf = item_config[type];
	let idx = $("#" + type + "_inputs input").index(e);
	let $row = $(conf.row);
	let $cards = $row.children(conf.card);

	//not enough preview cards for this input? clone the first one
	while ($cards.length <= idx) {
		let $clone = $cards.first().clone();
		$clone.find(conf.text).text(conf.text_placeholder);
		if (conf.link) $clone.find("a").first().attr("href", "");
		$row.append($clone);
		$cards = $row.children(conf.card);
	}

	let $card = $cards.eq(idx);
	let val = $(e).val();

	$card.find(conf.text).text(val || conf.text_placeholder);
	if (conf.link) {
		$card.find("a").first().attr("href", val || "");
	}

	//press cards also show the article's source (site name)
	if (type == "press") {
		let source = "Source";
		try {
			if (val) source = new URL(val).hostname.replace("www.", "");
		} catch (err) {} //not a full URL yet, keep placeholder
		$card.find(".source").text(source);
	}

	//grey the section out only while no input in the group has a value
	let hasValue = $("#" + type + "_inputs input").filter(function() {
		return $(this).val();
	}).length > 0;
	$row.toggleClass("untouched", !hasValue);

}

/*-----------------------------------*/
//social account links -> preview handles

function updateSocial(e) {

	//get the platform (insta/twitter/youtube) from the input's id: f_insta etc.
	let platform = $(e).attr("id").substring(2);
	let val = $(e).val();

	let handle = "";
	if (val) {
		//take the last path segment of the pasted link as the handle
		let segments = val.split(/[/?#]/).filter(Boolean);
		handle = segments[segments.length - 1] || val;
		if (platform != "youtube" && handle.charAt(0) != "@") {
			handle = "@" + handle;
		}
	}

	if (handle) {
		$("#handle_" + platform).html(handle).removeClass("untouched");
		$("#" + platform).removeClass("untouched");
	} else { //put back placeholder
		$("#handle_" + platform).html(placeholder.social[platform].handle).addClass("untouched");
		$("#" + platform).addClass("untouched");
	}

	//link the card's click area & handle to the pasted URL
	$("#" + platform).find("a").attr("href", val || "");

}

function updateBio(val){

	let highlight;
	let body;

	//parse bio input here
	//todo: recognize other punctuations: !

	if(val) {
		let bio = val.split(".");

		if (bio.length>1){ //if bio has more than 1 sentence, make the first sentence a highlight
			highlight = val.split(".")[0] + ".";
			body = val.substring(val.indexOf('.')+1);
		} else { //else don't highlight anything
			highlight = "";
			body = val;
		}
	} else { //if there isn't anything on the text box, default to placeholder
		highlight = placeholder.bio.highlight;
		body = placeholder.bio.body;
	}

	let bio_html = "<p> <span class=\"highlight\">" + highlight + "</span> " +
                   body + "</p>";
    $("#bio").html(bio_html);

}

function initPlaceholder() {
	$("#name").html(placeholder.name);
	$("#tagline").html(placeholder.tagline);
	$("#email").html(placeholder.email).attr("href", "mailto:" + placeholder.email);

	//Bio's HTML string
	let bio_html = "<p> <span class=\"highlight\">" + placeholder.bio.highlight + "</span> " +
                   placeholder.bio.body + "</p>";
    $("#bio").html(bio_html);
}

