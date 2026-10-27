import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {guides,guidePath,editorialDate} from "../lib/editorial.mjs";
import {publicContactEmail} from "../lib/site-info.mjs";

const h=React.createElement;
const root=resolve("node-dist");
const manifest=JSON.parse(await readFile(resolve(root,".vite/manifest.json"),"utf8"));
const styles=manifest["index.html"].css||[];
const origin=new URL(process.env.PUBLIC_SITE_URL||"https://dealscout-pjkc.onrender.com").origin;
const contact=(process.env.PUBLIC_CONTACT_EMAIL||publicContactEmail).trim();
if(contact&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contact))throw new Error("PUBLIC_CONTACT_EMAIL must be a valid public email address.");
const p=text=>h("p",null,text);
const link=(path,label)=>h("a",{href:path},label);
const list=items=>h("ul",null,...items.map(text=>h("li",{key:text},text)));
function brand(){return h("a",{className:"brand",href:"/","aria-label":"DealScout home"},h("span",{className:"brand-mark"},"↗"),"deal",h("span",{className:"brand-light"},"scout"),h("span",{className:"brand-dot"},"."));}
function shell(path,title,description,body){
 return "<!doctype html>"+renderToStaticMarkup(h("html",{lang:"en"},h("head",null,
  h("meta",{charSet:"utf-8"}),h("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),
  h("title",null,`${title} | DealScout`),h("meta",{name:"description",content:description}),
  h("link",{rel:"canonical",href:origin+path}),h("link",{rel:"icon",href:"/dealscout.svg"}),
  ...styles.map(href=>h("link",{key:href,rel:"stylesheet",href:`/${href}`})),
  h("meta",{property:"og:title",content:title}),h("meta",{property:"og:description",content:description}),h("meta",{property:"og:url",content:origin+path})
 ),h("body",{className:"editorial-page"},
  h("header",{className:"site-header"},h("div",{className:"header-inner"},brand(),h("nav",{"aria-label":"Main navigation"},link("/","Discover"),link("/guides","Buying guides"),link("/how-we-track-prices","Our method")))),
  h("main",{className:"container editorial-main",id:"main-content"},h("div",{className:"editorial-breadcrumb"},link("/","Home")," / ",link("/guides","Shopping guides")),...body),
  h("footer",null,h("div",{className:"container editorial-footer"},brand(),h("nav",{"aria-label":"Footer navigation"},link("/about","About"),link("/guides","Buying guides"),...(contact?[link("/contact","Contact")]:[]),link("/privacy","Privacy"),link("/affiliate-disclosure","Affiliate disclosure"))),h("div",{className:"container footer-bottom"},h("span",null,"© 2026 DealScout. Independent shopping guides."),h("span",null,"Demo offers are illustrative. Confirm current retailer prices.")))
 )));
}
function titleBlock(kicker,title,summary){return h("div",{className:"editorial-title"},h("span",{className:"eyebrow section-eyebrow"},kicker),h("h1",null,title),p(summary));}
function cards(items){return h("div",{className:"guide-grid"},...items.map((guide,i)=>h("a",{className:"guide-card",href:guidePath(guide),key:guide.slug},h("div",{className:"guide-card-top"},h("span",null,guide.category),h("span",null,String(i+1).padStart(2,"0"))),h("h2",null,guide.title),p(guide.summary),h("span",{className:"guide-read"},"Read the guide ↗"))));}
const pages=[];
function add(path,title,description,body){pages.push({path,html:shell(path,title,description,body)});}
add("/guides","Make your next purchase a little smarter","Original guides to comparing offers, understanding price history, and choosing a suitable purchase.",[
 titleBlock("THE DEALSCOUT READING ROOM","A little homework. A better buy.","Clear questions, useful checklists, and fewer surprises at checkout. Start with what matters to you."),
 h("div",{className:"editorial-intro-note"},"These are shopping guides, not hands-on product reviews. We do not claim to have tested the products shown in our demonstration catalog."),cards(guides),
]);
for(const guide of guides){
 add(guidePath(guide),guide.title,guide.summary,[
  titleBlock(guide.category.toUpperCase(),guide.title,guide.summary),
  h("div",{className:"article-meta"},h("span",null,"By DealScout editorial"),h("time",{dateTime:editorialDate},"Published 27 October 2026")),
  h("div",{className:"article-layout"},h("article",{className:"article-body"},p(guide.intro),...guide.sections.map(s=>h("section",{key:s.title},h("h2",null,s.title),p(s.text))),h("aside",{className:"article-checklist"},h("h2",null,"Take this checklist with you"),list(guide.checklist)),h("p",{className:"article-editor-note"},"This guide explains a shopping method. It does not verify any current offer or promise savings. Check the retailer's current listing and checkout conditions.")),h("aside",{className:"article-sidebar"},h("span",{className:"eyebrow section-eyebrow"},"KEEP EXPLORING"),...guides.filter(g=>g.slug!==guide.slug).slice(0,3).map(g=>h("a",{key:g.slug,href:guidePath(g)},g.title," ↗")),link("/how-we-track-prices","How our price comparison works ↗"))),
 ]);
}
add("/about","About DealScout","Why DealScout exists, what we publish, and the current status of our catalog.",[
 titleBlock("HELLO, WE'RE DEALSCOUT","For the joy of a good find.","We help shoppers in India ask better questions before they buy."),
 h("article",{className:"article-body standalone-article"},p("DealScout is an independent shopping-information website. Our guides explain how to compare exact product variants, read offer conditions, understand price movements, and check the complete purchase cost."),h("h2",null,"What you can use today"),p("Read our original guides and use the storefront's search, filters, saved deals, and sample price-history views to understand the experience. Saved deal IDs remain in your browser."),h("h2",null,"A clear distinction between examples and offers"),p("The current storefront contains eight demonstration products, fixed illustrative price observations dated 21–27 October 2026, and illustrative photographs. These are not verified retailer offers. We have not connected an Amazon or Flipkart affiliate account or live product feed."),h("h2",null,"Our publishing approach"),p("We write practical explanations rather than claiming personal product testing we have not performed. Explanatory price examples are identified as examples. When a mistake is found, the aim is to correct it and make the underlying comparison clear."),h("h2",null,"Our independence"),p("DealScout is not operated by Amazon or Flipkart. Purchases take place on the retailer's website. Retailers and sellers determine their own prices, stock, delivery, return conditions, and warranty arrangements."),link("/guides","Explore the buying guides →")),
]);
add("/how-we-track-prices","How our price comparison works","The exact listing, observation dates, IST calendar days, and calculations behind our demonstration price history.",[
 titleBlock("OUR METHOD","A price deserves some context.","Here is how a daily comparison is calculated, and what the current demonstration can tell you."),
 h("article",{className:"article-body standalone-article"},h("h2",null,"One record belongs to one exact listing"),p("Each product ID represents one retailer listing and variant. Different sellers or variants should not be combined to create an apparent price change."),h("h2",null,"Calendar days use India Standard Time"),p("Each valid observation is assigned to its Asia/Kolkata calendar date. The latest observation within that day is used. A daily comparison uses the immediately preceding calendar date; it does not substitute an older observation for a missing yesterday."),h("h2",null,"Daily change and MRP discount are separate"),p("Daily decrease = (yesterday's observed price − today's observed price) ÷ yesterday's observed price × 100. MRP discount uses MRP as the reference instead. Prices are represented as integer paise to avoid currency rounding during storage."),h("h2",null,"Missing data stays missing"),p("If yesterday has no record, there is no daily percentage to claim. If today has no record, the last observed value can be shown with its date, but it is not described as today's verified offer. Lowest recorded refers to the observations available in this dataset."),h("h2",null,"What is live today"),p("The database connection is live, but the product catalog remains a demonstration. Observations are fixed to 21–27 October 2026 and do not roll forward as fresh deals. Authorized retailer feeds and affiliate accounts have not yet been connected. Any future feed's display and retention rules must be reviewed before its data is used for historical comparisons."),link("/guides/read-price-history-responsibly","Read the price-history guide →")),
]);
add("/affiliate-disclosure","Affiliate disclosure","The current status of retailer links, commissions, and demonstration offers on DealScout.",[
 titleBlock("A LITTLE TRANSPARENCY","How retailer links work.","You should know when a recommendation could earn a commission."),
 h("article",{className:"article-body standalone-article"},p("DealScout currently has no connected Amazon Associates or Flipkart affiliate account. The demonstration catalog uses ordinary retailer search links and does not earn affiliate commissions."),h("h2",null,"Before affiliate links are enabled"),p("If we join an affiliate program, we will identify paid links, publish the applicable merchant disclosure, and explain that qualifying purchases may earn us a commission at no extra cost to you. Adding a tracking link is not evidence that an account is approved or a commission will be earned."),h("h2",null,"Examples and photographs"),p("Sample prices, price histories, descriptions, and photos in the demonstration are illustrative. A photo may show a different model or variant. They should not be relied on as a current retailer listing or verified saving."),h("h2",null,"Your purchase"),p("Confirm the exact product, seller, final price, availability, delivery, and purchase conditions directly with the retailer. DealScout does not take payment or fulfil orders. Our shopping guides explain decision methods and are not hands-on product reviews.")),
]);
add("/privacy","Privacy information","How DealScout uses browser storage, product click records, and third-party assets.",[
 titleBlock("YOUR FINDS. YOUR BUSINESS.","What this website stores.","This page describes the features currently implemented on DealScout."),
 h("article",{className:"article-body standalone-article"},h("h2",null,"Saved deals"),p("Saved product IDs are stored in this browser's local storage. They are not synced to an account. Clear this website's browser data to remove the saved list. No email address or profile is needed for this feature."),h("h2",null,"Product clicks"),p("Opening a retailer link sends the product ID to our server and records it with a timestamp. The application's click record does not intentionally include a visitor account ID, IP address, or browser fingerprint. It is a raw count, not evidence of a purchase or affiliate earnings."),h("h2",null,"Hosting and database"),p("Render hosts the public Node.js website, and Neon stores its PostgreSQL product, price, and click records. These providers may maintain operational or security logs under their own policies. Product price history is about listings, not an individual shopper's purchases."),h("h2",null,"External assets and links"),p("Illustrative photographs load from Unsplash, and fonts may load from Google Fonts. Those requests share the network information necessary to deliver the asset. Retailer links take you to separate websites with their own privacy practices."),h("h2",null,"Current collection limits"),p("This version has no newsletter subscription, visitor login, checkout, or contact form. No advertising analytics or cross-site advertising tracker has been intentionally added to the application. Hosting access logs are separate from the application records described here."),...(contact?[h("h2",null,"Questions"),p("For a question about these practices, use the public contact address on our Contact page."),link("/contact","Contact DealScout →")]:[])),
]);
if(contact)add("/contact","Contact DealScout","Contact the publisher about a guide, a listing correction, or the DealScout website.",[
 titleBlock("LET'S MAKE THIS MORE USEFUL","Contact DealScout.","Questions, corrections, and thoughtful suggestions are welcome."),
 h("article",{className:"article-body standalone-article"},p("For a correction to a guide or demonstration listing, please include the page address and explain which detail needs checking. Avoid sending passwords, account credentials, payment information, or other private account data."),h("a",{className:"primary",href:`mailto:${contact}`},contact),h("h2",null,"Orders and retailer accounts"),p("DealScout does not sell or fulfil products. For an order, return, delivery, warranty, or retailer-account problem, contact the retailer or seller through its official support channel.")),
]);
for(const page of pages){const folder=resolve(root,page.path.slice(1));await mkdir(folder,{recursive:true});await writeFile(resolve(folder,"index.html"),page.html,"utf8");}
// Keep useful original content and working links in the initial homepage HTML,
// including for readers whose browser has not loaded the interactive frontend.
const homepage=resolve(root,"index.html");
const fallback=renderToStaticMarkup(h("div",{id:"root"},h("main",{className:"container editorial-main"},
 titleBlock("INDEPENDENT SHOPPING GUIDES","Good finds. Great prices.","Practical guides to comparing retailer offers, matching product variants, and understanding price history."),
 h("p",{className:"editorial-intro-note"},"The interactive catalog contains clearly labeled demonstration prices. Live retailer feeds and affiliate programs are not connected."),
 h("p",{className:"editorial-breadcrumb"},link("/guides","Read all ten original shopping guides")," · ",link("/about","About DealScout")," · ",link("/how-we-track-prices","Our comparison method")),
 cards(guides.slice(0,3))
)));
await writeFile(homepage,(await readFile(homepage,"utf8")).replace('<div id="root"></div>',fallback));
const sitemap=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/",...pages.map(p=>p.path)].map(path=>`<url><loc>${origin}${path}</loc><lastmod>${editorialDate}</lastmod></url>`).join("")}</urlset>`;
await writeFile(resolve(root,"sitemap.xml"),sitemap);
await writeFile(resolve(root,"robots.txt"),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Built ${pages.length} public pages, including ${guides.length} original guides${contact?" and Contact":""}.`);
