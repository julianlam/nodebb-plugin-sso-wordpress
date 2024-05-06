'use strict';

const Controllers = module.exports;

Controllers.renderAdminPage = function (req, res, next) {
	res.render('admin/plugins/sso-wordpress', {
		title: 'Wordpress SSO',
	});
};
