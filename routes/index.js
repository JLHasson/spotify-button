var express = require('express');
var router = express.Router();
var SpotifyApi = require('spotify-web-api-node');
var prettyjson = require('prettyjson');

// Replace these with your credentials
// It is recommended you use a config file which is added to your .gitignore
var cID = "YourSpotifyClientID";
var cSecret = "YourSpotifySecret";
var redirect = 'Http://example.com/callback';
var scopes = ['user-library-modify', 'user-follow-modify', 'playlist-modify-private']; // example

var spotifyAPI = new SpotifyApi({
		  clientId : cID,
		  clientSecret : cSecret,
		  redirectUri : redirect
		});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { auth : req.session.spotify_auth });
});

router.get('/auth', function(req, res) {

	var authURL = spotifyAPI.createAuthorizeURL(scopes, '');

	res.redirect(authURL);

});

router.get('/callback/q', function(req, res) {
	var code = req.query.code;
	console.log('CODEEEEE: ', code);

	spotifyAPI.authorizationCodeGrant(code)
		.then(function(data) {

			// The stuff we want
			var expires_in = data.body['expires_in'];
			var access_token = data.body['access_token'];
			var refresh_token = data.body['refresh_token'];

			var sesh = req.session;

			sesh.expires_in = expires_in;
			sesh.access_token = access_token;
			sesh.refresh_token = refresh_token;
			sesh.spotify_auth = 'true';

			res.redirect('/')
		}, function(err) {
			res.status(err.code);
			res.send(err.message);
		});
});

router.get('/plist', function(req, res) {
	spotifyAPI.setAccessToken(req.session.access_token);

	// Get the current users playlists
	spotifyAPI.getMe()
		.then(function(data) {
			console.log(prettyjson.render(data.body))
			var user_uri = data.body.uri.split(':');
			return user_uri[user_uri.length - 1];
		}, function(err) {
			console.log('ERROR: ', err.message);
			res.send(err.message);
		})
		.then(function(user_id) {
			return spotifyAPI.getUserPlaylists(user_id);
		})
		.then(function(data) {
			console.log('plist_info: ', data.body.items);
			res.render('plist', {plists : data.body.items});
		}, function(err) {
			res.send(err.message);
		});
});

router.get('/logout', function(req, res) {
	req.session.destroy(function(err) {
		if (err) {
			res.send(err.message);
		} else {
			res.redirect('/');
		}
	});
});


module.exports = router;
