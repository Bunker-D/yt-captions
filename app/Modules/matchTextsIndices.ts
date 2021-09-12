/**
 * Converts the indices for a text into those for a similar one.
 * @param {string} fromText Text for which the original indices are
 * @param {string} toText Similar text in which the corresponding indices shall be identified
 * @param {number[]} indices Locations in fromText (indices) to be located in toText
 * @returns {number[]} Corresponding locations (indices) in fromText (-1 when no match)
 */
export default function matchIndices( fromText: string, toText: string, indices: number[] ): number[] {
	const res: number[] = [];
	const [ fromCurated, a ] = curateStr( fromText ); // Curation: remove capital letters, accents, punctuation, excess spaces…
	const [ toCurated, b ] = curateStr( toText );
	const ab = getMatches( fromCurated, toCurated );
	if ( ! a.length ) a.push( [ 0, 0 ] );
	if ( ! b.length ) b.push( [ 0, 0 ] );
	let changeA = ( a.length ) ? a[ 0 ][ 1 ] : Infinity; // change<x>: next input index where the conversion rule described by <x> changes
	let changeB = ( b.length ) ? b[ 0 ][ 0 ] : Infinity;
	let changeAB = ( ab.length ) ? ab[ 0 ][ 0 ] : Infinity;
	let deltaA = 0, deltaB = 0, deltaAB = NaN; // delta<x>: index increment in the conversion described by <x>
	let indexA = 0, indexB = 0, indexAB = 0; // index<x>: index for the next element of <x> to deduce a conversion from
	for ( let index of indices ) {
		// A conversion: Impact of curation on fromCurated
		if ( index >= changeA ) { // Rule update
			do {
				deltaA = a[ indexA ][ 0 ] - changeA;
				indexA++;
				changeA = ( indexA < a.length ) ? a[ indexA ][ 1 ] : Infinity;
			} while ( index >= changeA );
		}
		index += deltaA; // Conversion
		// AB conversion: Texts matching
		if ( index >= changeAB ) { // Rule update
			do {
				if ( isNaN( deltaAB ) ) {
					deltaAB = ab[ indexAB ][ 1 ] - changeAB;
					changeAB = changeAB + ab[ indexAB ][ 2 ];
				} else {
					indexAB++;
					deltaAB = NaN;
					changeAB = ( indexAB < ab.length ) ? ab[ indexAB ][ 0 ] : Infinity;
				}
			} while ( index >= changeAB );
		}
		if ( isNaN( deltaAB ) ) { // Conversion
			res.push( -1 );
			continue;
		}
		index += deltaAB;
		// A conversion: Impact of curation on fromCurated
		if ( index >= changeB ) { // Rule update
			do {
				deltaB = b[ indexB ][ 1 ] - changeB;
				indexB++;
				changeB = ( indexB < b.length ) ? b[ indexB ][ 0 ] : Infinity;
			} while ( index >= changeB );
		}
		index += deltaB; // Conversion
		res.push( index );
	}
	return res;
}

/**
 * Identified the macthing bits between to strings.
 * @param {string} a String to compare
 * @param {string} b String to compare
 * @returns {[number,number,number][]} List of [ start index in a, start index in b, length of the match ]
 */
function getMatches( a: string, b: string ): [ number, number, number ][] {
	/*IMPROVE  Very slow for long texts.
		Limiting the offsets tried in getMatches could be a good idea. */
	let [ i, j, n ] = longestMatch( a, b );
	if ( n ) {
		const left = ( i && j ) ? getMatches( a.substr( 0, i ), b.substr( 0, j ) ) : [];
		left.push( [ i, j, n ] );
		i += n;
		j += n;
		const right = ( i < a.length && j < b.length ) ? getMatches( a.substr( i ), b.substr( j ) ) : [];
		for ( let k = right.length; k--; ) {
			right[ k ][ 0 ] += i;
			right[ k ][ 1 ] += j;
		}
		return left.concat( right );
	}
	return [];
}

/**
 * Find the longest match among to strings.
 * @param {string} a String to compare
 * @param {string} b String to compare
 * @returns {[number,number,number]} [ start index in a, start index in b, length of the match ]
 */
function longestMatch( a: string, b: string ): [number,number,number] {
	const aLen = a.length;
	const bLen = b.length;
	const [ minLen, maxLen, lastONeg ] = ( aLen < bLen ) ? [ aLen, bLen, true ] : [ bLen, aLen, false ];
	let oMax = maxLen, oMax2 = minLen; // Maximal offset to test for any or both direction (resp.)

	let mLen: number = 0; // Length of the maximal match
	let mIndex!: number; // a Index of the maximal match
	let mOAbs!: number, mONeg!: boolean; // b offset for the maximal match
	const remember = ( start: number, finish: number, oAbs: number, oNeg: boolean ) => { // Update values if need be after a match from 'start' to 'finish'
		if ( start >= 0 ) {
			if ( finish - start > mLen ) {
				mLen = finish - start;
				mIndex = start;
				mOAbs = oAbs;
				mONeg = oNeg;
				// To bit that, the overlapping length must be  > mLen
				// from which it needs, when  oNeg:  bLen - oAbs > mLen
				//                  and when !oNeg:  aLen - oAbs > mLen
				oMax = maxLen - mLen;
				oMax2 = minLen - mLen;
			}
		}
	};

	for ( let oAbs = 0; oAbs < oMax; oAbs++ ) { // Absolute offset tested
		for ( const oNeg of ( oAbs < oMax2 ) ? [ false, true ] : [ lastONeg ] ) {
			if ( ( ! oAbs ) && oNeg ) continue; // Skip -0
			// Keep the overlappipng parts of a and b
			let aOver: string, bOver: string; // Overlapping parts of a and b after ofset (Thanks to the use of nOver, tails can be kept.)
			let nOver: number; // Length of the overlap
			if ( oNeg ) {
				bOver = b.substr( oAbs );
				aOver = a;
				nOver = ( bOver.length < aLen ) ? bOver.length : aLen;
			} else {
				aOver = a.substr( oAbs );
				bOver = b;
				nOver = ( aOver.length < bLen ) ? aOver.length : bLen;
			}
			let start = -1;
			for ( let i = 0; i < nOver; i++ ) {
				if ( aOver[ i ] === bOver[ i ] ) {
					if ( start < 0 ) start = i;
				} else {
					remember( start, i, oAbs, oNeg );
					start = -1;
				}
			}
			if ( start >= 0 ) remember( start, nOver, oAbs, oNeg );
		}
	}
	return ( mONeg ) ? [ mIndex, mIndex + mOAbs, mLen ] : [ mIndex + mOAbs, mIndex, mLen ];
	//IMPROVE  Depending on use, it might be better to go through the whole thing and create a sorted list of matches
}

/**
 * Remove special characters and ponctuation from a string
 * (i.e., go lower case, remove accents, remove punctuation and keep single spaces).
 * @param {string} str String to clean
 * @returns {[string,[number,number][]]} [ Clean string, list if indices correspondances as [index in output, index in input] ]
 */
 function curateStr( str: string ): [string,[number,number][]] {
	let d: number = 0; // Keeps track of the index difference between input and output strings
	let dUpdate: boolean = true;
	let iMap: [number,number][] = []; // Indices map
	return [
		str.toLowerCase() // Go lower case
			.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' ) // Remove accents and other special characters (e.g., ç → c)
			.replace( /^[^a-z0-9]*/, ( punct: string ) => { // Handle starting spaces and punctuation
				d = punct.length;
				return '';
			} )
			.replace( /((?:[a-z0-9]+ )*[a-z0-9]+)([^a-z0-9]*)/g, ( _, words: string, punct: string, i: number ) => { // Handle punctuation and non-single spaces
				if ( dUpdate ) {
					iMap.push( [ i - d, i ] );
					dUpdate = false;
				}
				if ( punct.length ) {
					d += punct.length - 1;
					dUpdate = true;
				}
				return words + ' ';
			} ),
		iMap
	];
}
