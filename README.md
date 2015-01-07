lacona-addon-ordered
====================
[![Travis](https://img.shields.io/travis/lacona/lacona-addon-ordered.svg?style=flat)](https://travis-ci.org/lacona/lacona-addon-ordered)
[![Coverage Status](https://img.shields.io/coveralls/lacona/lacona-addon-ordered.svg?style=flat)](https://coveralls.io/r/lacona/lacona-addon-ordered)

`lacona-addon-ordered` provides all of the same benefits of `lacona-addon-stateful` but also introduces the concept of ordering.

Ordering is imposed on one particular text-based result. - a combination of the match, suggestion, and completion of a particular command. `lacona-addon-ordered` maintains that these two strings:

- `*open* Firefox`
- `*open* Google Chrome`

will sort in the same order reliably, based upon a given computation function If the string `*open* Firefox Developer Edition` has been entered, that will not influence the sort order of `*open* Firefox`, or vice-versa.

##Usage

Like `lacona-addon-stateful`, this stream outputs objects with three properties:

```js
{
  event: ('insert' || 'update' || 'delete'),
  id: Number,
  data: OutputOption
}
```

An event will be emitted for every event coming from the `lacona-addon-stateful`. However, the `id` properties will not be the same. They will correspond to the index of an array containing all of the previously outputted events. Here is an example:

Imagine these events. The comments show the state of the data array as it should be represented after each event.

```js
{event: 'insert', id: 0, data: 'a'} // ['a']
{event: 'insert', id, 0, data: 'b'} // ['b', 'a']
{event: 'update', id: 1, data: 'c'} // ['b', 'c']
{event: 'delete', id: 0}            // ['c']
```

You must be very careful to maintain your array in exactly the way specified by each event (including the order). Otherwise your representation will get out-of-sync and all future events will be invalid.

Your code should respond to events in a manner equivalent to this:

```js
switch (obj.event) {
  case 'insert': arr.splice(obj.id, 0, obj.data); break;
  case 'update': arr.splice(obj.id, 1, obj.data); break;
  case 'delete': arr.splice(obj.id, 1); break;
}
```

##Limitations

Currently, the `ordered.comparator` function *must* be a function of the `stateful.serializer` function. That is to say, the same output from `stateful.serializer` must yield the same output from `ordered.comparator` every time.

Therefore, anything that `stateful` considers to be an `update` can, by definition, not effect the sort order.

Doing so is possible, but I do not currently see a use case for sorting an order independent of grouping.

##Example

```js
var lacona = require('lacona');
var Stateful = require('lacona-addon-stateful');
var Ordered = require('lacona-addon-ordered');
var fulltext = require('lacona-util-fulltext');

var parser = new lacona.Parser(options);
var stateful = new Stateful({serializer: fulltext});
var ordered = new Ordered({comparator: fulltext});

src
  .pipe(parser)
  .pipe(stateful)
  .pipe(ordered)
  .pipe(process.stdout);
```
