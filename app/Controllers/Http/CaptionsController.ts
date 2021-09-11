import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { ResponseContract } from '@ioc:Adonis/Core/Response';
import { default as youtubedl, YtResponse } from 'youtube-dl-exec';
import { default as fetch } from 'node-fetch';
// import matchTest from 'App/Modules/matchTextsIndices';

export default class CaptionsController {

	//TODO  TEST - TO BE REMOVED
	public async test( { view }: HttpContextContract ): Promise<string> {
		const text = "00:00.000~ I|00:00.030~ have|00:00.510~ suspicions|00:01.260~ that|00:01.589~ some|00:02.220~ of|00:02.310~ the|00:02.399~ claims|00:02.669~ I|00:02.850~ make|00:03.090~ in|00:03.300~ always|00:03.510~ a|00:03.689~ bigger|00:03.959~ fish|00:04.230~ that|00:04.890~ conservatism|00:05.670~ isn't|00:06.180~ at|00:06.330~ its|00:06.480~ core|00:06.750~ about|00:07.080~ fiscal|00:07.649~ responsibility|00:08.120~ limited|00:09.120~ government|00:09.570~ or|00:09.809~ the|00:10.019~ rights|00:10.170~ of|00:10.320~ the|00:10.410~ individual|00:10.920~ but|00:11.340~ is|00:11.429~ about|00:11.670~ maintaining|00:12.210~ social|00:12.660~ hierarchies|00:13.620~ that|00:14.040~ it|00:14.190~ believes|00:14.580~ people|00:15.000~ are|00:15.389~ fundamentally|00:16.139~ unequal|00:16.770~ and|00:16.980~ likes|00:17.400~ the|00:17.520~ free|00:17.789~ market|00:18.150~ because|00:18.300~ it|00:18.600~ sorts|00:18.900~ people|00:19.199~ according|00:19.500~ to|00:19.680~ their|00:19.920~ Worth|00:20.130~ and|00:20.400~ even|00:20.939~ softly|00:21.300~ implies|00:21.600~ capitalism|00:22.289~ itself|00:22.590~ maybe|00:22.920~ innately|00:23.640~ anti-democratic|00:24.600~ might|00:26.510~ raise|00:27.510~ some|00:27.960~ eyebrows|00:28.349~ so|00:29.189~ I'm|00:29.340~ gonna|00:29.550~ show|00:29.880~ my|00:30.119~ work|00:30.359~ on|00:30.570~ this|00:30.720~ one|00:31.140~ two|00:31.650~ of|00:31.830~ the|00:31.949~ architects|00:32.489~ of|00:32.640~ conservative|00:33.210~ thought|00:33.420~ were|00:33.660~ Edmund|00:34.079~ Burke|00:34.320~ and|00:34.590~ Joseph|00:35.070~ de|00:35.190~ Maistre|00:35.219~ who|00:36.000~ formulated|00:36.600~ much|00:36.870~ of|00:37.020~ their|00:37.140~ political|00:37.410~ theory|00:38.040~ while|00:38.219~ writing|00:38.640~ about|00:38.820~ the|00:39.000~ French|00:39.239~ Revolution|00:39.350~ they|00:40.350~ in|00:40.680~ turn|00:40.950~ were|00:41.129~ influenced|00:41.700~ by|00:41.790~ earlier|00:42.180~ writings|00:42.450~ from|00:42.809~ Thomas|00:43.320~ Hobbes|00:43.559~ on|00:43.920~ the|00:44.040~ English|00:44.340~ Civil|00:44.520~ War|00:44.820~ and|00:45.090~ what|00:45.570~ all|00:45.690~ three|00:45.870~ of|00:46.050~ these|00:46.140~ men|00:46.350~ were|00:46.500~ doing|00:46.710~ in|00:47.219~ writing|00:47.760~ about|00:47.910~ these|00:48.270~ wars|00:48.660~ was|00:49.469~ defending|00:50.219~ the|00:50.430~ monarchy|00:51.059~ the|00:51.660~ sentiment|00:52.199~ that|00:52.260~ the|00:52.559~ masses|00:52.980~ should|00:53.010~ be|00:53.399~ powerless|00:54.000~ in|00:54.210~ the|00:54.300~ face|00:54.329~ of|00:54.539~ nobility|00:54.989~ was|00:55.500~ being|00:56.660~ challenged|00:57.660~ and|00:57.870~ while|00:58.530~ these|00:58.680~ men|00:58.920~ thought|00:59.160~ the|00:59.340~ revolutionaries|01:00.030~ themselves|01:00.570~ were|01:00.719~ actually|01:01.050~ quite|01:01.649~ compelling|01:02.070~ the|01:02.609~ democracy|01:03.239~ they|01:03.420~ were|01:03.480~ fighting|01:03.899~ for|01:04.110~ Hobbes|01:04.860~ Burke|01:05.220~ into|01:05.519~ maestra|01:06.000~ found|01:06.979~ repulsive|01:07.979~ come|01:08.880~ the|01:09.030~ end|01:09.150~ of|01:09.270~ the|01:09.360~ Revolution|01:09.930~ when|01:10.080~ it|01:10.200~ seemed|01:10.439~ democracy|01:11.189~ might|01:11.430~ actually";
		const data = {
			title: 'Title of the video, something great.',
			channel: 'Some Youtuber',
			date: 'Jan. 6, 2012',
			id: 'g32xAWxkabw',
			text: text.split( '|' ).map( ( t ) => t.split( '~' ) ),
		};
		return view.render( 'captions', data );
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
		//TODO Should also offer the possibility to merge auto timing and manual subtitles when possible
		try {
			const data = await _fetchVideo( params.id );
			return view.render( 'video', data );
		} catch ( e ) {
			return FetchError.raise( response, e );
		}
	}

	public async fetchCaptions( { request, params, view, response }: HttpContextContract ): Promise<void | string> {
		const body = request.body();
		if ( !body.captions ) {
			/*TODO  url lacking
				→ Should fetch video data to try to find the proper url.
				→ If track doesn't exist, redirect to /params.id, with post to not repeat the data fetch.
			*/
			return response.status( 400 ).send( 'TO BE DONE:  here without captions file url' ); //TODO not that
		}
		// Identify the proper url (urls provided as "<lang>@<url>|<lang>@<url>|<lang>@<url>|…")
		let url: string = params.lang;
		if ( url === "0" ) url = "auto";
		try {
			url = (
				body.captions.match( new RegExp( `(?<=(^|\\|)${ url }@)(.*?)(?=(\\||$))` ) ) || // e.g. looked for "en", found "en"
				body.captions.match( new RegExp( `(?<=(^|\\|)${ url }\\-[^@]*@)(.*?)(?=(\\||$))` ) ) // e.g. looked for "en", found "en-UK"
			)[ 0 ];
		} catch ( e ) {
			return response.status( 404 ).send( 'The requested captions do not exist.' );
			//TODO  Should redirect to video page with error message.
		}
		// Fetch the captions
		const captions = await _fetchCaptions( url );
		// Build page
		return view.render( 'captions', {
			title: body.title,
			channel: body.channel,
			date: body.date,
			id: body.id,
			text: captions,
		} );
	}

}

/**
 * Fetch the useful video data from Youtube.
 * @param {string} id ID of the target video
 * @returns {Promise<ytData>} Object containing useful data
 * @async
 */
async function _fetchVideo( id: string ): Promise<ytData> {
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
 * @returns {[string,string][]} List of timed texts, as a list of [<time>, <text>] (where <time> is in text format).
 * @async
 */
async function _fetchCaptions( url: string, msResolution: boolean = true ): Promise<[string, string][]> {
	// Fetch the captions
	const resp = await fetch( url );
	//TODO resp.status = 404 when not found
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
		if ( time ) { // It is a text line
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
			} else if ( line !== last ) text.push( [ time, line ] ); // It is a line without timing, which might be a double
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
class FetchError {
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
 * Completing YtResponse interface (Current version lacks the caption-related fields)
 */
interface YtResponseExtended extends YtResponse {
	// eslint-disable-next-line camelcase
	automatic_captions?: { [ key: string ]: { ext: string, url: string; }[] },
	subtitles?: { [ key: string ]: { ext: string, url: string; }[] },
}

/**
 * Interface for the video data kept used by the captions collection tool
 */
interface ytData {
	id: string,
	title: string,
	channel: string,
	date: string,
	captions: { [ key: string ]: string; },
	lang?: string,
}

/**
 * Convert a date in "yyyymmdd" format to a standard "Mon. dd, yyyy" (e.g. "Feb. 8, 2018")
 * @param {string} date Date to convert, in "yyyymmdd" format
 * @returns {string} Date in human format (or empty string if the input parameter doesn't match the expected format)
 */
function dateReformat( date: string ): string {
	if ( typeof date === 'string' && date.match( /^\d\d\d\d\d\d\d\d$/ ) ) {
		return (
			[ 'Jan. ', 'Feb. ', 'March ', 'Apr. ', 'May ', 'June ', 'July ', 'Aug. ', 'Sept. ', 'Oct. ', 'Nov. ', 'Dec. ' ][ Number( date.substr( 4, 2 ) ) - 1 ] +
			( Number( date.charAt( 6 ) ) || '' ) + date.charAt( 7 ) + ', ' +
			date.substr( 0, 4 )
		);
	}
	return '';
}

/*TODO
	Settings: Toggle ms accuracy for paragraph time stamps.
	Export button: Export to .srt
*/
/*TODO
	Save and Load capabilities.
*/
