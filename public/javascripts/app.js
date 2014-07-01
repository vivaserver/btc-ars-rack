var app;

app = function() {
  return {
    render: function($id, usd, ars) {
      var blu = ars/usd;
      numeral.language("en");
      $id.find(".usd").text(numeral(usd).format("0,0.00"));
      numeral.language("es");
      $id.find(".ars").text(numeral(ars).format("0,0.00"));
      $id.find("span").text(numeral(blu).format("0,0.00")+" x USD");
    }
  }
}();

$(document).ready(function() {
  var $buy = $("span#buy"), $sell = $("span#sell");
  var $updated_at = $("p#updated_at")

  if (localStorage["digicoins"] == undefined) {
    $.ajax({
      dataType: "json",
      type: "GET",
      url: "https://digicoins.tk/ajax/get_prices",
      success: function(data) {
        if (data.result == "OK") {
          localStorage["digicoins"] = JSON.stringify(data);
          app.render($buy, data.btcusdask,data.btcarsask);
          app.render($sell,data.btcusdbid,data.btcarsbid);
          $updated_at.text(data.quotestime)
        }
      },
      error: function(xhr, type) {
        console.log(type);
      }
    });
  }
  else {
    console.log(localStorage["digicoins"]);
    data = JSON.parse(localStorage["digicoins"]);
    app.render($buy, data.btcusdask,data.btcarsask);
    app.render($sell,data.btcusdbid,data.btcarsbid);
    $updated_at.text(data.quotestime)
  }
});
