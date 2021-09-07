/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

import Route from '@ioc:Adonis/Core/Route';

// Home page
Route.get( '/', async ( { view } ) => view.render( 'home' ) );

// Redirect the request from the home page search bar
Route.get( '/prompt', ( { request, response } ) => response.redirect( '/' + request.input( 'v' ) ?? '' ) );

// Prompt for a video
Route.get( '/:id', 'CaptionsController.fetchVideo' );

// Youtube url in the url
Route.get( '/http:/*', 'CaptionsController.urlParse' );
Route.get( '/https:/*', 'CaptionsController.urlParse' );
Route.get( '/youtube.com/*', 'CaptionsController.urlParse' );
Route.get( '/www.youtube.com/*', 'CaptionsController.urlParse' );

// Prompt for a video + language // TODO
Route.get( '/:id/:lang', ( { response, params } ) => response.send( `GET\nvideo id: ${ params.id }\nlang:     ${ params.lang }` ) );
Route.post( '/:id/:lang', ( { request, response, params } ) => {
	console.log( 'BODY:' );
	console.log( request.body() );
	console.log( 'PARAMS:' );
	console.log( params );
	response.send( `POST\nvideo id: ${ params.id }\nlang:     ${ params.lang }` );
} );

// Unrecognized request
Route.get( '/*', ( { response } ) => response.status( 400 ).send( 'Invalid' ) );
