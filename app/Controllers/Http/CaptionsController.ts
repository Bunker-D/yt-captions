// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

// import youtubedl from 'youtube-dl-exec';

export default class CaptionsController {

	public async fetchVideo( { request, params, view } ) {
		console.log( '--' );
		console.log( request.url() );
		console.log( request.all() );
		console.log( request.input( 'v' ) );
		console.log( request.input( 'foo' ) );
		console.log( params );
		return view.render( 'video', { id: params.id } );
	}

}
