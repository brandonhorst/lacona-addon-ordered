lacona-addon-ordered
====================

`lacona-addon-ordered` provides all of the same benefits of `lacona-addon-stateful` but also introduces the concept of ordering.

Ordering is imposed on one particular text-based result. - a combination of the match, suggestion, and completion of a particular command. `lacona-addon-ordered` maintains that these two strings:

- `*open* Firefox`
- `*open* Google Chrome`

will sort in the same order reliably, based upon a given computation function If the string `*open* Firefox Developer Edition` has been entered, that will not influence the sort order of `*open* Firefox`, or vice-versa.



This information is stored in an object, which can be JSON-serialized for persistence.

```js
var lacona = require('lacona');
var Stateful = require('lacona-addon-stateful');
var Ordered = require('lacona-addon-ordered');

var parser = new lacona.Parser();
var stateful = new Stateful();
var ordered = new Ordered({compare: myPredicate});

src
  .pipe(parser)
  .pipe(stateful)
  .pipe(ordered)
  .pipe(process.stdout);
```
