namespace :update do
  desc "update Digicoins' cache.json"
  task :digicoins do
    sh "wget https://digicoins.tk/ajax/get_prices --output-document=public/javascripts/cache.json"
  end
end
