class XFormMap {
    constructor(fn, xform) {
        this.xform = xform;
        this.fn = fn;
    }

    "@@transducer/init"() {
        return this.xform["@@transducer/init"]();
    }

    "@@transducer/result"(res) {
        return this.xform["@@transducer/result"](res);
    }

    "@@transducer/step"(acc, cur) {
        return this.xform["@@transducer/step"](acc, this.fn(cur));
    }

    static of(fn) {
        return xform => {
            return new XFormMap(fn, xform);
        };
    }
}

class XFormNth {
    constructor(nth, xform) {
        this.xform = xform;
        this.nth = nth;
        this.i = 0;
    }

    "@@transducer/init"() {
        return this.xform["@@transducer/init"]();
    }

    "@@transducer/result"(res) {
        return this.xform["@@transducer/result"](res);
    }

    "@@transducer/step"(acc, cur) {
        const res = this.xform["@@transducer/step"](acc, cur);
        if (this.i++ === this.nth) {
            return new Reduced(
                this.xform["@@transducer/step"](this.xform["@@transducer/init"](), cur)
            );
        } else {
            return res;
        }
    }

    static of(nth) {
        return xform => {
            return new XFormNth(nth, xform);
        };
    }
}

class redArr {
    "@@transducer/init"() {
        return [];
    }

    "@@transducer/result"(res) {
        return res;
    }

    "@@transducer/step"(acc, cur) {
        acc.push(cur);
        return acc;
    }
}

class Reduced {
    constructor(value) {
        this["@@transducer/reduced"] = true;
        this["@@transducer/value"] = value;
    }
}

function transduce(xform, reducer, init, coll) {
    xform = xform(reducer);
    if (init === undefined) {
        init = xform["@@transducer/init"]();
    }
    return reduce(xform, init, coll);
}

function reduce(xform, init, coll) {
    let result = init;
    let index = -1;
    const len = coll.length;
    while (++index < len) {
        result = xform["@@transducer/step"](result, coll[index]);
        if (result instanceof Reduced) {
            result = result["@@transducer/value"];
            break;
        }
    }
    return xform["@@transducer/result"](result);
}

let compose = (...fns) => data => fns.reduce((acc, cur) => cur(acc), data);

transduce(
    compose(XFormMap.of(x => x + 1), XFormNth.of(2)),
    new redArr(),
    [],
    [1, 222, 3]
); // [4]
