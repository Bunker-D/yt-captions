import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { default as youtubedl, YtResponse } from 'youtube-dl-exec';

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
		const url: string = 'https://www.youtube.com/watch?v=' + params.id;
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
			if ( e.stderr === 'ERROR: Video unavailable' ) {
				return response.status( 404 ).send( 'Video not found' );
			}
			return response.status( 500 ).send( 'Something went wrong' );
			// Possible source of error:  MSVCR100.dll missing
			// Requires Microsoft Visual C++ 2010 Service Pack 1 Redistributable 32 bits (x86) (not 64, even on 64-bit Windows)
		}
		/*TODO
			Based on archived subget.js:
				Rebuild the youtube url
				Youtube-dl the data. If fail: 404.
				Keep what we want
		*/
		const data: ytData = {
			id: params.id,
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
		return view.render( 'video', data );
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
