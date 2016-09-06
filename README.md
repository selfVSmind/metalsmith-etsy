# metalsmith-etsy
A small plugin for Metalsmith to incorporate your Etsy store into your static website.

## Installation
    $ npm install --save metalsmith-etsy

## Example Build File
```js
var Metalsmith = require('metalsmith'),
    markdown = require('metalsmith-markdown'),
    templates = require('metalsmith-templates'),
    collections = require('metalsmith-collections'),
    permalinks = require('metalsmith-permalinks'),
    etsy = require('metalsmith-etsy');

Metalsmith(__dirname)
    .use(etsy({
        api_key: <your_etsy_api_key>,
        etsy_shop  : 'StickToThePlannerCOM'
    }))
    .use(collections({
        pages: {
            pattern: 'content/pages/*.md'
        },
        articles: {
            pattern: 'content/articles/*.md',
            sortBy: 'date'
        },
        listings: {
            pattern: 'listings/*.md'
        }
    }))
    .use(markdown())
    .use(permalinks({
        pattern: ':collections/:title'
    }))
    .use(templates({
        engine: 'handlebars',
        partials: {
            header: 'partials/header',
            footer: 'partials/footer'
        }
    }))
    .destination('./build')
    .build(function (err) { if(err) console.log(err) })
```

## Better Documentation Coming
For now read about this [on my blog][http://jasonlambert.io/articles/metalsmith-etsy/]