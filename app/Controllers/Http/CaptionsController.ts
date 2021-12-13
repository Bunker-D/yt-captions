import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { RequestContract } from '@ioc:Adonis/Core/Request';
import { ViewRendererContract } from '@ioc:Adonis/Core/View';
import { schema, rules } from '@ioc:Adonis/Core/Validator';
import matchTextsIndices from 'App/Modules/matchTextsIndices';
import {
	fetchVideo as ytFetchVideo,
	fetchCaptions as ytFetchCaptions,
	readSubFile,
	clearHtml,
	FetchError,
	ytData,
} from 'App/Modules/youtubeFetch';

export default class CaptionsController {


	// HACK  Test function
	public async test( { response }: HttpContextContract ): Promise<void | string> {
		const subUrl = "https://www.youtube.com/api/timedtext?key=yt8&ip=0.0.0.0&asr_langs=de%2Cen%2Ces%2Cfr%2Cid%2Cit%2Cja%2Cko%2Cnl%2Cpt%2Cru%2Ctr%2Cvi&expire=1639386306&v=efA6B2EKLN4&hl=en&kind=asr&exp=xftt%2Cxctw&fmt=vtt&lang=en&sparams=ip%2Cipbits%2Cexpire%2Cv%2Casr_langs%2Ccaps%2Cexp%2Cxoaf&xoaf=4&ipbits=0&signature=5703C544C91B01058C1F712D15572C1897FDEC67.90B7CD794CC2B20FD7E9AC954AB2C66D1796DC4F&caps=asr";
		const subs = await ytFetchCaptions( subUrl );
		let times: string[] = [];
		let decoded: string = '';
		const repetitions: [string,string[]][] = [];
		let w_!: string;
		const words: string[] = [];
		const noRepeat: string[] = [];
		for ( const [ t, w ] of subs ) {
			words.push( w );
			if ( w === w_ ) {
				times.push( t )
			} else {
				noRepeat.push( w );
				let heads: string[] = [ ' ' ];
				if ( times.length > 1 ) {
					heads = times.map( () => '├' );
					heads[ 0 ] = '┌';
					heads[ heads.length - 1 ] = '└';
					if ( times.length > 2 ) repetitions.push( [ w_, times ] );
				} else heads = [ ' ' ];
				for ( let i = 0; i < times.length; i++ ) decoded += ` ${ heads[ i ] } ${ times[ i ] } → ${ w_ }\n`;
				w_ = w;
				times = [ t ];
			}
		}
		let report = '';
		if ( repetitions.length ) {
			const maxLen = Math.max( ...repetitions.map( ( [ w, _ ] ) => w.length ) );
			const line = '—'.repeat( maxLen + 4 + repetitions[ 0 ][ 1 ][ 0 ].length ) + '\n';
			report = line;
			for ( const [ w, t ] of repetitions ) {
				report += '"' + w + '": ' + ' '.repeat( maxLen - w.length ) + t[ 0 ] + '\n';
				for ( let i = 1; i < t.length; i++ ) report += ' '.repeat( 4 + maxLen ) + t[ i ] + '\n';
				report += line;
			}
		} else report = 'NO REPETITION';
		// console.log( '\n\n\n\n\n' + words.join( '' ) );
		// console.log( '\n\n\n\n\n' + noRepeat.join( '' ) );
		// console.log( report );
		const words0 = `all right everyone welcome to our strategy session we are the heroes that have been tasked with saving the world from the division and hate that have been plaguing it but how are we gonna do it well i think with the problem of racism we can solve it by teaching people that they're inherently bad based on the color of their skin and also segregating people based on their skin color oh i like that like how now the nfl will be playing a black national anthem and a white national anthem before games it's a good first step in creating more division yes that's a great idea so good um i'm not sure that's gonna work what do you mean well i don't think what you're proposing is gonna help racism because it is racism you know like what you're proposing is to judge a person based on their skin color not the content of their character yeah well that's the opposite of what martin luther king preached which was to judge a person based on the content of their character not the color of their skin oh what so you think just because you're a man you can be educated yeah leave it to a white guy to bring up martin luther king he's not white i identify him as korean and you know koreans know nothing about martin luther king look what i'm doing isn't racism i just don't think you're following me here so let me explain what i'm saying is that that that certain racial groups are superior and other certain racial groups are inferior yeah yeah yeah that's racism you just said the definition of racism look i've got it printed right here i identify as illiterate and it is hateful to try to get our community to read things literacy is racist quit being so hateful man man man i hate you because you're a man see that's the kind of love we need more of okay okay okay um moving on what's your idea for helping the world i am transgender and non-binary amazing thank you for your contribution um um um so you're transgender and non-binary that's great but did you know those are two opposite things so you can't be both at the same time how how how dare you no i mean you're obviously a great person but what if we could stretch our minds into objective reality for just a second transgender means you identify as the opposite gender you were born as and it means you're possibly willing to go through surgeries and hormone treatments treatments treatments because you identify as that gender so much much much yeah and being non-binary means you don't identify as any gender and you're saying you're both of these at the same time yeah well that doesn't make any sense whoa whoa whoa you're just attacking her because she's black she's not black ask her are you black i do identify as black you'll never amount to anything because of your skin color i don't think you're black i'm a man now [ __ ] you now i'm a woman you go girl look i realize your cisgender privilege cloud's your reality but if you would just stop overthinking things you'd realize your objective reality should be based on my imagination does that make more sense now i identify as you and it makes sense to me great i'm glad you understand okay but how does what you said help the world in any way are you kidding me just because she's a woman woman woman you don't think man now i hate you woman again again again just because she's a woman you don't think she's helping the world you misogynistic pig it's not because she's a woman oh so it's because she's black no so it's because i'm non-binary look clearly his misogynistic brain doesn't get it but here's what i'm doing to help the world become a better place i'm teaching women that it's disempowering disempowering disempowering to have children and raise a family i hate the nuclear family but that's the most powerful thing any person could ever do and i simultaneously teach women that they can be empowered by going out and earning just as much money and achieving just as much status as a man love that i'm both um yes logic you got a problem with that so you want to empower women by getting them to think that their pathway to happiness happiness happiness is through money and status yes exactly even though we all know that money and status status status can't make you happy yeah i think how you're trying to empower women disempowers women i don't like all this racism and what's your point i don't think that actually works it doesn't work can't you see my rage that i pushed these ideas forward with that means i fought them through so of course they work why are you homophobic i'm not homophobic i bet you wouldn't be afraid to be phobic if she was white she is white racists think everyone's white your masculinity is toxic what you were racist no i'm not i bet you would be if she was white i love your korean heritage i'm not korean is that because you hate koreans or just korean women or just trans korean women neither my testicles itch wait what if we teach that all babies are born born born racist transphobic and they hate women i love it that's so true i feel like more of a victim already i don't understand why babies are born with so much hate we should mandate abortions abortions abortions stop it just wait a minute now i think you're all good people with good intentions and i love you all but i think the way you're going about trying to help the world is hurting the world creating more division division division and i think your efforts have been fueled by emotion rage and reactivity but if you guys just think things through use some logic i think you can come up with a set of actions that will genuinely genuinely genuinely help the world because underneath your emotional hostility i think you're all smart people that can come up with some good ideas you think we're smart yes really yes do you have any idea how uninclusive that is to the mentally impaired community mental impairment is rooted in racism you clearly think he's smart just because he's a man i identify as mentally challenged as a white man you need to realize how you've oppressed her you should be ashamed of yourself i identify as blind and i'm deaf now oh my you've lived your whole life like this what i i can't hear you adversity it's been so hard first white people stole your vision and then they purposely never amount to anything it's not gonna be okay at all before you go i want to thank the sponsor of this video blood sugar breakthrough made by by optimizers now let me ask you a question you're not an idiot are you i didn't think so so that means you probably like to feel and function your best with robust physical energy good mental clarity and optimal health i thought so and that means you're a perfect match for blood sugar breakthrough breakthrough breakthrough two capsules before a meal helps stabilize your blood sugar so you can feel and function the way you want to get your blood sugar breakthrough by going to blood sugar breakthrough dot health slash jp 20 and be sure to use the discount code awjp to get yourself a healthy discount`;
		const noRepeat0 = `all right everyone welcome to our strategy session we are the heroes that have been tasked with saving the world from the division and hate that have been plaguing it but how are we gonna do it well i think with the problem of racism we can solve it by teaching people that they're inherently bad based on the color of their skin and also segregating people based on their skin color oh i like that like how now the nfl will be playing a black national anthem and a white national anthem before games it's a good first step in creating more division yes that's a great idea so good um i'm not sure that's gonna work what do you mean well i don't think what you're proposing is gonna help racism because it is racism you know like what you're proposing is to judge a person based on their skin color not the content of their character yeah well that's the opposite of what martin luther king preached which was to judge a person based on the content of their character not the color of their skin oh what so you think just because you're a man you can be educated yeah leave it to a white guy to bring up martin luther king he's not white i identify him as korean and you know koreans know nothing about martin luther king look what i'm doing isn't racism i just don't think you're following me here so let me explain what i'm saying is that certain racial groups are superior and other certain racial groups are inferior yeah that's racism you just said the definition of racism look i've got it printed right here i identify as illiterate and it is hateful to try to get our community to read things literacy is racist quit being so hateful man i hate you because you're a man see that's the kind of love we need more of okay um moving on what's your idea for helping the world i am transgender and non-binary amazing thank you for your contribution um so you're transgender and non-binary that's great but did you know those are two opposite things so you can't be both at the same time how dare you no i mean you're obviously a great person but what if we could stretch our minds into objective reality for just a second transgender means you identify as the opposite gender you were born as and it means you're possibly willing to go through surgeries and hormone treatments because you identify as that gender so much yeah and being non-binary means you don't identify as any gender and you're saying you're both of these at the same time yeah well that doesn't make any sense whoa you're just attacking her because she's black she's not black ask her are you black i do identify as black you'll never amount to anything because of your skin color i don't think you're black i'm a man now [ __ ] you now i'm a woman you go girl look i realize your cisgender privilege cloud's your reality but if you would just stop overthinking things you'd realize your objective reality should be based on my imagination does that make more sense now i identify as you and it makes sense to me great i'm glad you understand okay but how does what you said help the world in any way are you kidding me just because she's a woman you don't think man now i hate you woman again just because she's a woman you don't think she's helping the world you misogynistic pig it's not because she's a woman oh so it's because she's black no so it's because i'm non-binary look clearly his misogynistic brain doesn't get it but here's what i'm doing to help the world become a better place i'm teaching women that it's disempowering to have children and raise a family i hate the nuclear family but that's the most powerful thing any person could ever do and i simultaneously teach women that they can be empowered by going out and earning just as much money and achieving just as much status as a man love that i'm both um yes logic you got a problem with that so you want to empower women by getting them to think that their pathway to happiness is through money and status yes exactly even though we all know that money and status can't make you happy yeah i think how you're trying to empower women disempowers women i don't like all this racism and what's your point i don't think that actually works it doesn't work can't you see my rage that i pushed these ideas forward with that means i fought them through so of course they work why are you homophobic i'm not homophobic i bet you wouldn't be afraid to be phobic if she was white she is white racists think everyone's white your masculinity is toxic what you were racist no i'm not i bet you would be if she was white i love your korean heritage i'm not korean is that because you hate koreans or just korean women or just trans korean women neither my testicles itch wait what if we teach that all babies are born racist transphobic and they hate women i love it that's so true i feel like more of a victim already i don't understand why babies are born with so much hate we should mandate abortions stop it just wait a minute now i think you're all good people with good intentions and i love you all but i think the way you're going about trying to help the world is hurting the world creating more division and i think your efforts have been fueled by emotion rage and reactivity but if you guys just think things through use some logic i think you can come up with a set of actions that will genuinely help the world because underneath your emotional hostility i think you're all smart people that can come up with some good ideas you think we're smart yes really yes do you have any idea how uninclusive that is to the mentally impaired community mental impairment is rooted in racism you clearly think he's smart just because he's a man i identify as mentally challenged as a white man you need to realize how you've oppressed her you should be ashamed of yourself i identify as blind and i'm deaf now oh my you've lived your whole life like this what i can't hear you adversity it's been so hard first white people stole your vision and then they purposely never amount to anything it's not gonna be okay at all before you go i want to thank the sponsor of this video blood sugar breakthrough made by optimizers now let me ask you a question you're not an idiot are you i didn't think so that means you probably like to feel and function your best with robust physical energy good mental clarity and optimal health i thought so and that means you're a perfect match for blood sugar breakthrough two capsules before a meal helps stabilize your blood sugar so you can feel and function the way you want to get your blood sugar breakthrough by going to blood sugar breakthrough dot health slash jp 20 and be sure to use the discount code awjp to get yourself a healthy discount`;
		console.log( '\n\n\n\n' );
		console.log( words.join( '' ).trim() === words0 );
		console.log( noRepeat.join( '' ).trim() === noRepeat0 );
		console.log( words.join( '' ).trim() === noRepeat0 );
		console.log( noRepeat.join( '' ).trim() === words0 );
		response.send( decoded );
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
		let captions: TimedCaptions;
		try {
			captions =
				( urls.length > 1 ) ? // Two captions files to combine (time and text)
					CaptionsController.retextCaptions(
						[ await ytFetchCaptions( urls[ 0 ] ) ],
						( await ytFetchCaptions( urls[ 1 ] ) ).map( ( x ) => x[ 1 ] ).join( '' )
					)
				: // One single captions file
					[ await ytFetchCaptions( urls[ 0 ] ) ];
		} catch ( e ) {
			return response.redirect( request.url() );
		}
		// Build page
		return view.render( 'captions', {
			title: reqData.title,
			author: reqData.author,
			date: reqData.date,
			id: reqData.id,
			captions: captions,
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
	 * @returns {VideoContent} Described content
	 */
	private static readFile( content: string ): VideoContent {
		// Read the .cpt file
		let match: RegExpMatchArray | null = content.match( /{(\/)*([\d:.]+)}/ );
		let video: { [ key: string ]: string } = {};
		let captions: TimedCaptions = [];
		if ( match && ( match.index === 0 || ( content[ 0 ] === '{' && content[ 2 ] === '}' ) ) ) {
			if ( match.index ) {
				const map = { T: 'title', A: 'author', D: 'date', U: 'url', I: 'id' };
				const head = content.substr( 0, match.index );
				for ( const m of head.matchAll( /{([A-Z])}((?:[^{]|{\/)+)/g ) ) {
					if ( m[ 1 ] in map ) video[ map[ m[ 1 ] ] ] = m[ 2 ].replace( /{\//g, '{' );
				}
				content = content.substr( match.index );
			}
			let t: string = ''; // timing of the current timed bit (i.e. last timing met)
			let i: number = 0; // start index of the current timed bit
			let r: boolean = false; // some "{/…}" in the text of the bit to be replaced
			let paragraph: TimedCaptionsParagraph = [];
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
		return { captions: captions, ...video }
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
	 * @param {TimedCaptionsParagraph} captions Captions providing the basis for timings
	 * @param {string} text Text of the captions to create
	 * @returns {TimedCaptionsParagraph} Created captions
	 */
	private static retextCaptions( captions: TimedCaptions, text: string ): TimedCaptions {
		// Remove formatting HTML from the texts to match  //IMPROVE Handle <i>, <b>, <u> in captions merging
		captions = captions.map( ( par ) => clearHtml( par, [], { i: null, b: null, u: null, br: null, font: null } ) ); // # <font>
		text = clearHtml( text, [], { i: null, b: null, u: null, br: null, font: null } ); // # <font>
		// Build the indices of where timings apply in original captions
		const paragraphs: number[] = [];
		const times: string[] = [];
		let captionsText: string = '';
		let indices: number[] = [];
		let i = 0;
		for ( let p = 0; p < captions.length; p++ ) {
			for ( const x of captions[ p ] ) {
				const t = x[ 1 ].replace( /<\/?[ibu]/gi, '' ).replace( /&lt;/gi, '<' ).replace( /&amp;/gi, '&' ); // # <font>
				paragraphs.push( p );
				times.push( x[ 0 ] );
				captionsText += t;
				indices.push( i );
				i += t.length;
			}
		}
		// Convert those indices to match the provided text
		indices = matchTextsIndices( captionsText, text, indices );
		// Build the target captions
		const retimed: [string,string,number][] = [];
		let t!: string;
		let s!: number;
		let p!: number;
		i = 0;
		for ( ; i < indices.length; i++ ) { // Get the first block
			if ( indices[ i ] >= 0 ) {
				t = times[ i ];
				s = indices[ i ];
				p = paragraphs[ i ];
				if ( s > 0 ) {
					retimed.push( [
						times[ 0 ].replace( /\d/g, '0' ), // If not timed, start put at 00:00.000
						text.substring( 0, s ),
						0,
					] );
				}
				break;
			}
		}
		for ( ; i < indices.length; i++ ) { // Continue
			if ( indices[ i ] >= 0 ) {
				retimed.push( [ t, text.substring( s, indices[ i ] ), p ] );
				t = times[ i ];
				s = indices[ i ];
				p = paragraphs[ i ];
			}
		}
		if ( t ) retimed.push( [ t, text.substring( s, indices[ i ] ), p ] );
		// Move opening quotes, parenthesis, etc within the following block
		const reg = /([\(\[\{‘“«‚„<¿¡]|(--+|[–—])|(?<=\ )[-'"])\ *$/;
		let m: RegExpMatchArray | null;
		let opened = false;
		let str = '';
		for ( let i = 0; i < retimed.length; i++ ) {
			str = retimed[ i ][ 1 ];
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
				retimed[ i + 1 ][ 1 ] = m[ 0 ] + retimed[ i + 1 ][ 1 ];
				str = str.substr( 0, str.length - m[ 0 ].length );
				retimed[ i ][ 1 ] = str;
			}
		}
		// Return the result
		p = -1;
		const result: TimedCaptions = [];
		let par: TimedCaptionsParagraph = [];
		for ( const x of retimed ) {
			if ( x[ 2 ] !== p ) {
				par = [];
				result.push( par );
				p = x[ 2 ];
			}
			par.push( [ x[ 0 ], x[ 1 ] ] );
		}
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
	 * Request parameters:
	 *     captions:  Captions as [ [ [time,text], [time,text], … ], … ], time being in the format `HH:MM:SS.mmm`, `H:MM:SS.mmm`, `MM:SS.mmm`, or `M:SS.mmm`.
	 *     title:     Title of the video (string). (Optional.)
	 *     author:    Author/channel of the video (string). (Optional.)
	 *     date:      Date of the video (string). (Optional.)
	 *     url:       URL of the video (string). (Optional.)
	 */
	public async exportSrt( { request, response }: HttpContextContract ): Promise<void> {
		const captions: TimedCaptions = await CaptionsController.captionsFromRequest( request );
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
	 * Request parameters:
	 *     captions:  Captions as [ [ [time,text], [time,text], … ], … ], time being in the format `HH:MM:SS.mmm`, `H:MM:SS.mmm`, `MM:SS.mmm`, or `M:SS.mmm`.
	 *     title:     Title of the video (string). (Optional.)
	 *     author:    Author/channel of the video (string). (Optional.)
	 *     date:      Date of the video (string). (Optional.)
	 *     url:       URL of the video (string). (Optional.)
	 */
	public async exportSave( { request, response }: HttpContextContract ): Promise<void> {
		const captions: TimedCaptions = await CaptionsController.captionsFromRequest( request );
		const video: VideoDescriptor = await CaptionsController.descriptionFromRequest( request );
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
	 * ARRAY REQUEST:  Merge the text from a file with the timings of captions.
	 * Request parameters:
	 *     captions:  Captions as [ [ [time,text], [time,text], … ], … ], time being in the format `HH:MM:SS.mmm`, `H:MM:SS.mmm`, `MM:SS.mmm`, or `M:SS.mmm`.
	 *     text:      Text to apply.
	 */
	public async mergeWithFile( { request, response }: HttpContextContract ): Promise<void | string> {
		return response.send( CaptionsController.retextCaptions(
			await CaptionsController.captionsFromRequest( request ),
			CaptionsController.readFile(
				( await request.validate( { schema: schema.create( { text: schema.string() } ) } ) ).text
			).captions.map( ( p ) => p.map( ( x ) => x[ 1 ] ).join( '' ) ).join( '' ),
		) );
	}

	/**
	 * Get the captions-describing table from a request.
	 * The request must have a captions field, in the format [ [ [time,text], [time,text], … ], … ].
	 * Each element of the main list correspond to a subtitle.
	 * Times are assumed to be of format `HH:MM:SS.mmm`, `H:MM:SS.mmm`, `MM:SS.mmm`, or `M:SS.mmm`.
	 * @param request Request to get the data from
	 * @returns Captions-describing table in the format [ [ [time,text], [time,text], … ], … ].
	 */
	private static async captionsFromRequest( request: RequestContract ): Promise<TimedCaptions> {
		return (
			( await request.validate( {
				schema: schema.create( {
					captions: schema.array().members( schema.array().members( schema.array( [ rules.minLength( 2 ) ] ).members( schema.string() ) ) )
				} )
			} ) ).captions.map( ( p ) => p.map( ( b ) => [ b[ 0 ], b[ 1 ] ] ) )
		);
	}

	/**
	 * Get the video-describing data from a request: title, author, date, url.
	 * @param request Request to get the data from
	 * @returns An object with the data contained in the request.
	 */
	private static async descriptionFromRequest( request: RequestContract ): Promise<VideoDescriptor> {
		return (
			await request.validate( {
				schema: schema.create( {
					title: schema.string.optional( { escape: true, trim: true } ),
					author: schema.string.optional( { escape: true, trim: true } ),
					date: schema.string.optional( { escape: true, trim: true } ),
					url: schema.string.optional( {}, [ rules.url() ] ),
				} )
			} )
		);
	}
}

type TimedCaptionsParagraph = [ string, string ][];
type TimedCaptions = TimedCaptionsParagraph[];
interface VideoDescriptor {
	title?: string,
	author?: string,
	date?: string,
	url?: string,
	id?: string,
}
interface VideoContent extends VideoDescriptor {
	captions: TimedCaptions,
}

/*IMPROVE  Support <font …> tags
	→ Search for “# <font>” for relevant locations 
*/
/*IMPROVE  Settings: Toggle ms accuracy for paragraph time stamps.
*/
/*IMPROVE  Auto-capitalize option:
	Toggable option to automatically capitalize the following letter when a . is added tout the text.
	Also allows to capitalize all “i” without any letter around.
*/
/*IMPROVE  Dark theme
*/
/*IMPROVE  Optional video integration
	Synchronization: from video to captions, and captions to video.
*/
/*IMPROVE  Consider making a browser extension
	It might even add the editor (with video sync) in the Youtube page.
*/
/*IMPROVE  Replace occurrences substr (deprecated)
*/
