var _ = require('lodash');
var inherits = require('inherits');
var Transform = require('stream').Transform;

function Ordered(options) {
  Transform.call(this, {objectMode: true});

  this.index = [];
  this.comparator = options.comparator;
}

inherits(Ordered, Transform);

Ordered.prototype.handleInsert = function(option) {
  var this_ = this;
  var newIndex = _.sortedIndex(this.index, option, function (item) {
    return this_.comparator(item.data);
  });

  var newOption = _.clone(option);
  newOption.id = newIndex;
  this.index.splice(newIndex, 0, option);
  this.push(newOption);
};

Ordered.prototype.handleUpdate = function(option) {
  var oldIndex = _.findIndex(this.index, {id: option.id});
  var newOption = _.clone(option);
  this.index.splice(oldIndex, 1, option);
  newOption.id = oldIndex;

  this.push(newOption);
};

Ordered.prototype.handleDelete = function(option) {
  var oldIndex = _.findIndex(this.index, {id: option.id});
  this.index.splice(oldIndex, 1);

  var newOption = _.clone(option);
  newOption.id = oldIndex;

  this.push(newOption);
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
