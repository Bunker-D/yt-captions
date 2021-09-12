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
	if ( ! id.match( /^[a-zA-Z0-9\-_]{11}$/ ) ) throw new FetchError( 400, 'Invalid' );
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
		channel: video.channel,
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
export async function fetchCaptions( url: string, msResolution: boolean = true ): Promise<[ string, string ][]> {
	// Fetch the captions
	const resp = await fetch( url );
	if ( resp.status !== 200 ) {
		if ( resp.status === 404 ) throw new FetchError( 404, 'Captions file not found.' );
		throw 0;
	}
	const captions:string = await ( resp ).text();
	// Useful regex in reading the captions file
	const regTimeLine = /^(\d\d:\d\d:\d\d\.\d\d\d) --> \d\d:\d\d:\d\d\.\d\d\d/;
	const regTimedWord = /<(\d\d:\d\d:\d\d\.\d\d\d)><c>(.+?)<\/c>/g;
	// Read the words with their timings
	const text: [string, string][] = []; // List of [ timing, words ] to build
	let time!: string; // Last timing met
	let last!: string; // Last line met
	for ( let line of captions.split( '\n' ) ) {
		line = line.trim();
		if ( !line ) continue; // Skip empty lines
		const m = line.match( regTimeLine );
		if ( m ) { // It is a timing line
			time = m[ 1 ]; // Store showing time
			continue;
		}
		if ( time ) { // It is a text line (first timing met, so not a header)
			if ( line.endsWith( '</c>' ) ) { // It is a line with word-level timing
				const i = text.length; // Index for the first word (to be read later)
				text.push( [ '', '' ] ); // Make some room for the first word
				text[ i ] = [ time,
					' ' +
					line.replace( regTimedWord, ( _, t, w ) => { // Read each timed word, leaving the first wors
						if ( w ) text.push( [ t, w ] );
						return '';
					} ),
				]; // Store the remaining first word
				last = line.replace( regTimedWord, '$2' ); // Store what was just read
			} else if ( line !== last ) text.push( [ time, ' ' + line ] ); // It is a line without timing, which might be a double
		}
	}
	if ( ! text.length ) return []; // No text, stop there
	text[ 0 ][ 1 ] = text[ 0 ][ 1 ].substr( 1 ); // Remove the spaces added in front of the first line
	// Strip the timings from excessive front characters + move the spaces: always after words
	const zeroes = text[ text.length - 1 ][ 0 ].match( /^0*:?0?/ );
	const s = ( zeroes ) ? zeroes[ 0 ].length : 0;
	const n = ( msResolution ) ? undefined : 8 - s;
	let space = false;
	for ( let i = text.length - 1; i >= 0; i-- ) {
		text[ i ][ 0 ] = text[ i ][ 0 ].substr( s, n );
		if ( space ) text[ i ][ 1 ] += " ";
		space = text[ i ][ 1 ][ 0 ] === " ";
		if ( space ) text[ i ][ 1 ] = text[ i ][ 1 ].substr( 1 );
	}
	return text;
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
	channel: string,
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
function dateReformat( date: string ): string { //TODO make it a reformatting — if need be — in ytData creator
	if ( typeof date === 'string' && date.match( /^\d\d\d\d\d\d\d\d$/ ) ) {
		return (
			[ 'Jan. ', 'Feb. ', 'March ', 'Apr. ', 'May ', 'June ', 'July ', 'Aug. ', 'Sept. ', 'Oct. ', 'Nov. ', 'Dec. ' ][ Number( date.substr( 4, 2 ) ) - 1 ] +
			( Number( date.charAt( 6 ) ) || '' ) + date.charAt( 7 ) + ', ' +
			date.substr( 0, 4 )
		);
	}
	return '';
}
