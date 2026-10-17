export const documentdbDiscordUrl = 'https://discord.gg/vH7bYu524D';

// The operator docs are versioned as /<version-or-alias>/preview/..., where
// `preview` is the content root inside a version, not a version itself. The
// `latest` alias keeps this following operator releases.
//
// Every call site labels this link "Open quick start", so it points at the
// quick start rather than the docs home. Linking the page directly also avoids
// the redirect stubs at /documentdb-kubernetes-operator/ and .../latest/, which
// are meta refreshes that only browsers follow.
export const documentdbKubernetesOperatorQuickStartUrl =
  'https://documentdb.io/documentdb-kubernetes-operator/latest/preview/getting-started/quickstart-kind/';

export const documentdbKubernetesOperatorGitHubUrl =
  'https://github.com/documentdb/documentdb-kubernetes-operator';

export const documentdbVsCodeLocalQuickStartDeepLink =
  'vscode://ms-azuretools.vscode-documentdb/local';

// Where the 1.0 banner sends readers: a site-root path or an absolute URL.
// blogs/_config.yml holds the same target as `release_announcement_url`,
// relative to the blog.
export const documentdbReleaseAnnouncementUrl = '/blogs/posts/documentdb-1-0/';

// The one link to promote for 1.0; the site and blog banners point here.
export const documentdbReleasePageUrl = '/v1/';

export const documentdbLocalPrivacyUrl =
  'https://github.com/documentdb/documentdb/blob/v1.0-0/documentdb-local/PRIVACY.md';
