import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { ResponseContract } from '@ioc:Adonis/Core/Response';
import { default as youtubedl, YtResponse } from 'youtube-dl-exec';
// import { default as fetch } from 'node-fetch';

export default class CaptionsController {

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
			const data = await _fetchVideo( params.id );
			return view.render( 'video', data );
		} catch ( e ) {
			FetchError.raise( response, e );
		}
	}

}

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
	// RTead the relevant data
	const data: ytData = {
		id: id,
		url: url,
		title: video.title,
		channel: video.channel,
		date: dateReformat( video.upload_date ),
		captions: {},
	};
	let urls = video.automatic_captions ?? {}; // List of automatic caption. Find the url for 'vtt' in the first one.
	for ( const { ext, url } of urls[ Object.keys( urls )[ 0 ] ] ) {
		if ( ext === 'vtt' ) {
			// Remove tlang field from the url to get to default (original) language
			// Note: An alternative solution would be to identify the video language through the lang= field in those urls.
			data.captions.auto = url.replace( /(?<=\/|&)tlang=[^&]+(&|$)/, '' );
			break;
		}
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
	automatic_captions?: { [ key: string ]: { ext: string, url: string; }[] }, //TODO
	subtitles?: { [ key: string ]: { ext: string, url: string; }[] }, //TODO
}

/**
 * Interface for the video data kept used by the captions collection tool
 */
interface ytData {
	id: string,
	url: string,
	title: string,
	channel: string,
	date: string,
	captions: { [ key: string ]: string; },
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
