//! version : 0.0.4
//! authors : Cristian R. Arroyo <cristian.arroyo@vivaserver.com>
//! license : MIT
//! digicoins.enmicelu.com

var app = function() {
  var $el, cache_timeout = 10;  // in minutes

  var DigiCoins = function() {
    var updateCache = function(data, use_data_time) {
      var qoute;
      console.log(data);
      if (localStorage.getItem("current")) {
        localStorage.setItem("previous",localStorage.getItem("current"));
      }
      quote = {
        exchange: "digicoins",
        buy: {
          usd:  data.btcusdask,
          ars:  data.btcarsask,
          time: data.quotestime
        },
        sell: {
          usd:  data.btcusdbid,
          ars:  data.btcarsbid,
          time: data.quotestime
        },
        created_at: timeStamp(data.pricestime,use_data_time)
      };
      localStorage.setItem("current",JSON.stringify(quote));
    };

    var timeStamp = function(time, use_data_time) {  // always like "2014-07-09T17:13:34.553Z"
      return (use_data_time === true) ? 
        time.replace(" ","T").substr(0,23)+"Z" :
        new Date().toJSON();
    };

    var updateFrom = function(uri, use_data_time) {
      $.ajax({
        dataType: "json",
        type: "GET",
        url: uri, 
        success: function(data) {
          if (data.result == "OK") {
            updateCache(data,use_data_time);
            $el.trigger("data:change");
          }
        },
        error: function(xhr, type) {
          console.log(type);  // "abort"
          $el.trigger("data:error");
        }
      });
    };

    var cached = function(key) {  // should always get a key
      var cache = localStorage.getItem(key), use_data_time = true;
      if (cache === null || cache === undefined) {
        if (key == "current") {
          localStorage.clear();
          // no current cache stored, fallback to static .json
          // and force update on expired bundled data time
          updateFrom("/javascripts/cache.json",use_data_time);
        }
      }
      else {
        return JSON.parse(cache);
      }
    };

    var isExpired = function() {
      var cache = cached("current");
      if (cache === null || cache === undefined) {
        return true;
      }
      else {
        return lapseExpired(cache) > cache_timeout-1;
      }
    };

    var lapseExpired = function(cache) {
      var then  = moment(cache.created_at), now = moment();
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

    var renderQuotes = function() {
      var current = DigiCoins.cache(), previous = DigiCoins.cache("previous"), prev = {buy: {}, sell: {}};
      if (previous) {
        prev.buy  = previous.buy;
        prev.sell = previous.sell;
      }
      if (current) {
        renderQuote($buy, current.buy,  prev.buy);
        renderQuote($sell,current.sell, prev.sell);
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
      render: function() {
        renderQuotes();
      }
    };
  }();

  return {
    init: function($elem) {
      var data;

      moment.lang("es");

      $el = $elem;
      $el.on("data:change",function(el) {
        Home.error(false);
        Home.render();
      });
      $el.on("data:error",function(el,data) {
        Home.error(true);
      });
      setInterval(function() {
        DigiCoins.update();
      },cache_timeout*60*1000);  // cache_timeout in miliseconds

      Home.init($el);
      // force first update
      DigiCoins.update();
    }
  };
}();

$(document).ready(function() {
  app.init($(".content"));
});
