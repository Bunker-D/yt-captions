/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

// import { Response } from '@adonisjs/http-server/build/standalone';
import Route from '@ioc:Adonis/Core/Route';

//HACK  test route — to be deleted
Route.get( '/test', 'CaptionsController.test' );

// Home page
Route.get( '/', async ( { view } ) => view.render( 'home' ) );

// Redirect the request from the home page search bar
Route.get( '/prompt', ( { request, response } ) => response.redirect( '/' + request.input( 'v' ) ?? '' ) );

// File creation
Route.post( '/convert/srt', 'CaptionsController.exportSrt' );
Route.post( '/convert/save', 'CaptionsController.exportSave' );

// Youtube url in the url
Route.get( '/http:/*', 'CaptionsController.urlParse' );
Route.get( '/https:/*', 'CaptionsController.urlParse' );
Route.get( '/youtube.com/*', 'CaptionsController.urlParse' );
Route.get( '/www.youtube.com/*', 'CaptionsController.urlParse' );

// Prompt for a video
Route.get( '/:id', 'CaptionsController.fetchVideo' );
// Route.post( '/:id', 'CaptionsController.fetchVideo' );

// Prompt for a video + language
Route.get( '/:id/:lang', 'CaptionsController.fetchCaptions' );
Route.post( '/:id/:lang', 'CaptionsController.fetchCaptions' );

// Unrecognized request
Route.get( '/*', ( { response } ) => response.status( 400 ).send( 'Invalid' ) );
