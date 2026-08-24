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

export const documentdbVsCodeExtensionMarketplaceUrl =
  'https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-documentdb';

// Deep link into the extension's DocumentDB Local setup wizard.
//
// The path names the action; an empty path means "connect", which is what every link published
// before the extension supported actions relies on. See the extension's
// docs/user-manual/how-to-construct-url.md for the full vocabulary.
//
// Requires the extension to be installed: a `vscode://` URL for an absent extension does nothing
// visible at all, so never present this without the marketplace link beside it.
export const documentdbVsCodeLocalQuickStartDeepLink =
  'vscode://ms-azuretools.vscode-documentdb/local';
