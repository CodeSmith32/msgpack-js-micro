# msgpack-js-micro
msgpack - A fast, lightweight, and extremely compatible JS implementation of the [msgpack](https://msgpack.org/) data encoding format.

This is a simple, small, and very portable Javascript implementation of msgpack. Runs on browsers (back as far as IE5) as well as Node.js.

Notice: This implementation is still fairly new, and may have bugs. If you find any bugs, please report them immediately, and I will try to get them fixed as soon as possible.

**Browser:**

```
<script type="text/javascript" src="msgpack.min.js"></script>
<script type="text/javascript">
var obj = {
  "hello": "world",
  utf8: "\udead\ubeef", // strings are utf8-encoded by default
  37: 79.995,
  ar: [1, 2, 3],
  buffer: Uint8Array([1,2,3]), // uses msgpack's binary format
  date: new Date(2019,1,1), // Date instances use msgpack's Timestamp extension format
  bigint: 31415926535897932384n, // large enough BigInts will be encoded as 64bit ints
};

// use msgpack directly:

var encoded = msgpack.encode(obj);

var decoded = msgpack.decode(encoded);

console.log(decoded);

// or create msgpack instances:

var myMsgPack = new msgpack(
  {returnType: "arraybuffer"},
  {binaryType: "arraybuffer"}
);

encoded = myMsgPack.encode(obj);

decoded = myMsgPack.decode(obj);

console.log(decoded);

</script>
```

**Node.js:**

```
const msgpack = require("./msgpack.min.js");

var obj = {
  "hello": "world",
  utf8: "\udead\ubeef", // strings are utf8-encoded by default
  37: 79.995,
  ar: [1, 2, 3],
  buffer: Uint8Array([1,2,3]), // uses msgpack's binary format
  date: new Date(2019,1,1), // Date instances use msgpack's Timestamp extension format
  bigint: 31415926535897932384n, // large enough BigInts will be encoded as 64bit ints
};

// use msgpack directly:

var encoded = msgpack.encode(obj);

var decoded = msgpack.decode(encoded);

console.log(decoded);

// or create msgpack instances:

var myMsgPack = new msgpack(
  {returnType: "arraybuffer"},
  {binaryType: "arraybuffer"}
);

encoded = myMsgPack.encode(obj);

decoded = myMsgPack.decode(obj);

console.log(decoded);
```

Fully supports custom type extensions:
```
// Sample "BigInt" type extension

msgpack.extend({
  type: 1, // msgpack code

  varType: "bigint", // watch value-type

  encode(n) { // encoder (return `false` to skip; see reference for details)
    var final = n < 0n ? -1n : 0n,
      c = 0n, str = "";

    while(n !== final) {
      c = n & 255n;
      str += String.fromCharCode(Number(c));
      n >>= 8n;
    }
    // add another digit if the high bit doesn't indicate the sign:
    if((c & 0x80n) !== (final & 0x80n))
      str += String.fromCharCode(Number(final & 255n));

    return str;
  },

  decode(s) { // decoder
    var n = 0n, c = 0n;

    for(var i=0n; i<s.length;i++) {
      c = BigInt(s.charCodeAt(Number(i)));
      n |= c << i*8n;
    }
    if(c & 0x80n) n |= -1n << BigInt(s.length)*8n;

    return n;
  }
});
```

Visit [github.com/CodeSmith32/msgpack-js-micro](https://github.com/CodeSmith32/msgpack-js-micro) for the usage reference.