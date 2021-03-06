# ref. https://devcenter.heroku.com/articles/static-sites-ruby
require 'rubygems'
require 'bundler'
Bundler.require

# ref. https://github.com/adamwiggins/cachemanifest/blob/master/main.rb
Rack::Mime::MIME_TYPES[".appcache"] = "text/cache-manifest"

if ENV['RACK_ENV'] == 'production'
  use Rack::MobileDetect, redirect_desktop_to: 'https://digicoins.tk'
end

use Rack::Static, urls: ['/fonts','/javascripts','/static','/stylesheets'], root: 'public'

page = Slim::Template.new('./public/index.slim',{pretty: true}).render
run lambda { |env| [
  200, { 'Content-Type' => 'text/html' }, [page]
]}
