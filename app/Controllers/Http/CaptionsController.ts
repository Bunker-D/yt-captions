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

	public async fetchCaptions( { request, params, view, response }: HttpContextContract ): Promise<void | string> {
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
		try {
			captions =
			   ( urls.length > 1 ) ? // Two captions files to combine (time and text)
				   CaptionsController.retextCaptions(
					   await ytFetchCaptions( urls[ 0 ] ),
					   ( await ytFetchCaptions( urls[ 1 ] ) ).map( ( x ) => x[ 1 ] ).join( '' )
				   )
			   : // One single captions file
				   await ytFetchCaptions( urls[ 0 ] );
		} catch ( e ) {
			return response.redirect( request.url() );
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
	 * Produce captions based on original (timed) captions and a proper text.
	 * @param captions Captions providing the basis for timings
	 * @param text Text of the captions to create
	 * @returns {[string,string][]} Created captions
	 */
	private static retextCaptions( captions: [ string, string ][], text: string ) {
		// Build the indices of where timings apply in original captions
		let indices: number[] = [];
		let i = 0;
		for ( const x of captions ) {
			indices.push( i );
			i += x[ 1 ].length;
		}
		// Convert those indices to match the provided text
		indices = matchTextsIndices(
			captions.map( ( x ) => x[ 1 ] ).join( '' ),
			text,
			indices
		);
		// Build the target captions
		const result: [ string, string ][] = [];
		let t!: string;
		let s!: number;
		i = 0;
		for ( ; i < indices.length; i++ ) { // Get the first block
			if ( indices[ i ] >= 0 ) {
				t = captions[ i ][ 0 ];
				s = indices[ i ];
				if ( s > 0 ) {
					result.push( [
						captions[ 0 ][ 0 ].replace( /\d/g, '0' ), // If not timed, start put at 00:00.000
						text.substring( 0, s )
					] );
				}
				break;
			}
		}
		for ( ; i < indices.length; i++ ) { // Continue
			if ( indices[ i ] >= 0 ) {
				result.push( [ t, text.substring( s, indices[ i ] ) ] );
				t = captions[ i ][ 0 ];
				s = indices[ i ];
			}
		}
		if ( t ) result.push( [ t, text.substring( s, indices[ i ] ) ] );
		// Move opening quotes, parenthesis, etc within the following block
		const reg = /([\(\[\{‘“«‚„<¿¡]|(--+|[–—])|(?<=\ )[-'"])\ *$/;
		let m: RegExpMatchArray | null;
		let opened = false;
		let str = '';
		for ( let i = 0; i < result.length; i++ ) {
			str = result[ i ][ 1 ];
			if ( opened && ( str.indexOf( '.' ) >= 0 || str.indexOf( '?' ) >= 0 || str.indexOf( '!' ) >= 0 ) ) {
				opened = false;
			}
			while ( true ) {
				m = str.match( reg );
				if ( ! m ) break;
				if ( m[ 2 ] ) {
					if ( opened ) {
						opened = false;
						break;
					} else {
						opened = true;
					}
				}
				result[ i + 1 ][ 1 ] = m[ 0 ] + result[ i + 1 ][ 1 ];
				str = str.substr( 0, str.length - m[ 0 ].length );
				result[ i ][ 1 ] = str;
			}
		}
		// Return the result
		return result;
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

/*BUG Unwanted spaces when syncing
	Example: C4WbCwF6yh0
	→ Spaces inserted after “"”
	→ Space inserted at the end after the M of “[Musique]”
	→ “%” → “% d d”
*/
