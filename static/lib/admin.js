define('admin/plugins/sso-wordpress', ['settings', 'alerts'], function(Settings, alerts) {
	'use strict';
	/* globals $, app, socket, require */

	var ACP = {};

	ACP.init = function() {
		Settings.load('sso-wordpress', $('.sso-wordpress-settings'));

		$('#save').on('click', function() {
			Settings.save('sso-wordpress', $('.sso-wordpress-settings'), function() {
				alerts.alert({
					type: 'success',
					alert_id: 'sso-wordpress-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});