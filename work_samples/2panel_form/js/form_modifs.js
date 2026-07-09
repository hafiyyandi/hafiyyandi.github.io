//add or remove input fields, validation, (possibly) mobile view adjustments or functions for #form_panel

let content_count = 1;
let client_count = 1;
let press_count = 1;
let content_max = 4;
let press_max = 6;
let client_max = 6;

/*-----------------------------------*/
//add input field (featured content, client list, press articles)

function addField(e) {
    let placeholder;

    //get the element-to-be-modified from the clicked button's id
    let id = $(e).attr("id");
    id = id.split("_")[1];


    //different element has different placeholders
    switch (id) {
        case "content":
            placeholder = "https://instagram.com/..."
            break;
        case "client":
            placeholder = "Your Answer..."
            break;
        case "press":
            placeholder = "https://news.com/..."
            break;
    }

    //add additional input as long as they don't hit maximum number
    //todo: remove add button once they hit max?
    let count = eval(id + "_count");
    let max = eval(id + "_max");

    if (count < max) {
        let input_html = "<input class=\"short_answer " + id +
            "_item\" type=\"text\" value=\"\" name=\"" + id +
            "_item\" placeholder=\"" + placeholder + "\">";

        $("#" + id + "_inputs").append(input_html);
        eval(id + "_count++");
    }
}

/*-----------------------------------*/
//form's section reveal & scroll

function sectionScroll(e) {

    //get the section to display from the clicked button's id
    let btn = $(e).attr("id");
    let id = "#" + btn.substring(btn.indexOf('_') + 1);

    //show the next section
    $(id).show();
    //$(id).slideDown("slow");

    //hide the current next button
    //todo: make it fade?
    $("#" + btn).fadeOut("fast");

    //autscroll to the section-label in this section
    let anchor = $(id).find(".section_label")[0];
    let destination = anchor.offsetTop - 100;
    $("#form_panel").animate({
        scrollTop: destination
    }, 500);
}


/*-----------------------------------*/
//platform login, success & error handling

function socialLogin(e) {
    //get the platform (insta/twitter/yt) from the clicked button's id
    let id = $(e).attr("id");
    let platform = id.split("_")[1];

    switch (platform) {
        case "insta":
            //instagram login API
            break;
        case "twitter":
            //twitter login API
            break;
        case "youtube":
            //youtube login API
            break;
    }

    //if sucessful... (make this into a callback function)
    $("#" + id).hide();
    $("#success_" + platform).fadeIn("slow");

    //todo: call function to render preview after login success
}

/*-----------------------------------*/
//SUBMIT FORM!

function submitForm() {
    //POST here

    //if successful... (make this into a callback function)
    $("form").fadeOut("slow", function() {
        $("#thankyou_wrapper").fadeIn("slow");
    });

}