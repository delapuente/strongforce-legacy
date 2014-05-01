# strongforce

Strongforce is a light-weight framework to build game engines. It provides a backbone for a powerful game loop and helper classes for efficiently implement the game actors.

## Example

The [Hexagonal Conway's Game of Life](https://rawgit.com/lodr/strongforce/master/demo/index.html) is a real example of strongforce in action.

## Installation

Using Bower:

    bower install strongforce

Or grab the [source](https://raw.githubusercontent.com/lodr/strongforce/master/dist/strongforce.js) ([minified](https://raw.githubusercontent.com/lodr/strongforce/master/dist/strongforce.min.js)).

## Usage

Include a script tag in your project...

```html
<script href="/path/to/strongforce.js" type="text/javascript"></script>
```
    
The entry point is the global variable `strongforce`.

Or load it with [requirejs](http://requirejs.org/):

```javascript
require(['/path/to/strongforce'], function (strongforce) { ... });
```
    
### Avoiding collisions

If for some reason you already have a `strongforce` global variable in your global namespace. You can call `strongforce.restore()` to get the strongforce instance and restore the former value of the `strongforce` variable.

```javascript
var myNameForStrongforce = strongforce.restore();
```
    
### Server environments

Strongforce requires `window.requestAnimationFrame()` as a global dependency which is usually not supported in non browser scenarios. I'm working to mitigate this limitation by providing a polyfill function. Stay tuned!

## Documentation

Start by reading the [rationale behind strongforce](https://github.com/lodr/strongforce/wiki/Rationale), then take a look to the [sources of the demo](https://github.com/lodr/strongforce/tree/master/demo/scripts) and use the [API documentation](http://rawgit.com/lodr/strongforce/master/docs/index.html) whenever you want.

## Contributing

Any contribution is welcome, just:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

In addition, take a look at the wiki pages for [setting up the development environment](https://github.com/lodr/strongforce/wiki/The-development-environment), passing tests, running grunt and so on.

## License

MIT. See `LICENSE.txt` in this directory.

## About

A JavaScript library by Salvador de la Puente González.

See the [project homepage](http://lodr.github.io/strongforce).
