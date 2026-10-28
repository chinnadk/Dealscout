import React from "react";

// Preserve the publisher's SiteStripe destination, including its tracking ID.
export const affiliatePicks=[{
 id:"amazon-B08V1TYPV9",
 title:"Acnos women's rose-gold analogue watch",
 url:"https://www.amazon.in/Acnos-Analogue-Rose-Gold-Rosegold-Bracelet/dp/B08V1TYPV9?dib=eyJ2IjoiMSJ9.DAFbMXQZGZ-4GvDZbp81G8_Nfr0-2Wvo2z-jrTpWNGHGjHj071QN20LucGBJIEps.2o1T1ASZnFQHVgJx8irt_2_tUhv0VwMKABRK9LPcC28&dib_tag=se&keywords=Apparel%2C+bags+and+watches&qid=1793202139&refinements=p_n_feature_fourteen_browse-bin%3A11142592031&rnid=11142591031&sr=8-1&linkCode=ll2&tag=cartwatch-21&linkId=312cd172eb5b2a9ddc3463366ef95463&ref_=as_li_ss_tl",
}];
export const amazonDisclosure="As an Amazon Associate I earn from qualifying purchases.";
const h=React.createElement;

export function AffiliatePicks(){return h("section",{id:"affiliate-picks",className:"affiliate-picks","aria-labelledby":"affiliate-picks-title"},
 h("div",{className:"section-heading"},h("div",null,
  h("div",{className:"eyebrow section-eyebrow"},h("span"),"A LITTLE SOMETHING TO EXPLORE"),
  h("h2",{id:"affiliate-picks-title"},"A watch for your shortlist."),
  h("p",null,"A selected Amazon listing, with a few questions to ask before you buy."))),
 ...affiliatePicks.map(pick=>h("article",{className:"affiliate-pick",key:pick.id},
  h("div",{className:"pick-art","aria-hidden":true},
   h("svg",{viewBox:"0 0 120 160",fill:"none"},h("path",{d:"M45 12h30l5 40H40l5-40Zm-5 96h40l-5 40H45l-5-40Z",fill:"#c6b6a7"}),h("rect",{x:28,y:45,width:64,height:70,rx:23,fill:"#dfc8b3",stroke:"#9e8169",strokeWidth:2}),h("circle",{cx:60,cy:80,r:23,fill:"#fbf7ef",stroke:"#b99d82",strokeWidth:2}),h("path",{d:"M60 62v18l12 8M60 59v3m21 18h-3m-18 21v-3M39 80h3",stroke:"#70634f",strokeWidth:3,strokeLinecap:"round"})),
   h("span",null,"Category illustration")),
  h("div",{className:"pick-copy"},h("span",{className:"pick-label"},"AMAZON · WATCHES · AFFILIATE PICK"),h("h3",null,pick.title),
   h("p",null,"If you are considering this watch, look beyond the style. Check the bracelet measurements and clasp, whether adjustment is needed, and the seller's return and warranty terms."),
   h("ul",null,h("li",null,"Match the colour and variant on the listing."),h("li",null,"Confirm the final price and delivery at checkout.")),
   h("a",{className:"primary pick-cta",href:pick.url,target:"_blank",rel:"sponsored noopener noreferrer"},"Check price on Amazon",h("span",{"aria-hidden":true}," ↗")),
   h("p",{className:"pick-disclosure"},"Affiliate link. ",amazonDisclosure),
   h("p",{className:"pick-note"},"We have not tested this watch. Current price, stock and price history are not verified here."))))
 );}
