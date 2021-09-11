import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import matchTextsIndices from 'App/Modules/matchTextsIndices';
import {
	fetchVideo as ytFetchVideo,
	fetchCaptions as ytFetchCaptions,
	FetchError,
	ytData,
} from 'App/Modules/youtubeFetch';

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
		try {
			const data: ytData = await ytFetchVideo( params.id );
			return view.render( 'video', data );
		} catch ( e ) {
			return FetchError.raise( response, e );
		}
	}

	public async fetchCaptions( { request, params, view, response }: HttpContextContract ): Promise<void | string> {
		const body = request.body();
		if ( ! body.captions ) {
			/*TODO  url lacking
				→ Should fetch video data to try to find the proper url.
				→ If track doesn't exist, redirect to /params.id, with post to not repeat the data fetch.
				→ /!\ auto + manual 
			*/
			return response.status( 400 ).send( 'TO BE DONE:  here without captions file url' ); //TODO not that
		}
		// Identify the proper url (urls provided as "<lang>@<url>|<lang>@<url>|<lang>@<url>|…")
		let url: string = params.lang;
		if ( url === "0" ) url = "auto";
		if ( url === "00" ) url = "mix";
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
		const urls: string[] = url.split( '@' );
		let captions: [ String, String ][];
		if ( urls.length > 1 ) { // Two captions files to combine (time and text)
			const auto = await ytFetchCaptions( urls[ 0 ] ); // First track: automatic captions
			let text: [ string, string ][] | string = await ytFetchCaptions( urls[ 1 ] ); // Second track: manual captions
			text = text.map( ( x ) => x[ 1 ] ).join( '' ); // Keep just the text from manual captions
			console.log( urls ); // TODO DELETE
			console.log( '-----' ); // TODO DELETE
			console.log( auto.map( ( x ) => x[ 1 ] ).join( '' ) ); // TODO DELETE
			console.log( '-----' ); // TODO DELETE
			console.log( text ); // TODO DELETE
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
					console.log( s );
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
			title: body.title,
			channel: body.channel,
			date: body.date,
			id: body.id,
			text: captions,
		} );
	}

}


/*TODO
	Settings: Toggle ms accuracy for paragraph time stamps.
	Export button: Export to .srt
*/
/*TODO
	Save and Load capabilities.
*/
