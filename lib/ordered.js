var _ = require('lodash');
var inherits = require('inherits');
var Transform = require('stream').Transform;

function Ordered(options) {
  Transform.call(this, {objectMode: true});

  this.sortedList = [];
  this.serializer = options.serializer;
}

inherits(Ordered, Transform);

Ordered.prototype.handleInsert = function(option) {
  var serialized = this.serializer(option.data);

  var newIndex = _.sortedIndex(this.sortedList, {serialized: serialized}, 'serialized');

  var newOption = {
    event: 'insert',
    id: option.id,
    sortIndex: newIndex,
    data: option.data
  };

  var newEntry = {
    serialized: serialized,
    id: option.id
  };

  this.push(newOption);

  this.sortedList.splice(newIndex, 0, newEntry);
};

Ordered.prototype.handleDelete = function(option) {
  var oldIndex = _.findIndex(this.sortedList, {id: option.id}, 'id');

  this.sortedList.splice(oldIndex, 1);

  this.push(option);
};

Ordered.prototype._transform = function (option, encoding, callback) {

  switch (option.event) {
    case 'insert':
      this.handleInsert(option);
      break;
    case 'delete':
      this.handleDelete(option);
      break;
  }
  callback();
};

module.exports = Ordered;
