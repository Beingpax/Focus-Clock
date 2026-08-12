# Golden Hour Radio

Run the local site:

```sh
npm start
```

Then open [http://localhost:4173](http://localhost:4173).

The local server is required because YouTube blocks embedded playback from `file://` pages that do not provide a valid origin and HTTP referrer.

The horn uses an edited excerpt of `WWS CityBusMANSG220horn.ogg`, recorded by Dušan Oblak / Technical Museum of Slovenia and licensed under CC BY 4.0. Changes: shortened, filtered, normalized, faded, and transcoded to Opus.

The visual background is a static CSS sunset. The central timepiece is a dependency-free CSS 3D split-flap display with Clock, Stopwatch, and Timer modes. Its mode wheel supports pointer drag, touch, wheel/trackpad scrolling, clicking, and arrow keys. No video or WebGL scene is loaded.

The selected full-screen background is Daniel Leone’s mountain photograph stored locally at `assets/backgrounds/daniel-leone-mountains-v1.jpg`.

The split-flap DOM layering, continuous panel rotation, and shadow lifecycle are adapted from the MIT-licensed `pqina/flip` project. Its license is preserved at `assets/vendor/pqina-flip-LICENSE.txt`.
