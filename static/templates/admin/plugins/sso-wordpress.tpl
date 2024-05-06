<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
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
				<div class="mb-3">
					<label class="form-label" for="url">Site URL</label>
					<input type="text" name="url" id="url" title="Site URL" class="form-control" placeholder="http://example.com" />
					<p class="form-text">
						There is no need to add a trailing slash to this value (e.g. Use <code>http://example.com</code>, not <code>http://example.com/</code>)
					</p>
				</div>
				<div class="mb-3">
					<label class="form-label" for="id">Client ID</label>
					<input type="text" name="id" id="id" title="Client ID" class="form-control" placeholder="Client ID" />
				</div>
				<div class="mb-3">
					<label class="form-label" for="secret">Client Secret</label>
					<input type="text" name="secret" id="secret" title="Client Secret" class="form-control" placeholder="Client Secret"/ >
				</div>
				<div class="form-check">
					<input class="form-check-input" type="checkbox" id="redirectEnabled" name="redirectEnabled">
					<label class="form-check-label" for="redirectEnabled">Automatically redirect guests to Wordpress SSO</label>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
