# msgpack-js-micro
msgpack - A super-lightweight JS implementation of the [msgpack](https://msgpack.org/) data encoding format.

This is a very quick and extremely small Javascript implementation of msgpack, for ease of embedding. Both browser- and Node.js-ready.

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
  utf8: "\udead\ubeef", // strings are utf8-encoded by default
  37: 79.995,
  ar: [1, 2, 3],
  buffer: Uint8Array([1,2,3]), // uses msgpack's binary format
};

var encoded = msgpack.encode(obj);

var decoded = msgpack.decode(encoded);

console.log(decoded);
```

## General Reference:


### msgpack.encode(data:\*, settings?:object={}): string | ArrayBuffer

Encodes an object in the msgpack format

#### `data: *`
The object data to encode in msgpack-format

#### `settings?: object`
Settings to use when encoding. An object with the following properties:

**`settings.returnType?: "string" | "buffer" | "arraybuffer" = "string"`**
The datatype in which to return the msgpack encoded data.

`"string"` is a regular JS string.
`"buffer"` is a Node.js Buffer (falls back to `"arraybuffer"` in the browser).
`"arraybuffer"` is an `ArrayBuffer` object.

**`settings.stringEncoding?: "utf8" | "latin1" = "utf8"`**
How strings should be encoded.

`"utf8"` strings will be encoded in UTF-8 formatting
`"latin1"` strings will be considered as char-buffers; for unicode characters, bits beyond the first 8 will be truncated

----------------------------------------------------------------

### msgpack.decode(buffer: string | ArrayBuffer | DataView | TypedArray | Buffer, settings?:object={}): *

Decodes the msgpacked buffer and returns the decoded object.

#### `buffer: string | ArrayBuffer | TypedArray | Buffer`
The msgpack buffer of data. This can be a JS string, an `ArrayBuffer` or `DataView` object, or an instance of any `TypedArray`. It may also be a Node.js `Buffer`.

#### `settings?: object`
Settings to use when decoding. An object with the following properties:

**`settings.binaryType?: "string" | "buffer" | "arraybuffer" = "string"`**
The JS object type to which to decode binary msgpack entities.

`"string"` is a regular JS string.
`"buffer"` is a Node.js Buffer (falls back to `"arraybuffer"` in the browser).
`"arraybuffer"` is an `ArrayBuffer` object.

**`settings.stringEncoding?: "utf8" | "latin1" = "utf8"`**
How strings will be decoded.

`"utf8"` strings will be decoded where UTF8 sequences are found.
`"latin1"` strings will be considered char-buffers. The returned strings will not contain unicode characters.

----------------------------------------------------------------

### msgpack.extend(extensionObject: object)

Adds an extension format to msgpack.

#### `extensionObject: object`
The extension object properties. This object contains the follow properties, specifying how the extension integrates:

**`extensionObject.type: int`**
The code for the msgpack extension (0 to 127).

**`extensionObject.varType?: string = "object"`**
The JS value type this extension object deals with. When encoding, all JS values of this type will be passed through the extension's `encode` handler. If the `encode` handler accepts it, msgpack encodes the value in the extension's format. If the handler rejects it, it is passed to all other extension handlers of this type. If no extension handlers accept the value, it is encoded normally.

**`extensionObject.encode: function`**
The extension's `encode` handler. This handler should follow the format:

`function encode(object:*): boolean   |   string | ArrayBuffer | DataView | Buffer | TypedArray`

If this callback returns `false`, the extension rejects the value, and it is passed onto the next extension handlers or encoded normally.
If this callback returns any buffer type (`string`, `ArrayBuffer`, `DataView`, `Buffer`, or any typed array), the extension accepts the value, and it is encoded in the extension format.

**`extensionObject.decode: function`**
The extension's `decode` handler. This handler should follow the format:

`function decode(buffer:string): *`

When the extension's type is found in the packed data, this callback will be called with the sub-buffer as a string, and is responsible to decode and return the encoded value.


## TODO:
- The Timestamp extension type.
- Thoroughly test
