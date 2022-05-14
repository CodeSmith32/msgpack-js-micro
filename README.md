# msgpack-js-micro
msgpack - A fast, lightweight, and extremely compatible JS implementation of the [msgpack](https://msgpack.org/) data encoding format.

This is a simple, small, and very portable Javascript implementation of msgpack. Runs on browsers (back as far as IE5) as well as Node.js.

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

## General Reference:

### new msgpack(encodeDefaults, decodeDefaults)

The msgpack constructor. Creates a new msgpack encoder / decoder instance with its own extensions and default settings. You may also use msgpack without instantiating it: The functions described below (`msgpack.encode`, `msgpack.decode`, `msgpack.extend`, etc.) are both msgpack instance methods as well as static properties on the msgpack constructor function.

#### `encodeDefaults?: object | null`

Optional. Default encode settings for the new msgpack instance. If this value is a non-null object, it is passed directly to `msgpack.encode.defaults(...)`. See `msgpack.encode.defaults(...)` and the `msgpack.encode(...)` `settings` parameter for more details.

#### `decodeDefaults?: object | null`

Optional. Default decode settings for the new msgpack instance. If this value is a non-null object, it is passed directly to `msgpack.decode.defaults(...)`. See `msgpack.decode.defaults(...)` and the `msgpack.decode(...)` `settings` parameter for more details.

Notice, both arguments are optional. However, to only provide a value for `decodeDefaults` and no value for `encodeDefaults`, pass `null` for `encodeDefaults` and then an object for `decodeDefaults`. For instance: `new msgpack(null, {bigInts:true})`.

----------------------------------------------------------------

### msgpack.encode(data, settings = {})

Encodes an object in the msgpack format. If a cyclic structure is detected, an error will be thrown.

The following object types are encoded:

- Number (encoded as signed / unsigned integer or float / double, best datatype chosen to preserve precision)
- BigInt (encoded as signed / unsigned integer, 64-bit when big enough)
- String (encoded as string, UTF-8 or Latin-1 encoded)
- ArrayBuffer, Buffer, TypedArray (encoded as binary)
- Array (encoded as array)
- Object (encoded as map)
- Date (encoded in core Timestamp extension format)

Notices:

When a BigInt is encoded, if it's small enough, it won't be encoded as a 64-bit integer. Thus, if decoding, even when `bigInts` is enabled, the decoded number will not be a BigInt, since a BigInt is not necessary to accurately represent the precision.

Date objects do not contain timezone information, but instead report UTC time offset by the local system's timezone. Thus, decoded Date objects, when printed, may appear to report a different time than was encoded due to the offset from UTC.

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

**`settings.useDoubles?: boolean`**

If numbers should be encoded as doubles when necessary to maintain best precision. When `true`, each decimal number will be encoded as a 32-bit float if a float can accurately hold its precision, and as a double if a float cannot. When `false`, only floats are used, thus truncating some precision on some decimal numbers. If the data being packed contains many decimal numbers that do not need precision beyond floating point range (i.e., some coordinate data), turning this setting on may help reduce data size.

Default: `true`

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

**`settings.bigInts?: boolean`**

Whether or not to decode 64-bit integers as BigInts (if BigInts are supported). Other numeric types will be decoded as numbers.

Notice: when a BigInt is encoded, if it's small enough, it won't be encoded as a 64-bit integer. This means that, when decoding, even if this setting is enabled, the decoded number will not be a BigInt, since a BigInt is not necessary to accurately represent the precision. If it is imperative that a certain value must be a BigInt after decoding, despite how big it is, it should be casted as a BigInt after decoding.

#### Return: `any`
Returns the Javascript object structure decoded from the packed data.

----------------------------------------------------------------

### msgpack.encode.defaults(params)

Get / set default parameters for the `msgpack.encode` function. If `params` is a string, the function will return the default value used for the setting by that name. If `params` is an object, the keys will be interpreted as setting names, and the values will replace the current defaults.

Notice, when changing setting default values, values are handled very strictly, and invalid values will trigger an error.

#### `params: string | object`
If this parameter is a string, then the current default value for the encode setting by this name will be returned.

If this parameter is an object, it should have any one or more of the following keys to configure the default values for encode settings:

**`params.returnType?: "string" | "buffer" | "arraybuffer"`**

The datatype in which to return the msgpack encoded data. See `msgpack.encode(...)` for encode setting details.

**`params.stringEncoding?: "utf8" | "latin1"`**

Specifies how Javascript strings should be encoded. See `msgpack.encode(...)` for encode setting details.

**`params.useDoubles?: boolean`**

Indicates if doubles should be used to encode numbers when necessary. Defaults to `true`. See `msgpack.encode(...)` for encode setting details.

#### Return: `any | void`
If a string is provided as the parameter, the value returned is the default value for the setting by that name. Specifically:

- Passing `"returnType"` returns a string
- Passing `"stringEncoding"` returns a string
- Passing `"useDoubles"` returns a boolean

If an object is provided as the parameter to assign defaults, `undefined` is returned.

----------------------------------------------------------------

### msgpack.decode.defaults(params)

Get / set default parameters for the `msgpack.decode` function. If `params` is a string, the function will return the default value used for the setting by that name. If `params` is an object, the keys will be interpreted as setting names, and the values will replace the current defaults.

Notice, when changing setting default values, values are handled very strictly, and invalid values will trigger an error.

#### `params: string | object`
If this parameter is a string, then the current default value for the decode setting by this name will be returned.

If this parameter is an object, it should have any one or more of the following keys to configure the default values for decode settings:

**`params.binaryType?: "string" | "buffer" | "arraybuffer"`**

The JS object type to convert decoded binary msgpack entities into. See `msgpack.decode(...)` for decode setting details.

**`params.stringEncoding?: "utf8" | "latin1"`**

Specifies how strings will be decoded. See `msgpack.decode(...)` for decode setting details.

**`params.bigInts?: boolean`**

Whether or not to decode 64-bit integers as BigInts (if BigInts are supported). See `msgpack.decode(...)` for decode setting details.

#### Return: `any | void`
If a string is provided as the parameter, the value returned is the default value for the setting by that name. Specifically:

- Passing `"binaryType"` returns a string
- Passing `"stringEncoding"` returns a string
- Passing `"bigInts"` returns a boolean

If an object is provided as the parameter to assign defaults, `undefined` is returned.

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
