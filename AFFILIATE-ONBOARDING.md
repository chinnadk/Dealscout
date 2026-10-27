# Affiliate onboarding for DealScout

Prepared 27 October 2026. No affiliate account or product feed is connected. Adding pages or deploying this application does not guarantee account approval.

## 1. Review the public website

The site now includes ten original shopping guides, About, Privacy, Affiliate Disclosure, and a price-comparison methodology page. Articles are readable in HTML without JavaScript. The catalog remains a clearly labeled demonstration, not live retailer offers or hands-on product reviews. Read and edit the guides so they represent what you want to publish.

The publisher selected `chinnadk@gmail.com` for the public Contact page. Its default is recorded in `lib/site-info.mjs`. To change it, update that file or override it with Render build-time environment variable `PUBLIC_CONTACT_EMAIL`, then rebuild and deploy. It is intentionally public. Optional `PUBLIC_SITE_URL` sets the canonical origin and sitemap if you later connect a domain. It defaults to the current Render URL. Regenerate pages by rebuilding after either changes.

The article index is `/guides`, with real `/guides/<slug>` pages. Public method and information pages are `/about`, `/privacy`, `/affiliate-disclosure`, and `/how-we-track-prices`. The build writes `robots.txt` and `sitemap.xml`. These measures help discoverability; they do not establish eligibility or ranking.

## 2. Apply to Amazon India Associates

Use https://affiliate-program.amazon.in/ and apply using the actual publicly accessible website you control. Use your own truthful payee, tax, bank, and contact information in Amazon's official forms. Keep those details out of chat and GitHub.

Amazon India's application-review guidance says substantive original content should remain useful without advertisements; roughly ten posts is its rule of thumb. It also describes at least three qualifying sales within the first 180 days before review, excluding personal orders. These are application-review requirements, not an approval promise or a statement that API access is immediate.

Official guidance: https://affiliate-program.amazon.in/help/node/topic/G8TW5AE9XL2VX9VM

Once your dashboard provides valid affiliate links, use the links as supplied and add the applicable merchant disclosure before publishing them. Avoid inventing tracking IDs or adding someone else's tag.

## 3. Confirm API eligibility separately

Creators API onboarding documentation describes final acceptance, qualified sales, application registration, and account-owner credentials. Marketplace eligibility and the options shown in your actual India dashboard must be confirmed. Do not assume that joining Associates automatically supplies product-feed access.

Official registration guidance: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api

Amazon's API documentation limits caching of offer information and other resources. A historical-price database must not be enabled using Amazon API content until the intended retention and display are permitted. Obtain written clarification where needed; the generic daily-snapshot implementation is not a representation that every merchant permits that use.

Official practices: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/best-programming-practices

## 4. Confirm Flipkart registration and feed access

Check https://affiliate.flipkart.com/registerme for current registration availability. The presence of an old API documentation page does not prove that new applicants are currently accepted. If registration or the API Token page is unavailable, contact Flipkart through its official support channel.

For an accepted account with API access, the official documentation identifies `Fk-Affiliate-Id` and `Fk-Affiliate-Token` headers. Keep tokens on the server. Verify allowed storage, display, traffic sources, and retention before integrating a feed. Do not generate or rotate credentials unnecessarily.

Official API documentation: https://affiliate.flipkart.com/api-docs/af_register.html
Official terms: https://affiliate.flipkart.com/terms-and-conditions

Flipkart's terms include a Telegram prohibition in their influencer provisions. No Telegram posting is implemented here. A website redirect should not be treated as permission to use an otherwise prohibited traffic source.

## 5. Connect a permitted feed

The existing protected `/api/products` and `/api/prices` routes and `scripts/import-feed.mjs` accept normalized records. They are not an Amazon or Flipkart API client. They require your own server-side `PRICE_INGEST_TOKEN`, exact product identities, integer paise, and actual observation timestamps. Demo listings reject live writes.

Only import data you are entitled to obtain, retain, and display. Preserve provider-generated destination links. Do not manufacture yesterday's prices. Determine account-specific retention, refresh, disclosure, and timestamp requirements before turning on live imports. Credentials belong in Render's environment settings, never in frontend code or a public file.

Daily polling and Telegram automation have not been configured. They should be designed after the authorized feed and its limits are known. Render's free service sleeps; a background timer inside it is not a reliable daily job scheduler.
