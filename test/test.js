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
          lacona.literal({text: 'bb'}),
          lacona.literal({text: 'aa'}),
          lacona.literal({text: 'bc'})
        ]});
      }
    });

    parser = new lacona.Parser();
    parser.sentences = [test()];
    stateful = new Stateful({serializer: fulltext.all});
    ordered = new Ordered({serializer: fulltext.all});
  });

  it('maintains order according to the given predicate' , function (done) {
    function callback(data) {
      expect(data).to.have.length(3);

      expect(data[0].event).to.equal('insert');
      expect(data[0].id).to.equal(0);
      expect(data[0].sortIndex).to.equal(0);
      expect(fulltext.suggestion(data[0].data)).to.equal('bb');

      expect(data[1].event).to.equal('insert');
      expect(data[1].id).to.equal(1);
      expect(data[1].sortIndex).to.equal(0);
      expect(fulltext.suggestion(data[1].data)).to.equal('aa');

      expect(data[2].event).to.equal('insert');
      expect(data[2].id).to.equal(2);
      expect(data[2].sortIndex).to.equal(2);
      expect(fulltext.suggestion(data[2].data)).to.equal('bc');

      done();
    }

    toStream([''])
      .pipe(parser)
      .pipe(stateful)
      .pipe(ordered)
      .pipe(toArray(callback));
  });

  it('maintains order even with deletes' , function (done) {
    function callback(data) {
      expect(data).to.have.length(8);

      //actual order is not changed
      expect(data[3].event).to.equal('delete');
      expect(data[3].id).to.equal(0);

      expect(data[4].event).to.equal('insert');
      expect(data[4].id).to.equal(3);
      expect(data[4].sortIndex).to.equal(1);
      expect(fulltext.suggestion(data[4].data)).to.equal('bb');

      expect(data[5].event).to.equal('delete');
      expect(data[5].id).to.equal(2);

      expect(data[6].event).to.equal('insert');
      expect(data[6].id).to.equal(4);
      expect(data[6].sortIndex).to.equal(2);
      expect(fulltext.suggestion(data[6].data)).to.equal('bc');

      expect(data[7].event).to.equal('delete');
      expect(data[7].id).to.equal(1);

      done();
    }

    toStream(['', 'b'])
    .pipe(parser)
    .pipe(stateful)
    .pipe(ordered)
    .pipe(toArray(callback));
  });

});
