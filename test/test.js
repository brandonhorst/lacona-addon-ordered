var chai = require('chai');
var es = require('event-stream');

var lacona = require('lacona');
var phrase = require('lacona-phrase');
var Stateful = require('lacona-addon-stateful');
var fulltext = require('lacona-util-fulltext');

var Ordered = require('..');

var expect = chai.expect;

describe('lacona-addon-ordered', function () {
  var parser, stateful, ordered;

  beforeEach(function () {
    var Test = phrase.createPhrase({
      describe: function () {
        return phrase.choice(null,
          phrase.literal({text: 'bb'}),
          phrase.literal({text: 'aa'}),
          phrase.literal({text: 'bc'})
        );
      }
    });

    parser = new lacona.Parser();
    parser.sentences = [phrase.createElement(Test)];
    stateful = new Stateful({serializer: fulltext.all});
    ordered = new Ordered({serializer: fulltext.all});
  });

  it('maintains order according to the given predicate' , function (done) {
    function callback(err, data) {
      expect(data).to.have.length(3);

      expect(data[0].event).to.equal('insert');
      expect(data[0].sortIndex).to.equal(0);
      expect(fulltext.all(data[0].data)).to.equal('bb');
      expect(data[1].sortIndex).to.equal(0);
      expect(fulltext.all(data[1].data)).to.equal('aa');
      expect(data[2].event).to.equal('insert');
      expect(data[2].sortIndex).to.equal(2);
      expect(fulltext.all(data[2].data)).to.equal('bc');

      done();
    }

    es.readArray([''])
      .pipe(parser)
      .pipe(stateful)
      .pipe(ordered)
      .pipe(es.writeArray(callback));
  });

  it('maintains order even with deletes' , function (done) {
    function callback(err, data) {
      expect(data).to.have.length(8);

      expect(data[0].event).to.equal('insert');
      expect(data[0].sortIndex).to.equal(0);
      expect(fulltext.all(data[0].data)).to.equal('bb');
      expect(data[1].event).to.equal('insert');
      expect(data[1].sortIndex).to.equal(0);
      expect(fulltext.all(data[1].data)).to.equal('aa');
      expect(data[2].event).to.equal('insert');
      expect(data[2].sortIndex).to.equal(2);
      expect(fulltext.all(data[2].data)).to.equal('bc');

      expect(data[3].event).to.equal('delete');
      expect(data[3].id).to.equal(data[0].id);
      expect(data[4].event).to.equal('insert');
      expect(data[4].sortIndex).to.equal(1);
      expect(fulltext.all(data[4].data)).to.equal('bb');
      expect(data[5].event).to.equal('delete');
      expect(data[5].id).to.equal(data[2].id);
      expect(data[6].event).to.equal('insert');
      expect(data[6].sortIndex).to.equal(2);
      expect(fulltext.all(data[6].data)).to.equal('bc');
      expect(data[7].event).to.equal('delete');
      expect(data[7].id).to.equal(data[1].id);

      done();
    }

    es.readArray(['', 'b'])
      .pipe(parser)
      .pipe(stateful)
      .pipe(ordered)
      .pipe(es.writeArray(callback));
  });

});
