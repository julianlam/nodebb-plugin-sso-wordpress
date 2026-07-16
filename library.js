'use strict';

const User = nodebb.require('./src/user');
const Groups = nodebb.require('./src/groups');
const meta = nodebb.require('./src/meta');
const plugins = nodebb.require('./src/plugins');
const db = nodebb.require('./src/database');
const passport = nodebb.require('passport');
const nconf = nodebb.require('nconf');
const winston = nodebb.require('winston');

const routeHelpers = nodebb.require('./src/routes/helpers');
const controllers = require('./controllers');

const pluginStrategies = [];
const OAuth = module.exports;
let passportOAuth;
let opts;

OAuth.init = async function (params) {
	const { router } = params;

	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/sso-wordpress', controllers.renderAdminPage);

	const settings = await meta.settings.get('sso-wordpress');

	if (settings && ['url', 'id', 'secret'].every(key => settings.hasOwnProperty(key) && settings[key])) {
		pluginStrategies.push({
			name: 'wordpress', // Something unique to your OAuth provider in lowercase, like "github", or "nodebb"
			oauth2: {
				authorizationURL: settings.url + '/oauth/authorize',
				tokenURL: settings.url + '/oauth/token',
				clientID: settings.id,
				clientSecret: settings.secret,
			},
			userRoute: settings.url + '/oauth/me/',
		});
	} else {
		winston.verbose('[plugin/sso-wordpress] Please complete configuration for Wordpress SSO login');
	}
};

OAuth.addMiddleware = function (data, callback) {
	data.app.use(function (req, res, next) {
		// Only respond to page loads by guests, not api or asset calls
		const blacklistedRoute = new RegExp('^' + nconf.get('relative_path') + '/(api|vendor|uploads|language|templates|debug|auth)'),
			blacklistedExt = /\.(css|js|tpl|json|jpg|png|bmp|rss|xml|woff2)$/,
			hasSession = req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && parseInt(req.user.uid, 10) > 0;

		if (
			hasSession || // user logged in
			(req.path.match(blacklistedRoute) || req.path.match(blacklistedExt)) // path matches a blacklist
		) {
			return next();
		}
		meta.settings.getOne('sso-wordpress', 'redirectEnabled', function (err, value) {
			if (err) {
				return next(err);
			}
			if (value === 'on') {
				res.redirect('/auth/' + pluginStrategies[0].name);
			} else {
				return next();
			}
		});
	});

	callback();
};

OAuth.addAdminNavigation = function (header) {
	header.authentication.push({
		route: '/plugins/sso-wordpress',
		icon: 'fa-wordpress',
		name: 'Wordpress',
	});
	return header;
};

OAuth.getStrategy = function (strategies) {
	if (pluginStrategies.length) {
		winston.verbose('[plugin/sso-wordpress] Configuring SSO login for ' + pluginStrategies.length + ' install(s)');

		passportOAuth = require('passport-oauth').OAuth2Strategy;
		opts = pluginStrategies[0].oauth2;
		opts.callbackURL = nconf.get('url') + '/auth/' + pluginStrategies[0].name + '/callback';

		passportOAuth.Strategy.prototype.userProfile = function (accessToken, done) {
			this._oauth2.get(pluginStrategies[0].userRoute, accessToken, function (err, body) {
				if (err) {
					return done(new Error('failed to fetch user profile', { cause: err }));
				}

				try {
					const json = JSON.parse(body);
					const profile = OAuth.parseUserReturn(json);
					profile.provider = pluginStrategies[0].name;
					done(null, profile);
				} catch (e) {
					done(e);
				}
			});
		};

		passport.use(pluginStrategies[0].name, new passportOAuth(opts, async function (token, secret, profile, done) {
			try {
				const { queued, uid, message } = OAuth.login({
					oAuthid: profile.id,
					handle: profile.displayName,
					email: profile.emails[0].value,
					isAdmin: profile.isAdmin,
				});
				if (queued) {
					return done(null, false, { message });
				}
				await plugins.hooks.fire('static:sso-wordpress.login', {
					user: { uid },
					strategy: pluginStrategies[0],
					profile: profile,
				});
				done(null, { uid });
			} catch (err) {
				done(err);
			}
		}));

		strategies.push({
			name: pluginStrategies[0].name,
			url: '/auth/' + pluginStrategies[0].name,
			callbackURL: '/auth/' + pluginStrategies[0].name + '/callback',
			icon: 'fa-wordpress',
			icons: {
				normal: 'fa-brands fa-wordpress',
				square: 'fa-brands fa-wordpress-simple',
			},
			labels: {
				login: '[[social:sign-in-with-wordpress]]',
				register: '[[social:sign-in-with-wordpress]]',
			},
			color: '#21759b',
			scope: (pluginStrategies[0].scope || '').split(','),
		});
	}

	return strategies;
};

OAuth.parseUserReturn = function (data) {
	const profile = {};
	profile.id = data.ID;
	profile.displayName = data.user_login;
	profile.emails = [{ value: data.user_email }];
	return profile;
};

OAuth.login = async function (payload) {
	let uid = await OAuth.getUidByOAuthid(payload.oAuthid);
	if (uid) {
		return { uid }; // existing user
	}

	uid = await User.getUidByEmail(payload.email);
	if (uid) { // Link wordpress account to existing user with same email
		await Promise.all([
			User.setUserField(uid, pluginStrategies[0].name + 'Id', payload.oAuthid),
			db.setObjectField(pluginStrategies[0].name + 'Id:uid', payload.oAuthid, uid),
		]);
		return { uid };
	}

	return await User.createOrQueue(payload.req, {
		wordpressId: payload.oAuthid, // passing to create so it can be saved in registration queue
		username: payload.handle,
		email: payload.email,
	}, {
		emailVerification: 'send',
		isWPAdmin: payload.isAdmin,
	});
};

OAuth.filterUserWhitelistFields = function (data) {
	data.whitelist.push('wordpressId');
	return data;
};

// If registration queue is enabled this hook will be called,
OAuth.addToApprovalQueue = async (hookData) => {
	// "data" is what will be saved to the registration queue
	// "userData" is sent from wordpress
	await saveWordpressSpecificData(hookData.data, hookData.userData);
	return hookData;
};

// triggered when a user is created (either directly or from approval queue)
OAuth.filterUserCreate = async (hookData) => {
	// "user" is what will be saved to the database
	// "data" is sent from register page or from registration queue
	await saveWordpressSpecificData(hookData.user, hookData.data);
	return hookData;
};

async function saveWordpressSpecificData(targetObj, sourceObj) {
	const { wordpressId } = sourceObj;
	if (wordpressId) {
		const uid = await OAuth.getUidByOAuthid(wordpressId);
		if (uid) {
			throw new Error('[[error:sso-account-exists, Wordpress]]');
		}
		targetObj.wordpressId = wordpressId;
	}
}

// fired after user creation, save wordpressId => uid mapping and make user admin if isWPAmin is true
OAuth.actionUserCreate = async (hookData) => {
	const { uid } = hookData.user;
	const wordpressId = await User.getUserField(uid, 'wordpressId');
	if (wordpressId) {
		await db.setObjectField('wordpressId:uid', wordpressId, uid);
		if (hookData?.opts?.isWPAdmin) {
			await Groups.join('administrators', uid);
		}
	}
};

OAuth.filterUserGetRegistrationQueue = async (hookData) => {
	const { users } = hookData;
	users.forEach((user) => {
		if (user?.wordpressId) {
			user.sso = {
				icon: 'fa-brands fa-wordpress',
				name: 'Wordpress',
			};
		}
	});
	return hookData;
};


OAuth.getUidByOAuthid = async function (oAuthid) {
	return await db.getObjectField(pluginStrategies[0].name + 'Id:uid', oAuthid);
};

OAuth.deleteUserData = async function (data) {
	try {
		const oAuthIdToDelete = await User.getUserField(data.uid, pluginStrategies[0].name + 'Id');
		await db.deleteObjectField(pluginStrategies[0].name + 'Id:uid', oAuthIdToDelete);
	} catch (err) {
		winston.error('[sso-oauth] Could not remove OAuthId data for uid ' + data.uid + '. Error: ' + err);
		throw err;
	}
};
