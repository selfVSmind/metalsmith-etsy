// every http request made in this module is a synchronous one
// async doesn't make sense in this use case
var request = require('sync-request');

module.exports = function (options) {
    
    // if my_etsy_api_key or my_etsy_shop_name is not supplied, we can't do anything!
    if(!options.hasOwnProperty('api_key') || !options.hasOwnProperty('etsy_shop') || !options.hasOwnProperty('listing_template')) return function(files, metalsmith, done) {    done();    };

    // these three variables must be supplied by user
    var my_etsy_api_key = options.api_key
    var my_etsy_shop_name = options.etsy_shop
    var listing_template = options.listing_template

    // setting this to false GREATLY speeds things up but most people will want the images
    // however I recommend setting as false during testing phases
    var get_images = true
    if(options.hasOwnProperty('get_images')) get_images = options.get_images

    // this value can range from 1 to 25 as per etsy's api requirements
    // there probably isn't a need to mess with this at all
    var default_results_per_page = 25
    var results_per_page = default_results_per_page
    if(options.hasOwnProperty('results_per_page')) {
        results_per_page = options.results_per_page
        if(results_per_page > 25 || results_per_page < 1) results_per_page = default_results_per_page
    }

    return function (files, metalsmith, done) {

        var jsonRes = JSON.parse(request('GET', 'https://openapi.etsy.com/v2/shops/' + my_etsy_shop_name + '/listings/active?limit=' + results_per_page + '&api_key='+my_etsy_api_key).getBody());

        var allActiveListings = []

        // iterate through all of the results pages
        var numPages = Math.ceil(jsonRes.count / results_per_page), currentPage = 1
        for(var i = currentPage; i < numPages; currentPage = ++i) {

        // loop through every active etsy listing in the shop
        jsonRes.results.forEach(function(listing) {
            
            // make up a name of a virtual markdown file named after the etsy listing id
            var workingFile = 'listings/' + listing.listing_id + '.md'
            
            // push that file to allActiveListings
            allActiveListings.push('listings/' + listing.listing_id + '.html')
            
            // OK this is the fun part!
            // We're creating a virtual markdown file that the other Metalsmith plugins can manipulate!!
            // When doing this sort of thing DO NOT FORGET the contents variable.. It is required by the Metalsmith environment
            // Also note that we're using a Handlebars template named listing that we will define next
            files[workingFile] = {title: listing.title, contents: listing.description, etsy_link: listing.url, template: listing_template}

            // set get_images to false during testing phases because etsy requires a new request for every single listing and this takes a very long time
            if(get_images) {
                // let's grab all of the images for the listing
                // etsy api requires that you do this in a seperate request
                var imgJsonRes = JSON.parse(request('GET', 'https://openapi.etsy.com/v2/listings/' + listing.listing_id + '/images?api_key='+my_etsy_api_key).getBody());
    
                // I'm choosing to make an array with a url to each image
                // We're going to pass this into the virtual markdown file as YAML data
                files[workingFile].listingImages = []
                imgJsonRes.results.forEach(function(result) {
                    files[workingFile].listingImages.push(result.url_fullxfull)
                })
            }

            // OK this last part is so we can reference our virtual files later from the site's root index.md
            // you can also use metalsmith-collections
            // I will probably remove this in a forthcoming update
            var indexContentString = ''
            allActiveListings.forEach(function(listingLink) {
                indexContentString += '<a href="' + listingLink + '">' + listingLink + '</a><br>'
            })
            files['index.md'].contents = indexContentString
            })

            // update the response data for the next page
            if(jsonRes.pagination.next_page !== "null") {
                jsonRes = JSON.parse(request('GET', 'https://openapi.etsy.com/v2/shops/' + my_etsy_shop_name + '/listings/active?limit=' + results_per_page + '&page=' + currentPage + '&api_key='+my_etsy_api_key).getBody());
            }
        }
        // done() signifies our re-entry into the daisychain we snuck into earlier
        done()
    }
}
