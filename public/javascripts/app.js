var app = function() {
  var $buy, $sell, $updated_at;

  var cacheSave = function(data) {
    console.log(data);
    localStorage["digicoins"] = JSON.stringify(data);
  };

  var cached = function() {
    var cache = localStorage["digicoins"];
    if (cache != undefined) {
      console.log(cache);
      return JSON.parse(cache);
    }
  };

  var renderQuote = function($id, quote) {
    var blu = quote.ars/quote.usd;
    numeral.language("en");
    $id.find(".usd").text(numeral(quote.usd).format("0,0.00"));
    numeral.language("es");
    $id.find(".ars").text(numeral(quote.ars).format("0,0.00"));
    $id.find("span").text(numeral(blu).format("0,0.00")+" x USD");
    $updated_at.text(quote.time)
  };

  return {
    render: function() {
      var quoteBuy, quoteSell;

      if (cached() == undefined) {
        $.ajax({
          dataType: "json",
          type: "GET",
          url: "https://digicoins.tk/ajax/get_prices",
          success: function(data) {
            if (data.result == "OK") {
              cacheSave(data);
              renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.quotestime});
              renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.quotestime});
            }
          },
          error: function(xhr, type) {
            console.log(type);
          }
        });
      }
      else {
        data = cached();
        renderQuote($buy, {usd: data.btcusdask, ars: data.btcarsask, time: data.quotestime});
        renderQuote($sell,{usd: data.btcusdbid, ars: data.btcarsbid, time: data.quotestime});
      }
    },
    init: function($el) {
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
