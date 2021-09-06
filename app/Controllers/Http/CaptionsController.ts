// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

// import youtubedl from 'youtube-dl-exec';

export default class CaptionsController {

	public async fetchVideo( { request, view } ) {
		let id = request.url();
		id = '[ ' + id + ' ]';
		return view.render( 'video', { id } );
	}

}
