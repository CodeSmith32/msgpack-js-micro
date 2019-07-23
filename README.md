# msgpack-js-micro
msgpack - A super-lightweight JS implementation of the [msgpack](https://msgpack.org/) data encoding format.

This is a very quick and extremely small Javascript implementation of msgpack, for ease of embedding. Both browser- and Node.js-ready.

**Browser:**

```
<script type="text/javascript" src="msgpack.min.js"></script>
<script type="text/javascript">
var obj = {
  "hello": "world",
  utf8: "\udead\ubeef", // strings are utf8-encoded
  37: 79.995,
  ar: [1, 2, 3],
  buffer: Uint8Array([1,2,3]), // uses msgpack's binary format
};

var encoded = msgpack.encode(obj);

var decoded = msgpack.decode(encoded);

console.log(decoded);
</script>
```

**Node.js:**

```
const msgpack = require("./msgpack.min.js");

var obj = {
  "hello": "world",
  utf8: "\udead\ubeef", // strings are utf8-encoded
  37: 79.995,
  ar: [1, 2, 3],
  buffer: Uint8Array([1,2,3]), // uses msgpack's binary format
};

var encoded = msgpack.encode(obj);

var decoded = msgpack.decode(encoded);

console.log(decoded);
```

## General Reference:

```
msgpack: {
  // Encode an object in the msgpack format
  encode(
    // The data to encode
    data: *,
    
    // If the generated content should be returned as an
    // ArrayBuffer; otherwise returned as a string
    asBuffer?:boolean = false
  ): string | ArrayBuffer,

  // Decode a msgpack-formatted string / ArrayBuffer /
  // TypedArray into Javascript form
  decode(
    // The msgpack buffer to decode
    buffer: string | ArrayBuffer | TypedArray,
    
    // Whether to decode the msgpack binary types
    // as ArrayBuffers
    binsAsBuffers?: boolean = false
  ): *,
  
  extend(extensionObject: {
    // The code for the msgpack extension (0 to 127)
    type: int,
    
    // All values of this type (tested via 'typeof')
    // will pass through this extension's hand. If
    // the extension rejects it, it will instead be
    // encoded normally.
    varType?: string = "object",

    // The handle function for encoding. If it
    // returns a string, the string is used as the
    // extension buffer data. If it returns boolean
    // 'false', the extension rejects the data, and
    // it will be processed by other watching
    // extensions or ultimately be encoded normally.
    encode: (
      // The object to be encoded (or rejected if the
      // extension determines it does not meet some
      // criteria).
      object:* 
    ) => boolean,
    
    // The handle function for decoding. Accepts the
    // buffer and returns the decoded object.
    decode: (
      // The buffer to be decoded
      string:*
    ) => *,
  }),
}
```

## TODO:
- Support for Node.js Buffers for input / output.
- The Timestamp extension type.
- Make UTF-encoded strings optional
- Thoroughly test
