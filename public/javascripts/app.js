var app;

app = function() {
  return {
    render: function($id, usd, ars) {
      $id.find(".usd").text(numeral(usd).format("0,0.00"));
      $id.find(".ars").text(numeral(ars).format("0,0.00"));
    }
  }
}();

$(document).ready(function() {
  var $buy = $("span#buy"), $sell = $("span#sell");
  var $updated_at = $("#updated_at")

  $.ajax({
    dataType: "json",
    type: "GET",
    url: "https://digicoins.tk/ajax/get_prices",
    success: function(data) {
      console.log(data);
      if (data.result == "OK") {
        app.render($buy, data.btcusdask,data.btcarsask);
        app.render($sell,data.btcusdbid,data.btcarsbid);
        $updated_at.text(data.quotestime)
      }
    },
    error: function(xhr, type) {
      console.log(type);
    }
  });
});
