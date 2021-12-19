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
	let ab!: [ number, number, number ][];
	for ( const maxOffset of [ 400, 1000, 0 ] ) {
		// To accelerate the computation in most cases, we first limit the considered offset, then extend if 93% matching target isn't reached.
		// (Handling a 1h40 video could be dropped from 110s to 5.5s.)
		ab = getMatches( fromCurated, toCurated, maxOffset );
		let match = 0;
		for ( const x of ab ) match += x[ 2 ];
		if ( match > .93 * ( ( fromCurated.length < toCurated.length ) ? fromCurated.length : toCurated.length ) ) break;
	}
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
function getMatches( a: string, b: string, maxOffset: number ): [ number, number, number ][] {
	let [ i, j, n ] = longestMatch( a, b, maxOffset );
	if ( n ) {
		const left = ( i && j ) ? getMatches( a.substring( 0, i ), b.substring( 0, j ), maxOffset ) : [];
		left.push( [ i, j, n ] );
		i += n;
		j += n;
		const right = ( i < a.length && j < b.length ) ? getMatches( a.substring( i ), b.substring( j ), maxOffset ) : [];
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
 * @param {number} [maxOffset] Maximal offset tested beyond a-b length mismatch. If 0, no limit (default).
 * @returns {[number,number,number]} [ start index in a, start index in b, length of the match ]
 */
function longestMatch( a: string, b: string, maxOffset: number ): [number,number,number] {
	const aLen = a.length;
	const bLen = b.length;
	const [ minLen, maxLen, lastONeg ] = ( aLen < bLen ) ? [ aLen, bLen, true ] : [ bLen, aLen, false ];
	let mLen: number = 0; // Length of the maximal match
	let mIndex!: number; // a Index of the maximal match
	let mOAbs!: number, mONeg!: boolean; // b offset for the maximal match
	let oMax: number = maxLen, oMax2: number = minLen; // Maximal offset to test for last or both direction (resp.)
	let updateOMax: () => void, updateOMax2: () => void;
	if ( maxOffset ) {
		oMax = ( maxLen - minLen ) + maxOffset;
		oMax2 = maxOffset;
		updateOMax = () => {
			if ( maxLen - mLen < oMax ) {
				oMax = maxLen - mLen;
				updateOMax = () => { oMax = maxLen - mLen; };
			}
		};
		updateOMax2 = () => {
			if ( minLen - mLen < oMax2 ) {
				oMax2 = minLen - mLen;
				updateOMax2 = () => { oMax2 = minLen - mLen; };
			}
		};
	} else {
		oMax = maxLen;
		oMax2 = minLen;
		updateOMax = () => { oMax = maxLen - mLen; }; // Overlapping must be sufficient to get reach a given length
		updateOMax2 = () => { oMax2 = minLen - mLen; };
	}

	const remember = ( start: number, finish: number, oAbs: number, oNeg: boolean ) => { // Update values if need be after a match from 'start' to 'finish'
		if ( start >= 0 ) {
			if ( finish - start > mLen ) {
				mLen = finish - start;
				mIndex = start;
				mOAbs = oAbs;
				mONeg = oNeg;
				updateOMax();
				updateOMax2();
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
				bOver = b.substring( oAbs );
				aOver = a;
				nOver = ( bOver.length < aLen ) ? bOver.length : aLen;
			} else {
				aOver = a.substring( oAbs );
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
