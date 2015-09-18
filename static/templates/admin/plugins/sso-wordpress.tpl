<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">Wordpress SSO</div>
	<div class="col-sm-10 col-xs-12">
		<div class="alert alert-info">
			<ol>
				<li>
					This SSO plugin allows you to enable Single Sign-On with a
					custom Wordpress installation.
				</li>
				<li>
					Some notes:
					<ul>
						<li>
							You must download and install the
							<a href="https://wp-oauth.com/">WP OAuth Server</a>
							plugin for your Wordpress installation.
						</li>
						<li>
							In the OAuth Server plugin settings, you will need
							to create a new OAuth client for your NodeBB
							install. This is how you get the Client ID and
							Secret.
						</li>
						<li>
							Ensure that you have permalink settings enabled.
							You may need to update your web server settings to
							do so. <a href="http://nginxlibrary.com/wordpress-permalinks/">
							More Information</a>
						</li>
					</ul>
				</li>
			</ol>
		</div>
		<form role="form" class="sso-wordpress-settings">
			<div class="form-group">
				<label for="url">Site URL</label>
				<input type="text" name="url" id="url" title="Site URL" class="form-control" placeholder="http://example.com" />
				<p class="help-block">
					There is no need to add a trailing slash to this value (e.g. Use <code>http://example.com</code>, not <code>http://example.com/</code>)
				</p>
			</div>
			<div class="form-group">
				<label for="id">Client ID</label>
				<input type="text" name="id" id="id" title="Client ID" class="form-control" placeholder="Client ID" />
			</div>
			<div class="form-group">
				<label for="secret">Client Secret</label>
				<input type="text" name="secret" id="secret" title="Client Secret" class="form-control" placeholder="Client Secret"/ >
			</div>
		</form>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>