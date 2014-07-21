//! version : 0.1.0
//! authors : Cristian R. Arroyo <cristian.arroyo@vivaserver.com>
//! license : MIT
//! digicoins.enmicelu.com

var app = function() {
  var $el, cache_timeout = 10;  // in minutes

  var DigiCoins = function() {
    var updateCache = function(data, use_data_time) {
      console.log(data);
      localforage.getItem("current").then(function(cache) {
        var quote;
        if (cache !== null && cache !== undefined) {
          localforage.setItem("previous",cache);
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
        localforage.setItem("current",quote,function() {
          $el.trigger("data:change");
        });
      });
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
          }
        },
        error: function(xhr, type) {
          console.log(type);  // "abort"
          $el.trigger("data:error");
        }
      });
    };

    var lapseExpired = function(cache) {
      var then  = moment(cache.created_at), now = moment();
      var diff  = moment(now).diff(moment(then));
      var lapse = moment.duration(diff).asMinutes();
      return lapse;
    };

    return {
      update: function() {
        localforage.getItem("current").then(function(cache) {
          if ((cache === null || cache === undefined) || lapseExpired(cache) > cache_timeout-1) {
            updateFrom("https://digicoins.tk/ajax/get_prices");
          }
        });
      },
      updateFromLocal: function() {
        var use_data_time = true;
        updateFrom("/javascripts/cache.json",use_data_time);
      }
    };
  }();

  var Home = function() {
    var $buy, $sell, $time;

    var renderQuotes = function() {
      localforage.getItem("previous").then(function(cache) {
        var current = {buy: {}, sell: {}}, previous = {buy: {}, sell: {}};
        if (cache !== null && cache !== undefined) {
          previous.buy  = cache.buy;
          previous.sell = cache.sell;
        }
        localforage.getItem("current").then(function(cache) {
          if (cache !== null && cache !== undefined) {
            current.buy  = cache.buy;
            current.sell = cache.sell;
            renderQuote($buy, current.buy,  previous.buy);
            renderQuote($sell,current.sell, previous.sell);
          }
          else {
            localStorage.clear();
            // no current cache stored, fallback to static .json
            // and force update on expired bundled data time
            DigiCoins.updateFromLocal();
          }
        });
      });
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
      var time = moment(quote.created_at), blu = quote.ars/quote.usd;
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
      // "30/6/214 (hace 3 días)"
      $time.text(time.format("l")+" ("+time.fromNow()+")");
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
      localforage.setDriver("localStorageWrapper");
      moment.lang("es");

      $el = $elem;
      $el.on("data:change",function(el) {
        Home.error(false);
        Home.render();
      });
      $el.on("data:error",function(el) {
        Home.error(true);
      });
      setInterval(function() {
        DigiCoins.update();
      },cache_timeout*60*1000);  // cache_timeout in miliseconds

      Home.init($el);
      // render from local cache JSON file
      Home.render();
      // force first update
      DigiCoins.update();
    }
  };
}();

$(document).ready(function() {
  app.init($(".content"));
});
