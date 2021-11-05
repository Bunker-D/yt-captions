import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { RequestContract } from '@ioc:Adonis/Core/Request';
import { ViewRendererContract } from '@ioc:Adonis/Core/View';
import { schema, rules } from '@ioc:Adonis/Core/Validator';
import matchTextsIndices from 'App/Modules/matchTextsIndices';
import {
	fetchVideo as ytFetchVideo,
	fetchCaptions as ytFetchCaptions,
	readSubFile,
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

	/**
	 * PAGE REQUEST:  Handle requests using the full youtube url and redirect to the video id
	 */
	public async urlParse( { request, response, view }: HttpContextContract ): Promise<void | string> {
		// Verify it is a youtube url
		if ( ! request.url().match( /^\/(https?:\/\/)?(www.)?youtube.com\/watch$/i ) ) {
			return view.render( 'home', { error: 'Invalid video url' } );
		}
		// Redirect to its id
		return response.redirect( '/' + request.input( 'v' ) );
	}

	/**
	 * PAGE REQUEST:  Create the page for a given video
	 */
	public async fetchVideo( { params, view }: HttpContextContract ): Promise<void | string> {
		try {
			const data: ytData = await ytFetchVideo( params.id );
			CaptionsController.mixCaptions( data );
			return view.render( 'video', data );
		} catch ( e ) {
			return CaptionsController.videoFetchError( e, view );
		}
	}

	/**
	 * PAGE REQUEST:  Create the page for a given video and captions track
	 */
	public async fetchCaptions( { request, params, view, response }: HttpContextContract ): Promise<void | string> {
		let reqData = request.body();
		let urls: string[];
		if ( reqData.url ) {
			urls = reqData.url.split( '@' );
		} else {
			// Relevant data lacking (probably here from a GET), go fetch video data
			//    Language shorthand conversion
			let lang = params.lang;
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
			text: [ captions ],
		} );
	}

	/**
	 * PAGE REQUEST:  Create the page for a given video and captions track
	 */
	public async loadFile( { request, view }: HttpContextContract ): Promise<void | string> {
		let content: string = ( await request.validate( { schema: schema.create( { content: schema.string() } ) } ) ).content.trim();
		return view.render( 'captions', CaptionsController.readFile( content ) );
	}

	/**
	 * PAGE REQUEST:  Merge the text from a file with the content of a previous captions page
	 */
	public async mergeWithFile( { request, view }: HttpContextContract ): Promise<void | string> {
		//TODO mergeWithFile
		// Use CaptionsController.retextCaptions (might need modification for table depth / paragraphs)
		// 

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
	 * Read the encoded captions from a string, and the video informations if it is a .cpt file.
	 * @param {string} content String to decode
	 * @returns {CaptionsFileContent} Described content
	 */
	private static readFile( content: string ): CaptionsFileContent {
		// Read the .cpt file
		let match: RegExpMatchArray | null = content.match( /{(\/)*([\d:.]+)}/ );
		let video: { [ key: string ]: string } = {};
		let captions: [ string, string ][][] = [];
		if ( match && ( match.index === 0 || ( content[ 0 ] === '{' && content[ 2 ] === '}' ) ) ) {
			if ( match.index ) {
				const map = { T: 'title', A: 'channel', D: 'date', U: 'url', I: 'id' };
				const head = content.substr( 0, match.index );
				for ( const m of head.matchAll( /{([A-Z])}((?:[^{]|{\/)+)/g ) ) {
					if ( m[ 1 ] in map ) video[ map[ m[ 1 ] ] ] = m[ 2 ].replace( /{\//g, '{' );
				}
				content = content.substr( match.index );
			}
			let t: string = ''; // timing of the current timed bit (i.e. last timing met)
			let i: number = 0; // start index of the current timed bit
			let r: boolean = false; // some "{/…}" in the text of the bit to be replaced
			let paragraph: [ string, string ][] = [];
			const newPar = () => {
				if ( paragraph.length ) {
					captions.push( paragraph );
					paragraph = [];
				}
			}
			for ( const match of content.matchAll( /{(\/)*([\d:.]+)}/g ) ) {
				if ( match.index === undefined ) continue;
				if ( match[ 1 ] ) { // match is for "{/…}"
					r = true;
					continue;
				}
				if ( match.index > i ) {
					let w = content.substring( i, match.index );
					if ( r ) w = w.replace( /{\/(\/*[\d:.]+)}/g, ( _, w ) => '{' + w + '}' );
					paragraph.push( [ t, w ] );
				}
				if ( match[ 2 ] === ':' ) { // match for "{:}" (i.e. new paragraph)
					newPar();
				} else {
					t = match[ 2 ];
				}
				i = match.index + match[ 0 ].length;
				r = false;
			}
			if ( t && i < content.length ) {
				paragraph.push( [ t, content.substring( i ) ] );
			}
			newPar();
		} else {
			// If actually not a .cpt file, relegate the reading to another function
			captions = [ readSubFile( content ) ];
			// If not a supported subtitle file, treat the input file as a script / raw text
			if ( ! captions[ 0 ].length ) {
				captions = [];
				content = content.replace( '\r', '\n' );
				captions = content.split( '\n' ).map( ( w ) => [ [ '00:00:00.000', w ] ] );
			}
		}
		// Safety: Only keep tolerated
		for ( const par of captions ) {
			for ( const tw of par ) {
				tw[ 0 ].replace( /</g, '' );
				tw[ 1 ].replace( /&/g, '&amp;' ).replace( /<(?!\/?([iu]|br?)>)/gi, '&lt;' ); // # <font>
			}
		}
		return { text: captions, ...video }
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
	private static retextCaptions( captions: [ string, string ][], text: string ): [string,string][] {
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

	/**
	 * STRING REQUEST:  Handle the conversion into a srt file
	 * (See captionsFromRequest() for information about the request formatting.)
	 */
	public async exportSrt( { request, response }: HttpContextContract ): Promise<void> {
		const captions: [ string, string ][][] = await CaptionsController.captionsFromRequest( request );
		let k = captions[ 0 ][ 0 ][ 0 ].length;
		const prefix = '\n' + ( '00:00:00'.substr( 0, 12 - k ) );
		const commaIdx = k - 4;
		const toSec: ( s: string ) => number =
			( k === 12 ) ? ( ( s ) => Number( s.substr( 0, 2 ) ) * 3600 + Number( s.substr( 3, 2 ) ) * 60 + Number( s.substr( 6 ) ) )
				: ( k === 11 ) ? ( ( s ) => Number( s[ 0 ] ) * 3600 + Number( s.substr( 2, 2 ) ) * 60 + Number( s.substr( 5 ) ) )
				: ( k === 9 ) ? ( ( s ) => Number( s.substr( 0, 2 ) ) * 60 + Number( s.substr( 3 ) ) )
				: ( k === 8 ) ? ( ( s ) => Number( s[ 0 ] ) * 60 + Number( s.substr( 2 ) ) )
				: Number;
		const d2: ( n: number ) => string = ( n ) => ( n < 10 ) ? ( '0' + String( n ) ) : String( n );
		const toStr: ( t: number ) => string = ( t ) => {
			t *= 1000;
			let s = '';
			if ( t >= 3600000 ) { s = d2( Math.floor( t / 3600000 ) ) + ':'; t %= 3600000; } else { s = '00:'; }
			if ( t >= 60000) { s += d2( Math.floor( t / 60000 ) ) + ':'; t %= 60000; } else { s += '00:'; }
			if ( t >= 1000 ) { s += d2( Math.floor( t / 1000 ) ) + ','; t %= 1000; } else { s += '00,'; }
			return s + ( ( t < 100 ) ? ( ( t < 10 ) ? '00' : '0' ) + String( t ) : String( t ) );
		};
		const timeWords: ( w: string ) => number = ( w ) => {
			const m = w.normalize( 'NFD' ).replace( /['\u0300-\u036f]/g, '' ).match( /\w+/g );
			return ( m ) ? ( 0.7 * m.length + 0.3 ) : 0;
		}
		let srt = '';
		k = 1;
		let tStart = '', tStart_ = '', tEnd = 0, text = '';
		for ( const paragraph of captions ) {
			tStart_ = paragraph[ 0 ][ 0 ];
			if ( text ) {
				srt += ( k++ ) + prefix + tStart.substr( 0, commaIdx ) + ',' + tStart.substr( commaIdx + 1 ) + ' --> ' + ( ( toSec( tStart_ ) < tEnd ) ? tStart_ : toStr( tEnd ) ) + '\n' + text + '\n\n';
			}
			tStart = tStart_;
			tEnd = toSec( paragraph[ paragraph.length - 1 ][ 0 ] ) + timeWords( paragraph[ paragraph.length - 1 ][ 1 ] );
			text =
				paragraph.map( ( w ) => w[ 1 ] ).join( '' )
					.replace( /<br>/, '\n' )  // Replace line breaks
					.replace( /<(?!\/?[ibu]>)/g, '&lt;' )  // Replace all "<" by "&lt;" except for <i>, <b> and <u> tags
					.replace( /<\/(?<tag>[ibu])><\k<tag>>/g, '' );  // Merge successive <i>, <b> or <u> tags
			// # <font>
		}
		srt += ( k++ ) + prefix + tStart.substr( 0, commaIdx ) + ',' + tStart.substr( commaIdx + 1 ) + ' --> ' + toStr( tEnd ) + '\n' + text + '\n';
		return response.send( srt );
	}

	/**
	 * STRING REQUEST:  Create a save file
	 * (See captionsFromRequest() for information about the request formatting.)
	 */
	public async exportSave( { request, response }: HttpContextContract ): Promise<void> {
		const captions: [ string, string ][][] = await CaptionsController.captionsFromRequest( request );
		const video = await request.validate( {
			schema: schema.create( {
				title: schema.string.optional( { escape: true, trim: true } ),
				author: schema.string.optional( { escape: true, trim: true } ),
				date: schema.string.optional( { escape: true, trim: true } ),
				url: schema.string.optional( {}, [ rules.url() ] ),
			} )
		} );
		return response.send(
			( ( video.title ) ? ( '{T}' + video.title.replace( /{/g, '{/' ) ) : '' ) +
			( ( video.author ) ? ( '{A}' + video.author.replace( /{/g, '{/' ) ) : '' ) +
			( ( video.date ) ? ( '{D}' + video.date.replace( /{/g, '{/' ) ) : '' ) +
			( ( video.url ) ? ( '{U}' + video.url.replace( /{/g, '{/' ) ) : '' ) +
			captions.map( ( paragraph ) =>
				paragraph.map( ( [ t, w ] ) =>
					'{' + t + '}' + w.replace( /{(\/*[\d:.]+)}/g, ( _, w ) => '{/' + w + '}' )
				).join( '' )
			).join( '{:}' )
		);
	}

	/**
	 * Get the captions-describing table from a request.
	 * The request must have a captions field, in the format [ [ [time,text], [time,text], … ], … ].
	 * Each element of the main list correspond to a subtitle.
	 * Times are assumed to be of format `HH:MM:SS.mmm`, `H:MM:SS.mmm`, `MM:SS.mmm`, or `M:SS.mmm`.
	 * @param request Request to get the data from
	 * @returns Captions-describing table in the format [ [ [time,text], [time,text], … ], … ].
	 */
	private static async captionsFromRequest( request: RequestContract ): Promise<[string,string][][]> {
		return (
			( await request.validate( {
				schema: schema.create( { captions: schema.array().members( schema.array().members( schema.array( [ rules.minLength( 2 ) ] ).members( schema.string() ) ) ) } )
			} ) ).captions.map( ( p ) => p.map( ( b ) => [ b[ 0 ], b[ 1 ] ] ) )
		);
	}
}

interface CaptionsFileContent {
	text: [string,string][][],
	title?: string,
	channel?: string,
	date?: string,
	url?: string,
	id?: string,
}

/*IMPROVE Support <font …> tags
	→ Search for “# <font>” for relevant locations 
*/
/*IMPROVE  Settings: Toggle ms accuracy for paragraph time stamps.
*/
