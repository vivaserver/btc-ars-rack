var DigiCoins = function() {
  var previous = "DigiCoins.previous", current = "DigiCoins.current";  // rates' history

  var updateCache = function(data) {
    console.log(data);
    if (localStorage[current]) {
      localStorage[previous] = localStorage[current];
    }
    localStorage[current] = JSON.stringify(data);
  };

  var cached = function() {
    var cache = localStorage[current];
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
      return expiredLapse(cache) > "60:00:00";
    }
  };

  var expiredLapse = function(cache) {  // ref. http://stackoverflow.com/a/18624295
    var then  = moment(cache.quotestime), now = moment();
    var diff  = moment(now,"DD/MM/YYYY HH:mm:ss").diff(moment(then,"DD/MM/YYYY HH:mm:ss"));
    var dure  = moment.duration(diff);
    var enlap = Math.floor(dure.asHours()) + moment.utc(diff).format(":mm:ss");  // "48:39:30"
    console.log(enlap);
    return enlap;
  };

  return {
    cache: function() {
      return cached();
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
              $el.trigger("data:change",cached());
            }
          },
          error: function(xhr, type) {
            console.log(type);  // TODO
          }
        });
      }
    }
  };
}();

var app = function() {
  var $buy, $sell, $time;

  var render = function() {
    var data = DigiCoins.cache();  // TODO: read from fs on first boot and update when online from there
    if (data) {
      renderQuotes(data);  // mind some sensible HTML for empty data
    }
  };

  var renderQuotes = function(data) {
    renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.pricestime});
    renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.pricestime});
  };

  var renderQuote = function($id, quote) {
    var time = moment(quote.time), blu = quote.ars/quote.usd;
    numeral.language("en");
    $id.find(".usd").text(numeral(quote.usd).format("0,0.00"));
    numeral.language("es");
    $id.find(".ars").text(numeral(quote.ars).format("0,0.00"));
    $id.find("span").text(numeral(blu).format("0,0.00")+" x USD");
    $time.text(time.format("l")+" ("+time.fromNow()+")");  // "30/6/214 (hace 3 días)"
  };

  var setEvents = function($el) {
    $el.on("data:change",function(el,data) {  // NOTE: custom event
      renderQuotes(data);
    });
  };

  return {
    init: function($el) {
      moment.lang("es");
      $buy  = $el.find("span#buy");
      $sell = $el.find("span#sell");
      $time = $el.find("p#time");
      render();
      setEvents($el);
      DigiCoins.update($el);
    }
  };
}();

$(document).ready(function() {
  app.init($(".content"));
});
