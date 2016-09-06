var getJSON = require('get-json')
var request = require('sync-request');

module.exports = function (options) {
    
    var my_etsy_api_key = options.api_key
    var my_etsy_shop_name = options.etsy_shop

    return function (files, metalsmith, done) {

        // you have to create a new etsy app here: 
        getJSON('https://openapi.etsy.com/v2/shops/' + my_etsy_shop_name + '/listings/active?limit=5&api_key='+my_etsy_api_key, function(error, response){
         
            if(error) console.log(error)

            else {
                
                var allActiveListings = []
                
                // loop through every active etsy listing in the shop
                response.results.forEach(function(listing) {
                    
                    // make up a name of a virtual markdown file named after the etsy listing id
                    var workingFile = 'listings/' + listing.listing_id + '.md'
                    
                    // push that file to allActiveListings
                    allActiveListings.push('listings/' + listing.listing_id + '.html')
                    
                    // OK this is the fun part!
                    // We're creating a virtual markdown file that the other Metalsmith plugins can manipulate!!
                    // When doing this sort of thing DO NOT FORGET the contents variable.. It is required by the Metalsmith environment
                    // Also note that we're using a Handlebars template named listing that we will define next
                    files[workingFile] = {title: listing.title, contents: listing.description, etsy_link: listing.url, template: 'listing.hbt'}

                    // let's grab all of the images for the listing
                    // etsy api requires that you do this in a seperate request
                    var res = request('GET', 'https://openapi.etsy.com/v2/listings/' + listing.listing_id + '/images?api_key='+my_etsy_api_key);

                    var jsonRes = JSON.parse(res.getBody())
                    
                    // I'm choosing to make an array with a url to each image
                    // We're going to pass this into the virtual markdown file as YAML data
                    files[workingFile].listingImages = []
                    jsonRes.results.forEach(function(result) {
                        files[workingFile].listingImages.push(result.url_fullxfull)
                    })

                    // OK this last part is so we can reference our virtual files later from the site's root index.md
                    var indexContentString = ''
                    allActiveListings.forEach(function(listingLink) {
                        indexContentString += '<a href="' + listingLink + '">' + listingLink + '</a><br>'
                    })
                    files['index.md'].contents = indexContentString
                })
            }
            
            // done() signifies our re-entry into the daisychain we snuck into earlier
            done()         
        })
    }
}