/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from 'chai';
import {
  boolean,
  decimal,
  eachLike,
  hexadecimal,
  integer,
  ipv4Address,
  ipv6Address,
  ISO8601_DATE_FORMAT,
  iso8601Date,
  iso8601DateTime,
  iso8601DateTimeWithMillis,
  iso8601Time,
  rfc1123Timestamp,
  somethingLike,
  string,
  term,
  email,
  uuid,
  validateExample,
  extractPayload,
  isMatcher,
  like,
  AnyTemplate,
  InterfaceToTemplate,
} from './matchers';

interface ExampleInterface {
  someString: string;
  someArray: Array<string>;
  someNumber: number;
  someObject: {
    foo: string;
    bar: string;
  };
}

type ExampleType = {
  someString: string;
  someArray: Array<string>;
  someNumber: number;
  someObject: {
    foo: string;
    bar: string;
  };
};

describe('Matcher', () => {
  describe('can compile the types', () => {
    describe('with interfaces', () => {
      it('compiles when InterfaceToTemplate is used', () => {
        const template: InterfaceToTemplate<ExampleInterface> = {
          someArray: ['one', 'two'],
          someNumber: 1,
          someString: "it's a string",
          someObject: {
            foo: 'some string',
            bar: 'some other string',
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
        const a: AnyTemplate = like(template);
      });
    });
    describe('with types', () => {
      it('compiles', () => {
        const template: ExampleType = {
          someArray: ['one', 'two'],
          someNumber: 1,
          someString: "it's a string",
          someObject: {
            foo: 'some string',
            bar: 'some other string',
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
        const a: AnyTemplate = like(template);
      });
    });

    it('compiles nested likes', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
      const a: AnyTemplate = like({
        someArray: ['one', 'two'],
        someNumber: like(1),
        someString: "it's a string",
        someObject: like({
          foo: like('some string'),
          bar: 'some other string',
        }),
      });
    });
  });

  describe('#validateExample', () => {
    describe('when given a valid regex', () => {
      describe('and a matching example', () => {
        it('returns true', () => {
          expect(validateExample('2010-01-01', ISO8601_DATE_FORMAT)).to.eql(
            true
          );
        });
      });
      describe('and a failing example', () => {
        it('returns false', () => {
          expect(validateExample('not a date', ISO8601_DATE_FORMAT)).to.eql(
            false
          );
        });
      });
    });
    describe('when given an invalid regex', () => {
      it('returns an error', () => {
        expect(() => {
          validateExample('', 'abc(');
        }).to.throw(Error);
      });
    });
  });

  describe('#term', () => {
    describe('when given a valid regular expression and example', () => {
      it('returns a serialized Ruby object', () => {
        const expected = {
          value: 'myawesomeword',
          regex: '\\w+',
          'pact:matcher:type': 'regex',
        };

        const match = term({
          generate: 'myawesomeword',
          matcher: '\\w+',
        });

        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });

    describe('when not provided with a valid expression', () => {
      const createTheTerm = (badArg: any) => () => {
        term(badArg);
      };

      describe('when no term is provided', () => {
        it('throws an Error', () => {
          expect(createTheTerm.call({})).to.throw(Error);
        });
      });

      describe('when an invalid term is provided', () => {
        it('throws an Error', () => {
          expect(createTheTerm({})).to.throw(Error);
          expect(createTheTerm('')).to.throw(Error);
          expect(createTheTerm({ value: 'foo' })).to.throw(Error);
          expect(createTheTerm({ matcher: '\\w+' })).to.throw(Error);
        });
      });
    });

    describe("when given an example that doesn't match the regular expression", () => {
      it('fails with an error', () => {
        expect(() => {
          term({
            generate: 'abc',
            matcher: ISO8601_DATE_FORMAT,
          });
        }).to.throw(Error);
      });
    });
  });

  describe('#somethingLike', () => {
    describe('when provided a value', () => {
      it('returns a serialized Ruby object', () => {
        const expected = {
          value: 'myspecialvalue',
          'pact:matcher:type': 'type',
        };

        const match = somethingLike('myspecialvalue');
        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });

    describe('when not provided with a valid value', () => {
      const createTheValue = (badArg: any) => () => {
        somethingLike(badArg);
      };

      describe('when no value is provided', () => {
        it('`throws an Error', () => {
          expect(createTheValue.call({})).to.throw(Error);
        });
      });

      describe('when an invalid value is provided', () => {
        it('throws an Error', () => {
          expect(createTheValue(undefined)).to.throw(Error);
          expect(createTheValue(() => {})).to.throw(Error);
        });
      });
    });
  });

  describe('#eachLike', () => {
    describe('when content is null', () => {
      it('provides null as contents', () => {
        const expected = {
          value: [null],
          'pact:matcher:type': 'type',
          min: 1,
        };

        const match = eachLike(null, { min: 1 });
        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });

    describe('when an object is provided', () => {
      it('provides the object as contents', () => {
        const expected = {
          value: [{ a: 1 }],
          'pact:matcher:type': 'type',
          min: 1,
        };

        const match = eachLike({ a: 1 }, { min: 1 });
        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });

    describe('when object.min is invalid', () => {
      it('throws an Error message', () => {
        expect(() => {
          eachLike({ a: 1 }, { min: 0 });
        }).to.throw(Error);
      });
    });

    describe('when an array is provided', () => {
      it('provides the array as contents', () => {
        const expected = {
          value: [[1, 2, 3]],
          'pact:matcher:type': 'type',
          min: 1,
        };

        const match = eachLike([1, 2, 3], { min: 1 });
        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });

    describe('when a value is provided', () => {
      it('adds the value in contents', () => {
        const expected = {
          value: ['test'],
          'pact:matcher:type': 'type',
          min: 1,
        };

        const match = eachLike('test', { min: 1 });
        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });

    describe('when the content has Pact.Macters', () => {
      describe('of type somethingLike', () => {
        it('nests somethingLike correctly', () => {
          const expected = {
            value: [
              {
                id: {
                  value: 10,
                  'pact:matcher:type': 'type',
                },
              },
            ],
            'pact:matcher:type': 'type',
            min: 1,
          };

          const match = eachLike({ id: somethingLike(10) }, { min: 1 });
          expect(JSON.stringify(match)).to.deep.include(
            JSON.stringify(expected)
          );
        });
      });

      describe('of type term', () => {
        it('nests term correctly', () => {
          const expected = {
            value: [
              {
                colour: {
                  value: 'red',
                  regex: 'red|green',
                  'pact:matcher:type': 'regex',
                },
              },
            ],
            'pact:matcher:type': 'type',
            min: 1,
          };

          const match = eachLike(
            {
              colour: term({
                generate: 'red',
                matcher: 'red|green',
              }),
            },
            { min: 1 }
          );

          //

          expect(JSON.stringify(match)).to.deep.include(
            JSON.stringify(expected)
          );
        });
      });

      describe('of type eachLike', () => {
        it('nests eachlike in contents', () => {
          const expected = {
            value: [
              {
                value: ['blue'],
                'pact:matcher:type': 'type',
                min: 1,
              },
            ],
            'pact:matcher:type': 'type',
            min: 1,
          };

          const match = eachLike(eachLike('blue', { min: 1 }), { min: 1 });
          expect(JSON.stringify(match)).to.deep.include(
            JSON.stringify(expected)
          );
        });
      });

      describe('complex object with multiple Pact.Matchers', () => {
        it('nests objects correctly', () => {
          const expected = {
            value: [
              {
                value: [
                  {
                    colour: {
                      value: 'red',
                      'pact:matcher:type': 'regex',
                      regex: 'red|green|blue',
                    },
                    size: {
                      value: 10,
                      'pact:matcher:type': 'type',
                    },
                    tag: {
                      value: [
                        [
                          {
                            value: 'jumper',
                            'pact:matcher:type': 'type',
                          },
                          {
                            value: 'shirt',
                            'pact:matcher:type': 'type',
                          },
                        ],
                        [
                          {
                            value: 'jumper',
                            'pact:matcher:type': 'type',
                          },
                          {
                            value: 'shirt',
                            'pact:matcher:type': 'type',
                          },
                        ],
                      ],
                      'pact:matcher:type': 'type',
                      min: 2,
                    },
                  },
                ],
                'pact:matcher:type': 'type',
                min: 1,
              },
            ],
            'pact:matcher:type': 'type',
            min: 1,
          };

          const match = eachLike(
            eachLike(
              {
                colour: term({ generate: 'red', matcher: 'red|green|blue' }),
                size: somethingLike(10),
                tag: eachLike(
                  [somethingLike('jumper'), somethingLike('shirt')],
                  { min: 2 }
                ),
              },
              { min: 1 }
            ),
            { min: 1 }
          );

          expect(JSON.parse(JSON.stringify(match))).to.deep.include(
            JSON.parse(JSON.stringify(expected))
          );
        });
      });
    });

    describe('When no options.min is not provided', () => {
      it('defaults to a min of 1', () => {
        const expected = {
          value: [{ a: 1 }],
          'pact:matcher:type': 'type',
          min: 1,
        };

        const match = eachLike({ a: 1 });
        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });

    describe('When a options.min is provided', () => {
      it('provides the object as contents', () => {
        const expected = {
          value: [{ a: 1 }, { a: 1 }, { a: 1 }],
          'pact:matcher:type': 'type',
          min: 3,
        };

        const match = eachLike({ a: 1 }, { min: 3 });
        expect(JSON.stringify(match)).to.deep.include(JSON.stringify(expected));
      });
    });
  });

  describe('#email', () => {
    describe('when given a valid Email address', () => {
      it('creates a valid matcher', () => {
        expect(email('hello@world.com')).to.be.an('object');
        expect(email('hello@world.com.au')).to.be.an('object');
        expect(email('hello@a.co')).to.be.an('object');
        expect(email()).to.be.an('object');
      });
    });
    describe('when given an invalid Email address', () => {
      it('returns an error', () => {
        expect(() => {
          email('hello.world.c');
        }).to.throw(Error);
      });
    });
  });

  describe('#uuid', () => {
    describe('when given a valid UUID', () => {
      it('creates a valid matcher', () => {
        expect(uuid('ce118b6e-d8e1-11e7-9296-cec278b6b50a')).to.be.an('object');
        expect(uuid()).to.be.an('object');
      });
    });
    describe('when given an invalid UUID', () => {
      it('returns an error', () => {
        expect(() => {
          uuid('abc');
        }).to.throw(Error);
      });
    });
  });

  describe('#ipv4Address', () => {
    describe('when given a valid ipv4Address', () => {
      it('creates a valid matcher', () => {
        expect(ipv4Address('127.0.0.1')).to.be.an('object');
        expect(ipv4Address()).to.be.an('object');
      });
    });
    describe('when given an invalid ipv4Address', () => {
      it('returns an error', () => {
        expect(() => {
          ipv4Address('abc');
        }).to.throw(Error);
      });
    });
  });

  describe('#ipv6Address', () => {
    describe('when given a valid ipv6Address', () => {
      it('creates a valid matcher', () => {
        expect(ipv6Address('::1')).to.be.an('object');
        expect(ipv6Address('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).to.be.an(
          'object'
        );
        expect(ipv6Address()).to.be.an('object');
      });
    });
    describe('when given an invalid ipv6Address', () => {
      it('returns an error', () => {
        expect(() => {
          ipv6Address('abc');
        }).to.throw(Error);
      });
    });
  });

  describe('#hexadecimal', () => {
    describe('when given a valid hexadecimal', () => {
      it('creates a valid matcher', () => {
        expect(hexadecimal('6F')).to.be.an('object');
        expect(hexadecimal()).to.be.an('object');
      });
    });
    describe('when given an invalid hexadecimal', () => {
      it('returns an error', () => {
        expect(() => {
          hexadecimal('x1');
        }).to.throw(Error);
      });
    });
  });

  describe('#boolean', () => {
    describe('when used it should create a JSON object', () => {
      it('creates a valid matcher', () => {
        expect(boolean()).to.be.an('object');
        expect(boolean().value).to.equal(true);
      });
      it('sets value=false', () => {
        expect(boolean(false)).to.be.an('object');
        expect(boolean(false).value).to.equal(false);
      });
      it('sets value=true', () => {
        expect(boolean(true)).to.be.an('object');
        expect(boolean(true).value).to.equal(true);
      });
    });
  });

  describe('#string', () => {
    describe('when given a valid string', () => {
      it('creates a valid matcher', () => {
        expect(string('test')).to.be.an('object');
        expect(string()).to.be.an('object');
        expect(string('test').value).to.equal('test');
      });
    });
  });

  describe('#decimal', () => {
    describe('when given a valid decimal', () => {
      it('creates a valid matcher', () => {
        expect(decimal(10.1)).to.be.an('object');
        expect(decimal()).to.be.an('object');
        expect(decimal(0.0).value).to.equal(0.0);
      });
    });
  });

  describe('#integer', () => {
    describe('when given a valid integer', () => {
      it('creates a valid matcher', () => {
        expect(integer(10)).to.be.an('object');
        expect(integer()).to.be.an('object');
        expect(integer(0).value).to.equal(0);
      });
    });
  });

  describe('Date Matchers', () => {
    describe('#rfc1123Timestamp', () => {
      describe('when given a valid rfc1123Timestamp', () => {
        it('creates a valid matcher', () => {
          expect(rfc1123Timestamp('Mon, 31 Oct 2016 15:21:41 -0400')).to.be.an(
            'object'
          );
          expect(rfc1123Timestamp()).to.be.an('object');
        });
      });
      describe('when given an invalid rfc1123Timestamp', () => {
        it('returns an error', () => {
          expect(() => {
            rfc1123Timestamp('abc');
          }).to.throw(Error);
        });
      });
    });

    describe('#iso8601Time', () => {
      describe('when given a valid iso8601Time', () => {
        it('creates a valid matcher', () => {
          expect(iso8601Time('T22:44:30.652Z')).to.be.an('object');
          expect(iso8601Time()).to.be.an('object');
        });
      });
      describe('when given an invalid iso8601Time', () => {
        it('returns an error', () => {
          expect(() => {
            iso8601Time('abc');
          }).to.throw(Error);
        });
      });
    });

    describe('#iso8601Date', () => {
      describe('when given a valid iso8601Date', () => {
        it('creates a valid matcher', () => {
          expect(iso8601Date('2017-12-05')).to.be.an('object');
          expect(iso8601Date()).to.be.an('object');
        });
      });
      describe('when given an invalid iso8601Date', () => {
        it('returns an error', () => {
          expect(() => {
            iso8601Date('abc');
          }).to.throw(Error);
        });
      });
    });

    describe('#iso8601DateTime', () => {
      describe('when given a valid iso8601DateTime', () => {
        it('creates a valid matcher', () => {
          expect(iso8601DateTime('2015-08-06T16:53:10+01:00')).to.be.an(
            'object'
          );
          expect(iso8601DateTime()).to.be.an('object');
        });
      });
      describe('when given an invalid iso8601DateTime', () => {
        it('returns an error', () => {
          expect(() => {
            iso8601DateTime('abc');
          }).to.throw(Error);
        });
      });
    });

    describe('#iso8601DateTimeWithMillis', () => {
      describe('when given a valid iso8601DateTimeWithMillis', () => {
        it('creates a valid matcher', () => {
          expect(
            iso8601DateTimeWithMillis('2015-08-06T16:53:10.123+01:00')
          ).to.be.an('object');
          expect(
            iso8601DateTimeWithMillis('2015-08-06T16:53:10.537357Z')
          ).to.be.an('object');
          expect(iso8601DateTimeWithMillis('2020-12-10T09:01:29.06Z')).to.be.an(
            'object'
          );
          expect(iso8601DateTimeWithMillis('2020-12-10T09:01:29.1Z')).to.be.an(
            'object'
          );
          expect(iso8601DateTimeWithMillis()).to.be.an('object');
        });
      });
      describe('when given an invalid iso8601DateTimeWithMillis', () => {
        it('returns an error', () => {
          expect(() => {
            iso8601DateTimeWithMillis('abc');
          }).to.throw(Error);
        });
      });
    });

    describe('#extractPayload', () => {
      describe('when given an object with no matchers', () => {
        const object = {
          some: 'data',
          more: 'strings',
          an: ['array'],
          someObject: {
            withData: true,
            withNumber: 1,
          },
        };

        it('returns just that object', () => {
          expect(extractPayload(object)).to.deep.equal(object);
        });
      });

      describe('when given an object with null values', () => {
        const object = {
          some: 'data',
          more: null,
          an: [null],
          someObject: {
            withData: true,
            withNumber: 1,
            andNull: null,
          },
        };

        it('returns just that object', () => {
          expect(extractPayload(object)).to.deep.equal(object);
        });
      });

      describe('when given an object with some matchers', () => {
        const someMatchers = {
          some: somethingLike('data'),
          more: 'strings',
          an: ['array'],
          another: eachLike('this'),
          someObject: {
            withData: somethingLike(true),
            withTerm: term({ generate: 'this', matcher: 'this|that' }),
            withNumber: 1,
            withAnotherNumber: somethingLike(2),
          },
        };

        const expected = {
          some: 'data',
          more: 'strings',
          an: ['array'],
          another: ['this'],
          someObject: {
            withData: true,
            withTerm: 'this',
            withNumber: 1,
            withAnotherNumber: 2,
          },
        };

        it('returns without matching guff', () => {
          expect(extractPayload(someMatchers)).to.deep.equal(expected);
        });
      });

      describe('when given a simple matcher', () => {
        it('removes all matching guff', () => {
          const expected = 'myawesomeword';

          const matcher = term({
            generate: 'myawesomeword',
            matcher: '\\w+',
          });

          expect(isMatcher(matcher)).to.eq(true);
          expect(extractPayload(matcher)).to.eql(expected);
        });
      });
      describe('when given a complex nested object with matchers', () => {
        it('removes all matching guff', () => {
          const o = somethingLike({
            stringMatcher: {
              awesomeSetting: somethingLike('a string'),
            },
            anotherStringMatcher: {
              nestedSetting: {
                anotherStringMatcherSubSetting: somethingLike(true),
              },
              anotherSetting: term({ generate: 'this', matcher: 'this|that' }),
            },
            arrayMatcher: {
              lotsOfValueregex: eachLike('useful', { min: 3 }),
            },
            arrayOfMatcherregex: {
              lotsOfValueregex: eachLike(
                {
                  foo: 'bar',
                  baz: somethingLike('bat'),
                },
                { min: 3 }
              ),
            },
          });

          const expected = {
            stringMatcher: {
              awesomeSetting: 'a string',
            },
            anotherStringMatcher: {
              nestedSetting: {
                anotherStringMatcherSubSetting: true,
              },
              anotherSetting: 'this',
            },
            arrayMatcher: {
              lotsOfValueregex: ['useful', 'useful', 'useful'],
            },
            arrayOfMatcherregex: {
              lotsOfValueregex: [
                {
                  baz: 'bat',
                  foo: 'bar',
                },
                {
                  baz: 'bat',
                  foo: 'bar',
                },
                {
                  baz: 'bat',
                  foo: 'bar',
                },
              ],
            },
          };

          expect(extractPayload(o)).to.deep.equal(expected);
        });
      });
    });
  });
});
