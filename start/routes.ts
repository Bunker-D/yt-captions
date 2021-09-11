/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

// import { Response } from '@adonisjs/http-server/build/standalone';
import Route from '@ioc:Adonis/Core/Route';

//TODO TEST RETLATED
import matchTest from 'App/Modules/matchStr';
Route.get( '/match', ( { response } ) => response.status( 200 ).send( matchTest() ) );
Route.get( '/test', 'CaptionsController.test' );

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
Route.get( '/:id/:lang', 'CaptionsController.fetchCaptions' );
Route.post( '/:id/:lang', 'CaptionsController.fetchCaptions' );

// Unrecognized request
Route.get( '/*', ( { response } ) => response.status( 400 ).send( 'Invalid' ) );
