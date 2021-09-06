/*
|--------------------------------------------------------------------------
| Application middleware
|--------------------------------------------------------------------------
*/

import Server from '@ioc:Adonis/Core/Server';

// Globale middleware
Server.middleware.register( [
	() => import( '@ioc:Adonis/Core/BodyParser' ),
] );

// Named middleware
Server.middleware.registerNamed( {
} );
