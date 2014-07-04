var DigiCoins = function() {
  var previous, current;  // rates' history

  var cacheSave = function(data) {
    console.log(data);
    localStorage["DigiCoins.current"] = JSON.stringify(data);
  };

  var cached = function() {
    var cache = localStorage["DigiCoins.current"];
    if (cache != undefined) {
      console.log(cache);
      return JSON.parse(cache);
    }
  };

  return {
    cache: function() {
      return cached();
    },
    update: function($el) {
      if (cached() == undefined) {
        $.ajax({
          dataType: "json",
          type: "GET",
          url: "https://digicoins.tk/ajax/get_prices",
          success: function(data) {
            if (data.result == "OK") {
              cacheSave(data);
              $el.trigger("data:change",cached());
            }
          },
          error: function(xhr, type) {
            console.log(type);
          }
        });
      }
    }
  }
}();

var app = function() {
  var $buy, $sell, $time;

  var render = function() {
    var data = DigiCoins.cache();  // TODO: read from fs on first boot and update when online from there
    if (data) {
      renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.quotestime});
      renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.quotestime});
    }
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
      renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.quotestime});
      renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.quotestime});
    });
  };

  return {
    init: function($el) {
      moment.lang("es");
      $buy  = $el.find("span#buy");
      $sell = $el.find("span#sell");
      $time = $el.find("p#time")
      render();
      setEvents($el);
      DigiCoins.update($el);
    }
  }
}();

$(document).ready(function() {
  app.init($(".content"));
});
