'use strict';

var Controllers = {};

Controllers.renderAdminPage = function (req, res, next) {
	res.render('admin/plugins/sso-wordpress', {});
};

module.exports = Controllers;