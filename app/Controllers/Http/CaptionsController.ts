import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
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

	public async urlParse( { request, response }: HttpContextContract ): Promise<void> {
		// Verify it is a youtube url
		if ( ! request.url().match( /^\/(https?:\/\/)?(www.)?youtube.com\/watch$/i ) ) {
			return response.status( 400 ).send( 'Invalid' );
		}
		// Redirect to its id
		response.redirect( '/' + request.input( 'v' ) );
	}

	public async fetchVideo( { params, view, response }: HttpContextContract ): Promise<void | string> {
		try {
			// Fetch the video data
			const data: ytData = await ytFetchVideo( params.id );
			// If there are both automatic and manual captions, check if combining is possible, then add that as a possibility
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
			// Create the page
			return view.render( 'video', data );
		} catch ( e ) {
			return FetchError.raise( response, e );
		}
	}

	public async fetchCaptions( { request, params, view, response }: HttpContextContract ): Promise<void | string> {
		let reqData = request.body();
		let url: string = reqData.url;
		if ( ! url ) {
			// Relevant data lacking (probably here from a GET), go fetch video data
			let lang = params.lang;
			//TODO Track id shorthands should be defined in some file
			if ( lang === '0' ) lang = 'auto';
			else if ( lang === '00' ) lang = 'mix';
			try {
				reqData = await ytFetchVideo( params.id );
			} catch ( e ) {
				return FetchError.raise( response, e );
			}
			url = CaptionsController.matchLanguageKeyIn( reqData.captions, lang );
			//TODO  Proper handling of mix (ytFetchVideo doesn't create mix info itself!)
			if ( url ) {
				url = reqData.captions[ url ];
			} else {
				if ( ( lang === 'mix' ) && ('auto' in reqData.captions ) ) { // If mix requested, default to auto if any
					url = reqData.captions.auto;
				} else {
					return response.status( 404 ).send( 'The requested captions do not exist.' );
				}
				//TODO  Error: → video page with error message, providing reqData (→ use POST)
			}
		}
		// Fetch the captions
		const urls: string[] = url.split( '@' );
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
			captions = await ytFetchCaptions( url );
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
}


/*TODO  Save and Load capabilities
*/
/*TODO  Export button: Export to .srt
*/
/*IMPROVE  Settings: Toggle ms accuracy for paragraph time stamps.
*/
