//! version : 0.1.7
//! authors : Cristian R. Arroyo <cristian.arroyo@vivaserver.com>
//! license : MIT
//! digicoins.enmicelu.com

var app = function() {
  var $el, exchange, cache_timeout = 10;  // in minutes

  var exchangeable = function(exchange) {
    var updateCache = function(data, use_data_time) {
      console.log(data);
      localforage.getItem(exchange.name,function(cache) {
        var quote, current, previous = {"previous":null};
        if (!!cache) {
          previous = {"previous":cache.current};
        }
        quote = exchange.quote(data,use_data_time);
        if (!!quote) {
          current = $.extend({"current":quote},previous);
          localforage.setItem(exchange.name,current,function() {
            $el.trigger("data:change");
          });
        }
        else {
          $el.trigger("data:error");
        }
      });
    };

    var updateFrom = function(uri, use_data_time) {
      $.ajax({
        dataType: "json",
        type: "GET",
        url: uri, 
        success: function(data) {
          updateCache(data,use_data_time);
        },
        error: function(xhr, type) {
          console.log(type);  // "abort"
          $el.trigger("data:error");
        }
      });
    };

    var lapseExpired = function(cache) {
      var then  = moment(cache.created_at), now = moment();  // mind created_at
      var diff  = moment(now).diff(moment(then));
      var lapse = moment.duration(diff).asMinutes();
      return lapse;
    };

    return {
      current: function(callBack) {
        localforage.getItem(exchange.name,function(cache) {
          callBack(cache && cache.current ? cache.current : null);
        });
      },
      previous: function(callBack) {
        localforage.getItem(exchange.name,function(cache) {
          callBack(cache && cache.previous ? cache.previous : null);
        });
      },
      blue: function(quote) {
        if (!!quote && quote.ars && quote.usd) {
          return quote.ars/quote.usd;
        }
      },
      update: function() {
        localforage.getItem(exchange.name,function(cache) {
          if (!cache || lapseExpired(cache.current) > cache_timeout-1) {
            updateFrom(exchange.URI);
          }
        });
      },
      updateFromLocal: function() {
        var use_data_time = true;
        updateFrom(exchange.cache,use_data_time);
      }
    };
  };

  var DigiCoins = function() {
    var exchanger = {};

    // needed to cache/parse exchanger quotes
    var conf = {
      quote: function(data, use_data_time) {
        if ((data || {}).result == "OK") {  // ref. http://stackoverflow.com/a/19285523
          return {
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
            created_at: (use_data_time === true) ? data.pricestime.replace(" ","T").substr(0,23)+"Z" : new Date().toJSON()  // always like "2014-07-09T17:13:34.553Z"
          };
        }
        else {
          return false;
        }
      },
      cache: "/javascripts/cache.digicoins.json",
      name: "digicoins",
      URI: "https://digicoins.tk/ajax/get_prices"
    };
    exchanger = exchangeable(conf);

    return exchanger;
  };

  var ConectaBitcoin = function() {
    var exchanger = {};

    // needed to cache/parse exchanger quotes
    var conf = {
      quote: function(data, use_data_time) {
        var data_time = new Date();
        if ((data || {}).btc_usd && (data || {}).btc_ars) {
          if (use_data_time) {  // force expired date
            data_time = new Date(data_time.getFullYear(),data_time.getMonth(),data_time.getDate()-1);
          }
          data_time = data_time.toJSON();

          return {
            buy: {
              usd:  data.btc_usd.buy,
              ars:  data.btc_ars.buy,
              time: data_time
            },
            sell: {
              usd:  data.btc_usd.sell,
              ars:  data.btc_ars.sell,
              time: data_time
            },
            // blue: usd_ars.sell/usd_ars.buy
            created_at: data_time  // "2014-07-09T17:13:34.553Z"
          };
        }
        else {
          return false;
        }
      },
      cache: "/javascripts/cache.conectabitcoin.json",
      name: "conectabitcoin",
      URI: "https://conectabitcoin.com/es/market_prices.json"
    };
    exchanger = exchangeable(conf);

    return exchanger;
  };

  var Home = function() {
    var $buy, $sell, $time;

    var renderQuotes = function() {
      exchange.previous(function(cache) {
        var current = {buy: {}, sell: {}}, previous = {buy: {}, sell: {}};
        if (!!cache) {
          previous = cache;
        }
        exchange.current(function(cache) {
          if (!!cache) {
            current = cache;
            renderQuote($buy,  cache.created_at, current.buy,  previous.buy);
            renderQuote($sell, cache.created_at, current.sell, previous.sell);
            renderSpread($buy, current);
            renderSpread($sell,current);
          }
          else {
            localStorage.clear();
            // no current cache stored, fallback to static .json
            // and force update on expired bundled data time
            exchange.updateFromLocal();
          }
        });
      });
    };

    var toString = function(value) {
      return numeral(value).format("0,0.00");  // format according to numeral.language()
    };

    var renderSpread = function($quote, quote) {
      numeral.language("en");
      $quote.find(".spread-usd").text(toString(quote.buy.usd-quote.sell.usd)+" ↔");
      numeral.language("es");
      $quote.find(".spread-ars").text(toString(quote.buy.ars-quote.sell.ars)+" ↔");
    };

    var renderDelta = function($id, current, previous) {
      $id.removeClass("badge-negative").removeClass("badge-positive");
      switch (true) {  // ref. http://stackoverflow.com/a/21808629
        case (previous > current):
          $id.addClass("badge-negative").show().text(toString(previous-current)+" ↓");
        break;
        case (previous < current):
          $id.addClass("badge-positive").show().text(toString(current-previous)+" ↑");
        break;
        default:
          $id.show().text("=");
        break;
      }
    };

    var renderQuote = function($id, created_at, current, previous) {
      var time = moment(created_at), blue = exchange.blue(current);
      // USD
      if (current.usd) {
        numeral.language("en");
        $id.find(".usd").text(toString(current.usd));
        if (previous.usd) {
          renderDelta($id.find(".delta-usd"),current.usd,previous.usd);
        }
      }
      // ARS
      if (current.ars) {
        numeral.language("es");
        $id.find(".ars").text(toString(current.ars));
        if (previous.ars) {
          renderDelta($id.find(".delta-ars"),current.ars,previous.ars);
        }
      }
      // dolar blue
      if (blue) {
        $id.find("span.blue").text(toString(blue)+" x USD");
      }
      // "30/6/214 (hace 3 días)"
      $time.removeClass("error");
      $time.data("time",created_at);
      $time.text(time.format("l")+" ("+time.fromNow()+")");
    };

    return {
      init: function($el) {
        var that = this;
        $buy  = $el.find("span#buy");
        $sell = $el.find("span#sell");
        $time = $el.find("p#time");
        $el.on("data:change",function(el) {
          that.error(false);
          that.render();
        });
        $el.on("data:error",function(el) {
          that.error(true);
        });
      },
      error: function(truthy) {
        var time;
        if (truthy) {
          time = moment($time.data("time"));
          $time.text(time.format("l")+" ("+time.fromNow()+")");
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
      exchange = DigiCoins();  // TODO: setup on-demand

      Home.init($el);
      // render from local cache JSON file
      Home.render();
      // force first update
      exchange.update();
      // schedule all next
      setInterval(function() {
        exchange.update();
      },cache_timeout*60*1000);  // cache_timeout in miliseconds
    }
  };
}();

$(document).ready(function() {
  app.init($(".content"));
});
