//! version : 0.1.5
//! authors : Cristian R. Arroyo <cristian.arroyo@vivaserver.com>
//! license : MIT
//! digicoins.enmicelu.com

var app = function() {
  var $el, exchange, cache_timeout = 10;  // in minutes

  var lapseExpired = function(cache) {
    var then  = moment(cache.created_at), now = moment();  // mind created_at
    var diff  = moment(now).diff(moment(then));
    var lapse = moment.duration(diff).asMinutes();
    return lapse;
  };

  var exchangeable = function(exchange) {
    var updateCache = function(data, use_data_time) {
      console.log(data);
      localforage.getItem(exchange.name+"_current",function(cache) {
        var quote;
        if (cache !== null && cache !== undefined) {
          localforage.setItem(exchange.name+"_previous",cache);
        }
        quote = {
          exchange: exchange.name,
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
        localforage.setItem(exchange.name+"_current",quote,function() {
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

    return {
      current: function(callBack) {
        localforage.getItem(exchange.name+"_current",function(cache) {
          callBack(cache);
        });
      },
      previous: function(callBack) {
        localforage.getItem(exchange.name+"_previous",function(cache) {
          callBack(cache);
        });
      },
      update: function() {
        localforage.getItem(exchange.name+"_current",function(cache) {
          if ((cache === null || cache === undefined) || lapseExpired(cache) > cache_timeout-1) {
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
    var exchanger = {}, conf = {
      cache: "/javascripts/cache.digicoins.json",
      name: "digicoins",
      URI: "https://digicoins.tk/ajax/get_prices"
    };

    exchanger = exchangeable(conf);
    exchanger.blue = function(current) {
      if (current.ars && current.usd) {
        return current.ars/current.usd;
      }
    };
    return exchanger;
  };

  var ConectaBitcoin = function() {
    var exchanger = {}, conf = {
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
        if (cache !== null && cache !== undefined) {
          previous.buy  = cache.buy;
          previous.sell = cache.sell;
        }
        exchange.current(function(cache) {
          if (cache !== null && cache !== undefined) {
            current.buy  = cache.buy;
            current.sell = cache.sell;
            renderQuote($buy,  cache.created_at, current.buy,  previous.buy);
            renderQuote($sell, cache.created_at, current.sell, previous.sell);
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
      var time = moment(created_at), blu = exchange.blue(current);
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
      if (blu) {
        $id.find("span.blu").text(toString(blu)+" x USD");
      }
      // "30/6/214 (hace 3 días)"
      $time.removeClass("error");
      $time.data("time",created_at);
      $time.text(time.format("l")+" ("+time.fromNow()+")");
    };

    return {
      init: function($el) {
        $buy  = $el.find("span#buy");
        $sell = $el.find("span#sell");
        $time = $el.find("p#time");
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

      exchange = DigiCoins();  // TODO: setup on-demand

      $el = $elem;
      $el.on("data:change",function(el) {
        Home.error(false);
        Home.render();
      });
      $el.on("data:error",function(el) {
        Home.error(true);
      });
      setInterval(function() {
        exchange.update();
      },cache_timeout*60*1000);  // cache_timeout in miliseconds

      Home.init($el);
      // render from local cache JSON file
      Home.render();
      // force first update
      exchange.update();
    }
  };
}();

$(document).ready(function() {
  app.init($(".content"));
});
