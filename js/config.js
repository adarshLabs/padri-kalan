// ============================================================
//  SITE SETTINGS — edit these after you create your GitHub repo
//  साइट सेटिंग — GitHub repo बनाने के बाद इन्हें बदलें
// ============================================================
window.SITE_CONFIG = {
  // Your GitHub username and repo name, e.g. "adarsh" and "padri-kalan"
  githubUser: "adarshlabs",
  githubRepo: "padri-kalan",

  // SUGGESTION FORM (villagers need no account).
  // Paste your Cloudflare Worker address here, e.g. "https://padri-kalan-form.yourname.workers.dev".
  // Each message then becomes an issue in your PRIVATE GitHub repo. Setup: worker/SETUP.md
  suggestionsUrl: "https://padri-kalan-form.adarshlabs.workers.dev",

  // Alternative (not used if suggestionsUrl is set): a Web3Forms key, which sends messages by email.
  web3formsKey: "",

  // Optional: an email shown on the Contribute page for sending photos. Leave "" to hide it.
  // Note: whatever you put here is public on the website.
  contactEmail: "",

  // Optional fallback: a Google Form link, used only if web3formsKey is empty.
  contributeFormUrl: ""
};
