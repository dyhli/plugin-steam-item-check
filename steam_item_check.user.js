// ==UserScript==
// @namespace       https://github.com/dyhli/
// @name            TF2 Item check
// @description     Checks if incoming trade offers actually contain TF2 items and marks those that are not

// @homepageURL     https://github.com/dyhli/plugin-steam-item-check
// @supportURL      https://github.com/dyhli/plugin-steam-item-check/issues
// @downloadURL     https://github.com/dyhli/plugin-steam-item-check/raw/master/steam_item_check.user.js

// @author          dyhli
// @version         1.0
// @license         MIT

// @grant           GM_addStyle

// @run-at          document-end
// @match https://steamcommunity.com/*/tradeoffers*
// ==/UserScript==

/*
 * ------------------------------
 * CONFIGURATION
 * ------------------------------
 *
 * Feel free to modify this part to your needs.
 */

// Here we define the apps (games) with their app ID to verify
const LegitimateApps = {
    440: 'Team Fortress 2',
    570: 'DOTA 2',
    730: 'CS:GO',
    753: 'Steam'
};

/*
 * ------------------------------
 * EDIT WITH CAUTION
 * ------------------------------
 *
 * Don't touch this part if you don't know what you're doing.
 */

let onAjaxComplete = null;

// Look for trade offers
const TradeOffers = jQuery('.tradeoffer');

// Loop through offers and checks items
TradeOffers.each(function () {
    processOffer(jQuery(this));
});

// Trade item has been hovered
jQuery('.trade_item').hover(function () {
    processItemHover(jQuery(this));
}, function () {
    jQuery('.economyitem_hover .item-scan-result').remove();
});

/**
 * Process a single offer
 *
 * @param offer
 */
function processOffer (offer)
{
    let unknownItems = 0;
    const Items = offer.find('.trade_item');

    // Process items
    Items.each(function () {
        const Item = jQuery(this);
        const App = getLegitimateAppFromItem(Item);

        if(App !== null) {
            Item.addClass('app' + App);
        } else {
            unknownItems++;
        }

        Item.addClass('is-app');
    });

    let alertHtml = '';
    // Does this trade offer have any unknown items?
    if(unknownItems === 0) {
        alertHtml = `
            <div class="global-tradeoffer-alert alert-ok">
                &check; This trade offer contains legitimate items only.
            </div>
        `;
    } else {
        alertHtml = `
            <div class="global-tradeoffer-alert alert-error">
                &times; This trade contains ${unknownItems} item(s) that may not be legitimate!
            </div>
        `;
    }

    // Show alert
    offer.find('.tradeoffer_items_ctn').prepend(alertHtml);
}

/**
 * Item has been hovered
 *
 * @param item
 */
function processItemHover (item)
{
    onAjaxComplete = null;
    const App = getLegitimateAppFromItem(item);

    let html = '';

    // app is not in the legitimate apps list
    if(App === null) {
        html = `
        <div class="item-scan-result result-error">
            &times; This item does NOT belong to any of the following games: 
            ${Object.values(LegitimateApps).join(', ')}
        </div>`;
    } else {
        // Looks good!
        html = `<div class="item-scan-result result-ok">&check; This item belongs to ${LegitimateApps[App]}</div>`;
    }

    // Execute this function after XMLHttpRequest completes.
    // very dirty, I know lol, but hey, it works
    onAjaxComplete = function () {
        if(jQuery('.economyitem_hover .item-scan-result').length === 0) {
            jQuery(html).prependTo('.economyitem_hover .item_desc_description');
        }
    };
    if(jQuery.active === 0) onAjaxComplete();
}

/**
 * Checks if an item actually belongs to one of the legitimate apps
 *
 * @param item
 * @return ?{number}
 */
function getLegitimateAppFromItem (item)
{
    const EconomyItem = item.data('economy-item');
    if(!EconomyItem) return null;

    for(let k in LegitimateApps) {
        if(EconomyItem.indexOf('/' + k + '/') !== -1) return k;
    }

    return null;
}

/*
 * ------------------------------
 * CSS
 * ------------------------------
 *
 * Adding some prettyness to everything!
 */
const CSS = `
.trade_item.is-app:before {
    content: "";
    position: absolute;
    background-image: url(https://i.imgur.com/FrGrPhC.png);
    width: 24px;
    height: 24px;
    background-size: 18px;
    background-repeat: no-repeat;
    bottom: -3px;
    left: 3px;
}

.trade_item.app440:before { background-image: url(https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/440/e3f595a92552da3d664ad00277fad2107345f743.jpg); }
.trade_item.app570:before { background-image: url(https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/570/0bbb630d63262dd66d2fdd0f7d37e8661a410075.jpg); }
.trade_item.app730:before { background-image: url(https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/730/69f7ebe2735c366c65c0b33dae00e12dc40edbe4.jpg); }
.trade_item.app753:before { background-image: url(https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/753/135dc1ac1cd9763dfc8ad52f4e880d2ac058a36c.jpg); }

.global-tradeoffer-alert,
.economyitem_hover .item-scan-result {
    padding: 1em;
    font-weight: bold;
    margin-bottom: 1em;
    color: #fff;
}
.global-tradeoffer-alert.alert-ok,
.economyitem_hover .item-scan-result.result-ok {
    background-color: #5c7e10;
}
.global-tradeoffer-alert.alert-error,
.economyitem_hover .item-scan-result.result-error {
    background-color: #d23333;
}
`;

GM_addStyle(CSS);

/*
 * ------------------------------
 * UNDER THE HOOD
 * ------------------------------
 *
 * Some under the hood things to take care of things.
 */
jQuery(document).ajaxComplete(() => {
    if(onAjaxComplete !== null) {
        setTimeout(onAjaxComplete, 250);
    }
})