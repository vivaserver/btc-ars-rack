//! version : 0.0.0
//! authors : Cristian R. Arroyo <cristian.arroyo@vivaserver.com>
//! license : MIT
//! digicoins.enmicelu.com

var DigiCoins = function() {
  var updateCache = function(data) {
    console.log(data);
    if (localStorage["current.data"]) {
      localStorage["previous.data"] = localStorage["current.data"];
      localStorage["previous.time"] = localStorage["current.time"];
    }
    localStorage["current.data"] = JSON.stringify(data);
    localStorage["current.time"] = new Date().toJSON();
  };

  var cached = function(key) {
    var cache = localStorage[(key || "current")+".data"];
    if (cache !== undefined) {
      return JSON.parse(cache);
    }
  };

  var isExpired = function() {
    var cache = cached();
    if (cache === undefined) {
      return true;
    }
    else {
      return lapseExpired(cache) > 14;  // in minutes
    }
  };

  var lapseExpired = function(cache) {
    var then  = moment(localStorage["current.time"]), now = moment();
    var diff  = moment(now).diff(moment(then));
    var lapse = moment.duration(diff).asMinutes();
    console.log(lapse);
    return lapse;
  };

  return $.extend(DigiCoins || {}, {  // use prev. DigiCoins obj. to inject more props.
    cache: function(key) {
      return cached(key || "current");
    },
    update: function($el) {
      if (isExpired()) {
        $.ajax({
          dataType: "json",
          type: "GET",
          url: "https://digicoins.tk/ajax/get_prices",
          success: function(data) {
            if (data.result == "OK") {
              updateCache(data);
              $el.trigger("data:change",cached());  // NOTE: plain obj. as argument to event handler; same as jQuery?
            }
          },
          error: function(xhr, type) {
            console.log(type);  // "abort"
            $el.trigger("data:error");
          }
        });
      }
    }
  });
}();

var app = function() {
  var $buy, $sell, $time;

  var boot = function() {
    var data = DigiCoins.cache();
    if (data === undefined) {  // use hard-coded cache data to boot from
      localStorage["current.data"] = DigiCoins.boot_cache["current.data"];
      localStorage["current.time"] = DigiCoins.boot_cache["current.time"];
      data = DigiCoins.cache();
    }
    renderQuotes(data);  // mind some sensible HTML for empty data
  };

  var renderQuotes = function(data) {
    var previous = DigiCoins.cache("previous"), prev = {buy: {}, sell: {}};
    if (previous) {
      prev.buy.usd  = previous.btcusdask;
      prev.buy.ars  = previous.btcarsask;
      prev.sell.usd = previous.btcusdbid;
      prev.sell.ars = previous.btcarsbid;
    }
    renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.qoutestime}, prev.buy);
    renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.quotestime}, prev.sell);
  };

  var toString = function(value) {
    return numeral(value).format("0,0.00");  // format according to numeral.language()
  };

  var renderDelta = function($id, quote, prev) {
    $id.removeClass("badge-negative").removeClass("badge-positive");
    switch (true) {  // ref. http://stackoverflow.com/a/21808629
      case (prev > quote):
        $id.addClass("badge-negative").show().text(toString(prev-quote)+" ↓");
      break;
      case (prev < quote):
        $id.addClass("badge-positive").show().text(toString(quote-prev)+" ↑");
      break;
      default:
        $id.show().text("=");
      break;
    }
  };

  var renderQuote = function($id, quote, prev) {
    var time = moment(localStorage["current.time"]), blu = quote.ars/quote.usd;
    // USD
    numeral.language("en");
    $id.find(".usd").text(toString(quote.usd));
    if (prev.usd) {
      renderDelta($id.find(".delta-usd"),quote.usd,prev.usd);
    }
    // ARS
    numeral.language("es");
    $id.find(".ars").text(toString(quote.ars));
    $id.find("span.blu").text(toString(blu)+" x USD");
    if (prev.ars) {
      renderDelta($id.find(".delta-ars"),quote.ars,prev.ars);
    }
    //
    $time.text(time.format("l")+" ("+time.fromNow()+")");  // "30/6/214 (hace 3 días)"
  };

  var setEvents = function($el) {  // custom events
    $el.on("data:change",function(el,data) {
      $time.removeClass("error");
      renderQuotes(data);
    });
    $el.on("data:error",function(el,data) {
      $time.addClass("error");
    });
    setInterval(function() {
      DigiCoins.update($el);
    },15*60*1000);  // 15' in miliseconds
  };

  return {
    init: function($el) {
      moment.lang("es");
      $buy  = $el.find("span#buy");
      $sell = $el.find("span#sell");
      $time = $el.find("p#time");
      setEvents($el);
      boot();
      DigiCoins.update($el);
    }
  };
}();

$(document).ready(function() {
  app.init($(".content"));
});
