var chai = require('chai');
var stream = require('stream');

var lacona = require('lacona');
var Stateful = require('lacona-addon-stateful');
var fulltext = require('lacona-util-fulltext');

var Ordered = require('..');

var expect = chai.expect;

function toStream(strings) {
  var newStream = new stream.Readable({objectMode: true});

  strings.forEach(function (string) {
    newStream.push(string);
  });
  newStream.push(null);

  return newStream;
}

function toArray(done) {
  var newStream = new stream.Writable({objectMode: true});
  var list = [];
  newStream.write = function(obj) {
    list.push(obj);
  };

  newStream.end = function() {
    done(list);
  };

  return newStream;
}


describe('lacona-addon-ordered', function () {
  var parser, stateful, ordered;

  beforeEach(function () {
    var test = lacona.createPhrase({
      name: 'test/test',
      describe: function () {
        return lacona.choice({children: [
          lacona.literal({text: 'testb'}),
          lacona.literal({text: 'teaseaa'}),
          lacona.literal({text: 'testbb'})
        ]});
      }
    });

    parser = new lacona.Parser();
    parser.sentences = [test()];
    stateful = new Stateful({serializer: fulltext.all});

    ordered = new Ordered({comparator: function (option) {
      return fulltext.all(option).length;
    }});
  });

  it('maintains order according to the given predicate' , function (done) {
    function callback(data) {
      expect(data).to.have.length(3);

      //actual order is not changed
      expect(fulltext.suggestion(data[0].data)).to.equal('testb');
      expect(fulltext.suggestion(data[1].data)).to.equal('teaseaa');
      expect(fulltext.suggestion(data[2].data)).to.equal('testbb');

      //id is specified
      expect(data[0].id).to.equal(0);
      expect(data[1].id).to.equal(1);
      expect(data[2].id).to.equal(1);
      done();
    }

    toStream(['te'])
      .pipe(parser)
      .pipe(stateful)
      .pipe(ordered)
      .pipe(toArray(callback));
  });

  it('maintains order even with deletes' , function (done) {
    function callback(data) {
      expect(data).to.have.length(6);

      //actual order is not changed
      expect(fulltext.suggestion(data[0].data)).to.equal('testb');
      expect(fulltext.suggestion(data[1].data)).to.equal('teaseaa');
      expect(fulltext.suggestion(data[2].data)).to.equal('testbb');
      expect(data[3].event).to.equal('update');
      expect(fulltext.suggestion(data[3].data)).to.equal('testb');
      expect(data[4].event).to.equal('update');
      expect(fulltext.suggestion(data[4].data)).to.equal('testbb');
      expect(data[5].event).to.equal('delete');

      //id is specified
      expect(data[0].id).to.equal(0);
      expect(data[1].id).to.equal(1);
      expect(data[2].id).to.equal(1);
      expect(data[3].id).to.equal(0);
      expect(data[4].id).to.equal(1);

      done();
    }

    toStream(['te', 'tes'])
    .pipe(parser)
    .pipe(stateful)
    .pipe(ordered)
    .pipe(toArray(callback));
  });

});
