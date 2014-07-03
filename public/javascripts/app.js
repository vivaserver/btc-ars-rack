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
    getData: function() {
      if (cached() == undefined) {
        $.ajax({
          dataType: "json",
          type: "GET",
          url: "https://digicoins.tk/ajax/get_prices",
          success: function(data) {
            if (data.result == "OK") {
              cacheSave(data);
              return data;
            }
          },
          error: function(xhr, type) {
            console.log(type);
          }
        });
      }
      else {
        return cached();
      }
    }
  }
}();

var app = function() {
  var $buy, $sell, $updated_at;

  var renderQuote = function($id, quote) {
    var time = moment(quote.time), blu = quote.ars/quote.usd;
    numeral.language("en");
    $id.find(".usd").text(numeral(quote.usd).format("0,0.00"));
    numeral.language("es");
    $id.find(".ars").text(numeral(quote.ars).format("0,0.00"));
    $id.find("span").text(numeral(blu).format("0,0.00")+" x USD");
    $updated_at.text(time.format("l")+" ("+time.fromNow()+")");
  };

  return {
    render: function() {
      data = DigiCoins.getData();
      renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.quotestime});
      renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.quotestime});
    },
    init: function($el) {
      moment.lang("es");
      $buy  = $el.find("span#buy");
      $sell = $el.find("span#sell");
      $updated_at = $el.find("p#updated_at")
    }
  }
}();

$(document).ready(function() {
  app.init($(".content"));
  app.render();
});
