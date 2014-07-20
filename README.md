# Bitcoin en Argentina

Built with the following components:

* [Ratchet][rtch]
* [localForage][fora]
* [numeral][nume]
* [moment][mome]
* [zepto][zpto]

## Bootstrap

    $ bundle install --path=vendor
    ...
    $ bundle exec rackup

## Concept qoute data obj.

    quote = {
      exchange: "digicoins",
      buy: {
        usd: 624.15,
        ars: 7489.86
      },
      sell: {
        usd: 592.63,
        ars: 7080.77
      },
      created_at: "2014-07-13 17:44:23.0720"
    }

## License

MIT

## Copyright

(c)2014 Cristian R. Arroyo

[rtch]: http://goratchet.com
[fora]: http://mozilla.github.io/localForage/
[nume]: http://numeraljs.com
[mome]: http://momentjs.com/
[zpto]: http://zeptojs.com/
