import { ResponseContract } from '@ioc:Adonis/Core/Response';
import { default as youtubedl, YtResponse } from 'youtube-dl-exec';
import { default as fetch } from 'node-fetch';

/**
 * Fetch the useful video data from Youtube.
 * @param {string} id ID of the target video
 * @returns {Promise<ytData>} Object containing useful data
 * @async
 */
export async function fetchVideo( id: string ): Promise<ytData> {
	// Check the validity of the id format
	if ( ! id.match( /^[a-zA-Z0-9\-_]{11}$/ ) ) throw new FetchError( 400, 'Invalid video id' );
	// Fetch the data from Youtube
	const url: string = 'https://www.youtube.com/watch?v=' + id;
	let video: YtResponseExtended;
	try {
		video = await youtubedl( url, {
			dumpSingleJson: true,
			noWarnings: true,
			noCallHome: true,
			noCheckCertificate: true,
			preferFreeFormats: true,
			youtubeSkipDashManifest: true,
			skipDownload: true,
			referer: url,
		} );
	} catch ( e ) {
		if ( e.stderr === 'ERROR: Video unavailable' ) throw new FetchError( 404, 'Video not found' );
		// This check mught by itself raise another error that will be handled anyway.
		throw '?';
		// Possible source of error:  MSVCR100.dll missing
		// Requires Microsoft Visual C++ 2010 Service Pack 1 Redistributable 32 bits (x86)
	}
	// Read the relevant data
	const data: ytData = {
		id: id,
		title: video.title,
		author: video.channel,
		date: dateReformat( video.upload_date ),
		captions: {},
	};
	// In the automatic captions if any, find a valid url and the language
	let urls = video.automatic_captions ?? {}; // List of automatic caption. Find the url for 'vtt' in the first one.
	for ( const lang in urls ) {
		for ( const { ext, url } of urls[ lang ] ) {
			if ( ext === 'vtt' ) {
				// Remove the 'tlang' field from the url to get to default (original) language
				// Read 'lang' field to identify the original language
				if ( ! data.captions.auto ) data.captions.auto = url.replace( /(?<=[?&])tlang=[^&]+(&|$)/, '' );
				const m = url.match( /(?<=[?&]lang=)[^&]+(?=&|$)/ );
				if ( m ) data.lang = m[ 0 ];
				break;
			}
		}
		if ( data.lang ) break;
	}
	// List the manual captions if any
	urls = video.subtitles ?? {};
	for ( const lang in urls ) {
		for ( const { ext, url } of urls[ lang ] ) {
			if ( ext === 'vtt' ) {
				data.captions[ lang ] = url;
				break;
			}
		}
	}
	return data;
}

/**
 * Fetch the vtt subtitles at a given URL, as an array of timings and texts.
 * @param {string} url URL for the subtitles
 * @param {boolean} [msResolution=false] Whether the timings are accurate to the milisecond (false (default)) or to the second (true)
 * @returns {[string,string][]} List of timed texts, as a list of [*time*, *text*] (where *time* is in text format).
 * @async
 */
export async function fetchCaptions( url: string ): Promise<[ string, string ][]> {
	// Fetch the captions
	const resp = await fetch( url );
	if ( resp.status !== 200 ) {
		if ( resp.status === 404 ) throw new FetchError( 404, 'Captions file not found.' );
		throw 0;
	}
	// Read the captions
	return readSubFile( await resp.text(), 'vtt' );
}

/**
 * Class FetchError is used to handle errors in shared fetching functions.
 * Its static raise function also defines the default behavior for unrecognized issues.
 */
export class FetchError {
	status: number;
	message: string;
	constructor( status: number, message?: string ) {
		this.status = status;
		this.message = message ?? '';
	}
	public static raise( response: ResponseContract, error?: unknown ) {
		if ( error instanceof FetchError ) {
			return response.status( error.status ).send( error.message );
		}
		return response.status( 500 ).send( 'Something went wrong' );
	}
}

/**
 * Interface for the video data kept used by the captions collection tool
 */
export interface ytData {
	id: string,
	title: string,
	author: string,
	date: string,
	captions: { [ key: string ]: string },
	lang?: string,
}

/**
 * Completing YtResponse interface (Current version lacks the caption-related fields)
 */
interface YtResponseExtended extends YtResponse {
	// eslint-disable-next-line camelcase
	automatic_captions?: { [ key: string ]: { ext: string, url: string; }[] },
	subtitles?: { [ key: string ]: { ext: string, url: string; }[] },
}

/**
 * Convert a date in "yyyymmdd" format to a standard "Mon. dd, yyyy" (e.g. "Feb. 8, 2018")
 * @param {string} date Date to convert, in "yyyymmdd" format
 * @returns {string} Date in human format (or empty string if the input parameter doesn't match the expected format)
 */
function dateReformat( date: string ): string {
	if ( typeof date === 'string' && date.match( /^\d\d\d\d\d\d\d\d$/ ) ) {
		return (
			[ 'Jan. ', 'Feb. ', 'March ', 'Apr. ', 'May ', 'June ', 'July ', 'Aug. ', 'Sept. ', 'Oct. ', 'Nov. ', 'Dec. ' ][ Number( date.substring( 4, 6 ) ) - 1 ] +
			( Number( date.charAt( 6 ) ) || '' ) + date.charAt( 7 ) + ', ' +
			date.substring( 0, 4 )
		);
	}
	return '';
}

/**
 * Read a srt or vtt file.
 * @param {string} content Content of the file
 * @param {string} [type] Type or file, i.e. 'vtt' or 'srt'. If not provided: automatically detected.
 * @returns {[string,string][]} Content of the file as a list of [ time, words ]. [] if the input is not a recognized format.
 */
//IMPROVE readSubFile: Support more formats
export function readSubFile( content: string, type?: string ): [ string, string ][] {
	if ( ! content.match( /(^|\n)(\d\d:\d\d:\d\d[.,]\d\d\d) --> \d\d:\d\d:\d\d[.,]\d\d\d/ ) ) return [];
	// Pre-treatment
	content = content.replace( /\n\r|\r\n|\r/g, '\n' );
	if ( type !== 'vtt' ) { // If not sure it's a vtt file…
		content = '\n' + content;
		content =
			content
				.replace( /(?<=\d\d:\d\d:\d\d),(?=\d\d\d)/g, '.' ) // replace commas in timing with dots…
				.replace( /\n\d+(?=\n\d\d:\d\d:\d\d\.\d\d\d --> \d\d:\d\d:\d\d\.\d\d\d)/g, '' ); // and remove the potential subtitle index preceding timing lines in srt files.
	}
	// Useful regex in reading the captions file
	const regTimeLine = /^(\d\d:\d\d:\d\d\.\d\d\d) --> \d\d:\d\d:\d\d\.\d\d\d/;
	const regTimedWord = /<(\d\d:\d\d:\d\d\.\d\d\d)><c>(.+?)<\/c>/g;
	// Read the words with their timings
	const captions: [string, string][] = []; // List of [ timing, words ] to build
	let time!: string; // Last timing met
	let last!: string; // Last line met
	for ( let line of content.split( '\n' ) ) {
		line = line.trim();
		if ( !line ) continue; // Skip empty lines
		const m = line.match( regTimeLine );
		if ( m ) { // It is a timing line
			time = m[ 1 ]; // Store showing time
			continue;
		}
		if ( time ) { // It is a text line (first timing met, so not a header)
			if ( line.endsWith( '</c>' ) ) { // It is a line with word-level timing
				const i = captions.length; // Index for the first word (to be read later)
				captions.push( [ '', '' ] ); // Make some room for the first word
				captions[ i ] = [ time,
					' ' +
					line.replace( regTimedWord, ( _, t, w ) => { // Read each timed word, leaving the first words
						if ( w ) captions.push( [ t, w ] );
						return '';
					} ),
				]; // Store the remaining first word
				last = line.replace( regTimedWord, '$2' ); // Store what was just read
			} else if ( line !== last ) { // A line without timing might be a double.
				captions.push( [ time, ' ' + line ] ); // If not, add it…
				last = line; // and remember.
			}
		}
	}
	if ( ! captions.length ) return []; // No text, stop there
	captions[ 0 ][ 1 ] = captions[ 0 ][ 1 ].substring( 1 ); // Remove the spaces added in front of the first line
	// Strip the timings from excessive front characters + move the spaces (always after words)
	const zeroes = captions[ captions.length - 1 ][ 0 ].match( /^0*:?0?/ );
	const s = ( zeroes ) ? zeroes[ 0 ].length : 0;
	let space = false;
	for ( let i = captions.length; i--; ) {
		captions[ i ][ 0 ] = captions[ i ][ 0 ].substring( s );
		if ( space ) captions[ i ][ 1 ] += " ";
		space = captions[ i ][ 1 ][ 0 ] === " ";
		if ( space ) captions[ i ][ 1 ] = captions[ i ][ 1 ].substring( 1 );
	}
	return clearHtml( captions, [ 'i', 'b', 'u' ], { em: 'i', strong: 'b', br: null, font: null } ); // # <font>
}

/**
 * Decode &...; and &#...; HTML special characters by their value, except for “&” and “<” if not explicitly asked for.
 * Convert “<” to “&lt;”, except for user-defined HTML tags.
 * @param {string|[string,string][]} str String or timed captions in which characters should be decoded.
 * @param {string[]} keepTags HTML tags (lower case) to be kept as such.
 * @param {[index:string]:string|null} convertTags HTML tags (lower case) to be converted (as keys) and new names to give them (as values). If the provided value is `null`, the tag will be removed.
 * @param {boolean} convertLt If set to true and if keepTags and convertTags are unused, even “&amp;” and “&lt;” are converted into “&” and “<”.
 * @returns {string} String with decoded characters
 */
export function clearHtml(
	str: string,
	keepTags?: string[],
	convertTags?: { [ index: string ]: string | null; },
	convertLt?: boolean,
): string;
export function clearHtml(
	str: [string,string][],
	keepTags?: string[],
	convertTags?: { [ index: string ]: string | null; },
	convertLt?: boolean,
): [string,string][];
export function clearHtml(
	str: string | [string,string][],
	keepTags?: string[],
	convertTags?: { [ index: string ]: string|null },
	convertLt?: boolean,
): string | [string,string][] {
	const tagMap = convertTags ?? {};
	if ( keepTags ) {
		for ( const tag of keepTags ) tagMap[ tag ] = tag;
	}
	let amp: string = '&amp;';
	let lt: string = '&lt;';
	let clearLT!: ( s: string ) => string;
	if ( Object.keys( tagMap ).length ) {
		clearLT = ( s: string ): string =>
			s.replace( /<((\/?)([a-z0-9]+)((?: +[a-z0-9]+(?:=(?:"[^"]*"|'[^']*'|\w*))?)* *\/?>))?/gi,
				( _: string, lookup: string, slash: string, tag: string, tail: string ): string => {
					if ( ! lookup ) return '&lt;'
					const ltag = tag.toLowerCase();
					if ( ltag in tagMap ) {
						if ( tagMap[ ltag ] == null ) return '';
						return '<' + slash + tagMap[ ltag ] + ( ( tail.trimStart() === '>' ) ? '>' : tail );
					}
					return '&lt;' + lookup;
				}
			);
	} else {
		if ( convertLt ) {
			amp = '&';
			lt = '<';
		} else {
			clearLT = ( s: string ): string => s.replace( /</g, '&lt;' );
		}
	}
	const clearAmp = ( s: string ): string =>
		s.replace( /&([a-z0-9]+|#([0-9]+));/gi, ( x, m, n ) => {
			// &#...;
			if ( n ) return String.fromCharCode( Number( n ) );
			n = m.toLowerCase();
			// Most expected characters
			let c = { nbsp: ' ', quot: '"', apos: "'", amp: amp, lt: lt, gt: '>' }[ n ];
			if ( c ) return c;
			// Other case-insentive characters
			c = {
				laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', sbquo: '‚', bdquo: '„', lsaquo: '‹', rsaquo: '›',
				iexcl: '¡', cent: '¢', pound: '£', curren: '¤', yen: '¥', brvbar: '¦', sect: '§', uml: '¨', copy: '©', ordf: 'ª',
				not: '¬', shy: '­', reg: '®', macr: '¯', deg: '°', plusmn: '±', sup2: '²', sup3: '³', acute: '´', micro: 'µ', para: '¶',
				middot: '·', cedil: '¸', sup1: '¹', ordm: 'º', frac14: '¼', frac12: '½', frac34: '¾', iquest: '¿', times: '×', szlig: 'ß',
				divide: '÷', yuml: 'ÿ', bull: '•', infin: '∞', permil: '‰', sdot: '⋅', dagger: '†', mdash: '—', perp: '⊥', par: '∥', euro: '€'
			}[ n ];
			if ( c ) return c;
			// Characters with lower and upper case versions
			c = {
				agrave: 'Àà', aacute: 'Áá', acirc: 'Ââ', atilde: 'Ãã', auml: 'Ää', aring: 'Åå', aelig: 'Ææ', ccedil: 'Çç',
				egrave: 'Èè', eacute: 'Éé', ecirc: 'Êê', euml: 'Ëë', igrave: 'Ìì', iacute: 'Íí', icirc: 'Îî', iuml: 'Ïï',
				eth: 'Ðð', ntilde: 'Ññ', ograve: 'Òò', oacute: 'Óó', ocirc: 'Ôô', otilde: 'Õõ', ouml: 'Öö', oslash: 'Øø',
				ugrave: 'Ùù', uacute: 'Úú', ucirc: 'Ûû', uuml: 'Üü', yacute: 'Ýý', thorn: 'Þþ',
				alpha: 'Αα', beta: 'Ββ', gamma: 'Γγ', delta: 'Δδ', epsilon: 'Εε', zeta: 'Ζζ', eta: 'Ηη', theta: 'Θθ',
				iota: 'Ιι', kappa: 'Κκ', lambda: 'Λλ', mu: 'Μμ', nu: 'Νν', xi: 'Ξξ', omicron: 'Οο', pi: 'Ππ', rho: 'Ρρ',
				sigma: 'Σσ', tau: 'Ττ', upsilon: 'Υυ', phi: 'Φφ', chi: 'Χχ', psi: 'Ψψ', omega: 'Ωω'
			}[ n ];
			if ( c ) return c[ ( m.charCodeAt( 0 ) < 95 ) ? 0 : 1 ];
			return x;
		} );
	const clear: ( s: string ) => string = ( clearLT ) ? ( s => clearAmp( clearLT( s ) ) ) : clearAmp;
	return ( typeof str === 'string' ) ? clear( str ) : str.map( ( [ t, w ] ) => [ t, clear( w ) ] );
}
