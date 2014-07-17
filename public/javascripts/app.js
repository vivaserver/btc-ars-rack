//! version : 0.0.2
//! authors : Cristian R. Arroyo <cristian.arroyo@vivaserver.com>
//! license : MIT
//! digicoins.enmicelu.com

var app = function() {
  var $el, cache_timeout = 10;  // in minutes

  var DigiCoins = function() {
    var updateCache = function(data) {
      if (localStorage["current.data"]) {
        localStorage["previous.data"] = localStorage["current.data"];
        localStorage["previous.time"] = localStorage["current.time"];
      }
      localStorage["current.data"] = JSON.stringify(data);
    };

    var timeStamp = function(data, same_time) {  // always like "2014-07-09T17:13:34.553Z"
      if (same_time === true) {
        return data.pricestime.replace(" ","T").substr(0,23)+"Z";
      }
      else {
        return new Date().toJSON();
      }
    };

    var updateFrom = function(uri, same_time) {
      $.ajax({
        dataType: "json",
        type: "GET",
        url: uri, 
        success: function(data) {
          if (data.result == "OK") {
            updateCache(data);
            localStorage["current.time"] = timeStamp(data,same_time);
            $el.trigger("data:change",data);  // NOTE: plain obj. as argument to event handler; same as jQuery?
          }
        },
        error: function(xhr, type) {
          console.log(type);  // "abort"
          $el.trigger("data:error");
        }
      });
    };

    var cached = function(key) {
      var cache = localStorage[key+".data"];
      if (cache === undefined) {
        if (key == "current") {                        // no current cache, fallback to static cache
          updateFrom("/javascripts/cache.json",true);  // use cache timestamp
        }
      }
      else {
        return JSON.parse(cache);
      }
    };

    var isExpired = function() {
      var cache = cached("current");
      if (cache === undefined) {
        return true;
      }
      else {
        return lapseExpired() > cache_timeout-1;
      }
    };

    var lapseExpired = function() {
      var then  = moment(localStorage["current.time"]), now = moment();
      var diff  = moment(now).diff(moment(then));
      var lapse = moment.duration(diff).asMinutes();
      return lapse;
    };

    return {
      cache: function(key) {
        return cached(key || "current");
      },
      update: function() {
        if (isExpired()) {
          updateFrom("https://digicoins.tk/ajax/get_prices");
        }
      }
    };
  }();

  var Home = function() {
    var $buy, $sell, $time;

    var renderQuotes = function(data) {
      var previous = DigiCoins.cache("previous"), prev = {buy: {}, sell: {}};
      if (previous) {
        prev.buy.usd  = previous.btcusdask;
        prev.buy.ars  = previous.btcarsask;
        prev.sell.usd = previous.btcusdbid;
        prev.sell.ars = previous.btcarsbid;
      }
      if (data) {
        renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.qoutestime}, prev.buy);
        renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.quotestime}, prev.sell);
      }
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

    return {
      init: function($el) {
        $buy  = $el.find("span#buy");
        $sell = $el.find("span#sell");
        $time = $el.find("p#time");
      },
      error: function(truthy) {
        if (truthy) {
          $time.addClass("error");
        }
        else {
          $time.removeClass("error");
        }
      },
      render: function(data) {
        renderQuotes(data);
      }
    };
  }();

  return {
    init: function($elem) {
      var data;

      moment.lang("es");

      $el = $elem;
      $el.on("data:change",function(el,data) {
        Home.error(false);
        Home.render(data);
      });
      $el.on("data:error",function(el,data) {
        Home.error(true);
      });
      setInterval(function() {
        DigiCoins.update();
      },cache_timeout*60*1000);  // cache_timeout in miliseconds

      Home.init($el);

      data = DigiCoins.cache();
      if (data) {
        Home.render(data);  // mind some sensible HTML for empty data
      }
      DigiCoins.update();
    }
  };
}();

$(document).ready(function() {
  app.init($(".content"));
});
