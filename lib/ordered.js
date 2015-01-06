var inherits = require('inherits');
var sortedIndex = require('lodash.sortedindex');
var findIndex = require('lodash.findindex');
var clone = require('lodash.clone');
var Transform = require('stream').Transform;

function Ordered(options) {
  Transform.call(this, {objectMode: true});

  this.index = [];
  this.comparator = options.comparator;
  this.checkUpdates = options.checkUpdates || true;
}

inherits(Ordered, Transform);

Ordered.prototype.handleInsert = function(option) {
  var newIndex = sortedIndex(this.index, option.data, this.comparator);

  var newOption = clone(option);
  newOption.sortIndex = newIndex;
  this.index.splice(newIndex, 0, option.data);
  this.push(newOption);
};

//note - we may not need to actually handle updates, if ordered.comparator is
// a function of the output of stateful.serializer for a given option
//but we will for now
Ordered.prototype.handleUpdate = function(option) {
  var oldIndex, newOption, newIndex;

  if (this.checkUpdates) {
    //remove the old value
    oldIndex = findIndex(this.index, {id: option.id});
    this.index.splice(oldIndex, 1);
    newOption = clone(option);

    //insert the new value
    newIndex = sortedIndex(this.index, option.data, this.comparator);
    this.index.splice(newIndex, 0, option);

    //send the new value
    newOption.sortIndex = newIndex;
    this.push(newOption);
  }
};

Ordered.prototype.handleDelete = function(option) {
  var oldIndex = findIndex(this.index, {id: option.id});
  this.index.splice(oldIndex, 1);
  this.push(option);
};

Ordered.prototype._transform = function (option, encoding, callback) {
  switch (option.event) {
    case 'insert':
      this.handleInsert(option);
      break;
    case 'update':
      this.handleUpdate(option);
      break;
    case 'delete':
      this.handleDelete(option);
      break;
  }
  callback();
};

module.exports = Ordered;
