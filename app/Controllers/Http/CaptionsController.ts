import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { ViewRendererContract } from '@ioc:Adonis/Core/View';
import matchTextsIndices from 'App/Modules/matchTextsIndices';
import {
	fetchVideo as ytFetchVideo,
	fetchCaptions as ytFetchCaptions,
	FetchError,
	ytData,
} from 'App/Modules/youtubeFetch';

export default class CaptionsController {

	//HACK  test function — to be removed
	public async test( { response /*view*/ }: HttpContextContract ): Promise<void | string> {
		let res: string = 'testing';
		// ...
		response.status( 200 ).send( res );
		// return view.render( 'captions', data );
	}

	public async urlParse( { request, response, view }: HttpContextContract ): Promise<void | string> {
		// Verify it is a youtube url
		if ( ! request.url().match( /^\/(https?:\/\/)?(www.)?youtube.com\/watch$/i ) ) {
			return view.render( 'home', { error: 'Invalid video url' } );
		}
		// Redirect to its id
		return response.redirect( '/' + request.input( 'v' ) );
	}

	public async fetchVideo( { params, view }: HttpContextContract ): Promise<void | string> {
		try {
			const data: ytData = await ytFetchVideo( params.id );
			CaptionsController.mixCaptions( data );
			return view.render( 'video', data );
		} catch ( e ) {
			return CaptionsController.videoFetchError( e, view );
		}
	}

	public async fetchCaptions( { request, params, view }: HttpContextContract ): Promise<void | string> {
		let reqData = request.body();
		let urls: string[];
		if ( reqData.url ) {
			urls = reqData.url.split( '@' );
		} else {
			// Relevant data lacking (probably here from a GET), go fetch video data
			//    Language shorthand conversion
			let lang = params.lang;
			//IMPROVE  Track id shorthands should be defined in some file
			if ( lang === '0' ) lang = 'auto';
			else if ( lang === '00' ) lang = 'mix';
			//    Fetch the data
			let videoData: ytData;
			try {
				videoData = await ytFetchVideo( params.id );
			} catch ( e ) {
				return CaptionsController.videoFetchError( e, view );
			}
			//    Find the proper file(s) url
			urls = [];
			if ( lang === 'mix' ) {
				if ( videoData.captions.auto ) urls.push( videoData.captions.auto );
				lang = videoData.lang;
			}
			lang = CaptionsController.matchLanguageKeyIn( videoData.captions, lang );
			if ( lang ) urls.push( videoData.captions[ lang ] );
			if ( ! urls.length ) {
				CaptionsController.mixCaptions( videoData );
				return view.render( 'video', { error: 'The requested captions do not exist.', ...videoData } );
			}
			reqData = videoData;
		}
		// Fetch the captions
		let captions: [ String, String ][];
		if ( urls.length > 1 ) { // Two captions files to combine (time and text)
			const auto = await ytFetchCaptions( urls[ 0 ] ); // First track: automatic captions
			let text: [ string, string ][] | string = await ytFetchCaptions( urls[ 1 ] ); // Second track: manual captions
			text = text.map( ( x ) => x[ 1 ] ).join( '' ); // Keep just the text from manual captions
			let indices: number[] = []; // Build the indices of where timings apply in first track (automatic captions)
			let i = 0;
			for ( const x of auto ) {
				indices.push( i );
				i += x[ 1 ].length;
			}
			indices = matchTextsIndices(  // convert those indices to match the second track (manual captions)
				auto.map( ( x ) => x[ 1 ] ).join( '' ),
				text,
				indices
			);
			captions = [];
			i = 0;
			let t!: string;
			let s!: number;
			for ( ; i < indices.length; i++ ) {
				if ( indices[ i ] >= 0 ) {
					t = auto[ i ][ 0 ];
					s = indices[ i ];
					if ( s > 0 ) {
						captions.push( [
							auto[ 0 ][ 0 ].replace( /[0-9]/g, '0' ), // If not times, start put at 00:00.000
							text.substring( 0, s )
						] );
					}
					break;
				}
			}
			for ( ; i < indices.length; i++ ) {
				if ( indices[ i ] >= 0 ) {
					captions.push( [ t, text.substring( s, indices[ i ] ) ] );
					t = auto[ i ][ 0 ];
					s = indices[ i ];
				}
			}
			if ( t ) captions.push( [ t, text.substring( s, indices[ i ] ) ] );
		} else { // One single captions file
			captions = await ytFetchCaptions( urls[ 0 ] );
		}
		// Build page
		return view.render( 'captions', {
			title: reqData.title,
			channel: reqData.channel,
			date: reqData.date,
			id: reqData.id,
			text: captions,
		} );
	}

	/**
	 * In an object, find the value corresponding to a language keyword, knowing that for example 'en' might be here as 'en-US'.
	 * @param {Object.<string,string>} obj Object to explore
	 * @param {string} lang Language to look for
	 * @returns {string} Value (or empty string language not found)
	 */
	private static matchLanguageKeyIn( obj: {[key:string]:string}, lang: string ): string {
		if ( lang in obj ) return lang;
		lang += '-';
		for ( const key in obj ) {
			if ( key.startsWith( lang ) ) return key;
		}
		return '';
	}

	/**
	 * If there are both automatic and manual captions, check if combining is possible, then add that as a possibility
	 * @param {ytData} data Video data to modify if need be
	 */
	private static mixCaptions( data: ytData ) {
		if ( data.lang && data.captions.auto ) {
			const lang = CaptionsController.matchLanguageKeyIn( data.captions, data.lang );
			if ( lang ) {
				const auto = data.captions.auto;
				const manual = data.captions[ lang ];
				delete data.captions.auto;
				delete data.captions[ lang ];
				data.captions = {
					auto: auto,
					mix: auto + '@' + manual,
					[ lang ]: manual,
					...data.captions
				}
			}
		}
	}

	/**
	 * Handles an error at video level.
	 * @param {Error} error Error to handle
	 * @param {ViewRendererContract} view View object of the request
	 */
	private static videoFetchError( error: Error, view: ViewRendererContract ) {
		if ( error instanceof FetchError ) {
			return view.render( 'home', { error: error.message } );
		} else {
			return view.render( 'home', { error: 'Something went wrong.', errorDetails: '' + error } );
		}
	}
}


/*TODO  Save and Load capabilities
*/
/*TODO  Export button: Export to .srt
*/
/*IMPROVE  Settings: Toggle ms accuracy for paragraph time stamps.
*/
