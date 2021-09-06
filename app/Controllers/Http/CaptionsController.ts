import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

// import youtubedl from 'youtube-dl-exec';

export default class CaptionsController {

	public async urlParse( { request, response }: HttpContextContract ): Promise<void> {
		// Verify it is a youtube url
		if ( ! request.url().match( /^\/(https?:\/\/)?(www.)?youtube.com\/watch$/i ) ) {
			return response.status( 400 ).send( 'Invalid' );
		}
		// Redirect to its id
		response.redirect( '/' + request.input( 'v' ) );
	}

	public async fetchVideo( { params, view, response }: HttpContextContract ): Promise<void|string> {
		if ( ! params.id.match( /^[a-zA-Z0-9\-_]{11}$/ ) ) {
			return response.status( 400 ).send( 'Invalid' );
		}
		return view.render( 'video', { id: params.id } );
	}

}
