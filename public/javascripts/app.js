var app = function() {
  var $buy, $sell, $updated_at;

  var cached = function() {
    var cache = localStorage["digicoins"];
    if (cache != undefined) {
      return JSON.parse(cache);
    }
  };

  var renderUpdateTime = function(dateTime) {
    $updated_at.text(dateTime)
  };

  var renderQuote = function($id, usd, ars) {
    var blu = ars/usd;
    numeral.language("en");
    $id.find(".usd").text(numeral(usd).format("0,0.00"));
    numeral.language("es");
    $id.find(".ars").text(numeral(ars).format("0,0.00"));
    $id.find("span").text(numeral(blu).format("0,0.00")+" x USD");
  };

  return {
    render: function() {
      if (cached() == undefined) {
        $.ajax({
          dataType: "json",
          type: "GET",
          url: "https://digicoins.tk/ajax/get_prices",
          success: function(data) {
            if (data.result == "OK") {
              localStorage["digicoins"] = JSON.stringify(data);
              renderQuote($buy, data.btcusdask,data.btcarsask);
              renderQuote($sell,data.btcusdbid,data.btcarsbid);
              renderUpdateTime(data.quotestime)
            }
          },
          error: function(xhr, type) {
            console.log(type);
          }
        });
      }
      else {
        console.log(cached());
        data = cached();
        renderQuote($buy, data.btcusdask,data.btcarsask);
        renderQuote($sell,data.btcusdbid,data.btcarsbid);
        renderUpdateTime(data.quotestime)
      }
    },
    init: function($el) {
      $buy  = $el.find("span#buy");
      $sell = $el.find("span#sell");
      $updated_at = $("p#updated_at")
    }
  }
}();

$(document).ready(function() {
  app.init($(".content"));
  app.render();
});
