# strongforce

Strongforce is a light-weight framework to build game engines. It provides a backbone for a powerful game loop and helper classes for efficiently implement the game actors.

## Example

The [Hexagonal Conway's Game of Life](http://lodr.github.io/strongforce#gameoflife) in the header of the project's page is a real example of strongforce in action.

## Installation

Using Bower:

    bower install strongforce

Or grab the [source](https://github.com/lodr/strongforce/dist/strongforce.js) ([minified](https://github.com/lodr/strongforce/dist/strongforce.min.js)).

## Usage

Include a script tag in your project...

    <script href="/path/to/strongforce.js" type="text/javascript"></script>
    
The entry point is the global variable `strongforce`.

Or load it with [requirejs](http://requirejs.org/):

    require(['/path/to/strongforce'], function (strongforce) { ... });
    
### Server environments

Strongforce requires `requestAnimationFrame()` as a global dependency which is usually not supported in non browser scenarios. I'm working to mitigate this limitation by providing a polyfill function. Stay tuned!

## Documentation

Start by reaading the rationale behind strongforce, then try to understand the annotated sources of the example and use API documentation whenever you want.

## Contributing

Any contribution is welcome, just:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

## License

MIT. See `LICENSE.txt` in this directory.

## About

A JavaScript library by Salvador de la Puente González.

See the [project homepage](http://lodr.github.io/strongforce).
