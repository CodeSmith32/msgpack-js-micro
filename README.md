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
  date: new Date(2019,1,1), // Date instances use msgpack's Timestamp format
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
  date: new Date(2019,1,1), // Date instances use msgpack's Timestamp format
};

var encoded = msgpack.encode(obj);

var decoded = msgpack.decode(encoded);

console.log(decoded);
```

## General Reference:

### msgpack.encode(data, settings = {})

Encodes an object in the msgpack format. If a cyclic structure is detected, an error will be thrown.

#### `data: any`
The object data to encode in msgpack-format.

#### `settings?: object`
Settings to use when encoding. This is an object with the following properties:

**`settings.returnType?: "string" | "buffer" | "arraybuffer"`**

The datatype in which to return the msgpack encoded data.

- `"string"` is a regular JS string.
- `"buffer"` is a Node.js Buffer (falls back to `"arraybuffer"` in the browser).
- `"arraybuffer"` is an `ArrayBuffer` object.

Default: `"string"`

**`settings.stringEncoding?: "utf8" | "latin1"`**

Specifies how Javascript strings should be encoded.

- `"utf8"` strings will be encoded in UTF-8 formatting
- `"latin1"` strings will be considered as char-buffers; for unicode characters, bits beyond the first 8 will be truncated

Default: `"utf8"`

#### Return: `string | Buffer | ArrayBuffer`
Returns a buffer of data encoding the input object structure in the msgpack format. The type of this data will be the type selected by the `returnType` setting (which defaults to `string`).

----------------------------------------------------------------

### msgpack.decode(buffer, settings = {})

Decodes the msgpacked buffer and returns the decoded object.

#### `buffer: string | ArrayBuffer | DataView | TypedArray | Buffer`
The msgpack buffer of data. This can be a JS string, an `ArrayBuffer` or `DataView` object, or an instance of any `TypedArray`. It may also be a Node.js `Buffer`.

#### `settings?: object`
Settings to use when decoding. An object with the following properties:

**`settings.binaryType?: "string" | "buffer" | "arraybuffer"`**

The JS object type to convert decoded binary msgpack entities into.

- `"string"` is a regular JS string.
- `"buffer"` is a Node.js Buffer (falls back to `"arraybuffer"` in the browser).
- `"arraybuffer"` is an `ArrayBuffer` object.

Default: `"string"`

**`settings.stringEncoding?: "utf8" | "latin1"`**

Specifies how strings will be decoded.

- `"utf8"` strings will be decoded where UTF8 sequences are found.
- `"latin1"` strings will be considered char-buffers. The returned strings will not contain unicode characters.

Default: `"utf8"`

#### Return: `any`
Returns the Javascript object structure decoded from the packed data.

----------------------------------------------------------------

### msgpack.extend(extensionObject)

Adds an extension format to msgpack.

#### `extensionObject: object`
The extension object properties. This object contains the follow properties, specifying how the extension integrates:

**`extensionObject.type: int`**

The code for the msgpack extension (0 to 127).

**`extensionObject.varType?: string`**

The JS value type this extension object deals with. When encoding, all JS values of this type will be passed through the extension's `encode` handler. If the `encode` handler accepts it, msgpack encodes the value in the extension's format. If the handler rejects it, it is passed to all other extension handlers of this type. If no extension handlers accept the value, it is encoded normally.

Default: `"object"`

**`extensionObject.encode: function`**

The extension's `encode` handler. This handler should follow the format:

`function encode(object: any): boolean | string | ArrayBuffer | DataView | Buffer | TypedArray`

If this callback returns `false`, the extension rejects the value, and it is passed onto the next extension handlers or encoded normally.
If this callback returns any buffer type (`string`, `ArrayBuffer`, `DataView`, `Buffer`, or any typed array), the extension accepts the value, and it is encoded in the extension format.

**`extensionObject.decode: function`**

The extension's `decode` handler. This handler should follow the format:

`function decode(buffer:string): any`

When the extension's type is found in the packed data, this callback will be called with the sub-buffer as a string, and is responsible to decode and return the encoded value.

#### Return: `void`
The `msgpack.extend()` function returns `undefined`.

----------------------------------------------------------------

## TODO:
- Thoroughly test
