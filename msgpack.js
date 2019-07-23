/// micro msgpack library
/// version 1.0.0
/// by Codesmith32
/// https://github.com/CodeSmith32/msgpack-js-micro

this.msgpack = (function(window){
	'use strict';
	var t = {};

	// if not supported, just a blank class
	var Uint8Array = window.Uint8Array || function(){},
		ArrayBuffer = window.ArrayBuffer || function(){},
		bis = window.BigInt ? {bits: window.BigInt(32), mask: window.BigInt(0xffffffff)} : {};

	function normalizeString(buf) {
		if(typeof buf=="string")
			return buf;
		if(buf && buf.constructor && !(buf instanceof Uint8Array)
			&& buf.constructor.name.match(/^(Big)?(Uint|Int|Float)(8|16|32|64)(Clamped)?Array$/))
			buf = new Uint8Array(buf.buffer,buf.byteOffset,buf.byteLength);
		if(buf instanceof ArrayBuffer)
			buf = new Uint8Array(buf);
		if(buf instanceof Uint8Array) {
			var s="";
			for(var i=0;i<buf.length;i+=128)
				s+=String.fromCharCode.apply(null,buf.subarray(i,i+128));
			return s;
		}
		throw new Error("MsgPack Error: Cannot normalize to string for value of type "+(typeof buf)+(buf ? " "+buf.constructor.name : ""));
	}
	function toBuffer(str) {
		var ar = new Uint8Array(str.length);
		for(var i=0;i<str.length;i++)
			ar[i] = str.charCodeAt(i);
		return ar;
	}
	var log = Math.log,
		lg2 = log(2),
		lg10 = log(10),
		log10 = Math.log10 || function(n) {return log(n)/lg10},
		log2 = Math.log2 || function(n) {return log(n)/lg2},
		abs = Math.abs,
		floor = Math.floor,
		round = Math.round,
		pow = Math.pow,
		// denormal number multipliers:
		f32_dnm = pow(2,126+23),
		f64_dnm1 = pow(2,1022),
		f64_dnm2 = pow(2,52);

	function needsF64(n) {
		n = abs(n);
		var lg = log2(n);
		if(lg < -120 || lg > 120) return true;

		n = n / pow(2,floor(lg) - 23);
		return n !== floor(n);
	}

	function encodeUTF(str) {
		return str.replace(/[\x80-\uffff]/g,function(c){
			c = c.charCodeAt();
			return c < 0x0800
				? String.fromCharCode(0xc0 | c>>6, 0x80 | c&63)
				: String.fromCharCode(0xe0 | c>>12&15, 0x80 | c>>6&63, 0x80 | c&63);
		});
	}
	function decodeUTF(str) {
		return str.replace(/([\xc0-\xdf][\x80-\xbf])|([\xe0-\xef][\x80-\xbf]{2})|([\xf0-\xf7][\x80-\xbf]{3})/g,function(m,a,b,c){
			var c1 = m.charCodeAt(0),
				c2 = m.charCodeAt(1),
				c3 = m.length>2 && m.charCodeAt(2),
				c4 = m.length>3 && m.charCodeAt(3);

			if(a) return String.fromCharCode((c1&31)<<6 | (c2&63));
			if(b) return String.fromCharCode((c1&15)<<12 | (c2&63)<<6 | (c3&63));
			if(c) return String.fromCharCode((c1&7)<<18 | (c2&63)<<12 | (c3&63)<<6 | (c4&63));
		});
	}

	function BinReader(data) {
		var t=this; if(!(t instanceof BinReader)) throw new Error("Bad instantiation of object msgpack::BinReader");
		var i=0;
		data = normalizeString(data);

		function expect(n) {if(i+n > data.length) throw new Error("MsgPack Error: Unexpected end of data")}
		function byte(c) {return data.charCodeAt(i++) & 255}

		t.ui8 = function() {expect(1); return byte()}
		t.i8 = function() {expect(1); var c = byte(); if(c&0x80) c |= (-1^255); return c}
		t.ui16 = function() {expect(2); return byte()*256 + byte()}
		t.i16 = function() {expect(2); var c = byte()*256 + byte(); if(c&0x8000) c |= (-1^65536); return c}
		t.ui32 = function() {expect(4); return byte()*16777216 + byte()*65536 + byte()*256 + byte() >>> 0}
		t.i32 = function() {expect(4); return byte()*16777216 + byte()*65536 + byte()*256 + byte()}
		t.f32 = function() {
			expect(4);
			var n = byte()*16777216 + byte()*65536 + byte()*256 + byte(),
				s = !!(n&0x80000000), e = (n>>23)&255, m = (n&0x7fffff);

			// special cases
			if(e === 255) {
				if(m === 0) return s ? -Infinity : Infinity; // infinity
				return NaN; // NaN
			}
			if(e === 0) return m / f32_dnm; // denormal numbers

			m += 0x800000;
			return m * (s?-1:1) * pow(2,e-127 - 23);
		}
		t.f64 = function() {
			expect(8);
			var a = byte()*16777216 + byte()*65536 + byte()*256 + byte(),
				b = byte()*16777216 + byte()*65536 + byte()*256 + byte(),
				s = !!(a&0x80000000), e = (a>>20 & 2047), m = (a&0xfffff)*0x100000000 + b;

			if(e === 2047) {
				if(m === 0) return s ? -Infinity : Infinity; // infinity
				return NaN; // NaN
			}
			if(e === 0) return m / f64_dnm1 / f64_dnm2;

			return (m/f64_dnm2 + 1) * (s?-1:1) * pow(2,e-1023);
		}
		t.buf = function(l) {expect(l); var s=data.slice(i,i+l); i+=l; return s}
		t.eof = function() {return i >= data.length}
	}

	function BinWriter() {
		var t=this; if(!(t instanceof BinWriter)) throw new Error("Bad instantiation of object msgpack::BinWriter");
		var data = "";

		function byte(n) {data += String.fromCharCode(n&255)}

		t.i8 = function(n) {byte(n); return t}
		t.i16 = function(n) {byte(n>>8); byte(n); return t}
		t.i32 = function(n) {byte(n>>24); byte(n>>16); byte(n>>8); byte(n); return t}
		t.f32 = function(n) {
			// special cases
			if(isNaN(n)) {data += "\x7f\xc0\0\0"; return t}
			if(n === Infinity) {data += "\x7f\x80\0\0"; return t}
			if(n === -Infinity) {data += "\xff\x80\0\0"; return t}
			if(n === 0) {data += "\0\0\0\0"; return t}

			var s = n<0, v = s?-n:n, e = floor(log2(v)), m = round(v*pow(2,23-e)) - 0x800000;
			e += 127;
			if(m > 0x7fffff) {e++; m &= 0x7fffff} // round lost precision
			if(e > 254) {data += s ? "\xff\x80\0\0" : "\x7f\x80\0\0"; return t} // imprecise infinity
			if(e <= 0) {e = 0; m = round(v*f32_dnm)} // denormal number

			// seeeeeee emmmmmmm mmmmmmmm mmmmmmmm
			byte((s<<7) | (e>>1 & 0x7f));
			byte((e<<7) | (m>>16 & 0x7f));
			byte(m>>8);
			byte(m);

			return t;
		}
		t.f64 = function(n) {
			// special cases
			if(isNaN(n)) {data += "\x7f\xf8\0\0\0\0\0\0"; return t}
			if(n === Infinity) {data += "\x7f\xf0\0\0\0\0\0\0"; return t}
			if(n === -Infinity) {data += "\xff\xf0\0\0\0\0\0\0"; return t}
			if(n === 0) {data += "\0\0\0\0\0\0\0\0"; return t}

			var s = n<0, v = s?-n:n, e = floor(log2(v)), m = round(e>0 ? v*pow(2,52-e) : v*pow(2,52)*pow(2,-e)) - 0x10000000000000;
			e += 1023;
			if(m > 0x7fffffffffffff) {e++; m -= 0x80000000000000} // round lost precision
			if(e > 2046) {data += s ? "\xff\xf0\0\0\0\0\0\0" : "\x7f\xf0\0\0\0\0\0\0"; return t} // imprecise infinity
			if(e <= 0) {e = 0; m = round(v*f64_dnm1*f64_dnm2)} // denormal number

			// seeeeeee eeeemmmm mmmmmmmm mmmmmmmm mmmmmmmm mmmmmmmm mmmmmmmm mmmmmmmm
			byte((s<<7) | (e>>4 & 0x7f));
			byte((e<<4) | (m/0x1000000000000 & 0x0f));
			byte(m/0x10000000000);
			byte(m/0x100000000);
			byte(m/0x1000000);
			byte(m/0x10000);
			byte(m/0x100);
			byte(m);

			return t;
		}
		t.buf = function(s) {data += s; return t}

		t.data = function() {return data}
	}

	var exts = {}, extTypes = {};
	t.extend = function(params/* {type:int, encode:(obj:*)=>string|false, decode:(data:string)=>obj:*} */) {
		var type = params.type,
			tpof = params.varType || 'object',
			encode = params.encode,
			decode = params.decode,
			ext = {
				enc: encode,
				dec: decode,
				ty: type
			};

		if(typeof type !== "number" || type < 0 || type > 127)
			throw new Error("MsgPack Error: Failed to add extension with type code: "+(typeof type)+" "+(+type));

		if(typeof encode !== "function") throw new Error("MsgPack Error: Failed to add extension; missing 'encode' function");
		if(typeof decode !== "function") throw new Error("MsgPack Error: Failed to add extension; missing 'decode' function");

		if(type in extTypes) throw new Error("MsgPack Error: Failed to register extension with code "+type+"; extension code already in use");

		(exts[tpof] = exts[tpof] || []).push(ext);
		extTypes[type] = ext;
	}

	function coreExtend(params) {
		var type = params.type,
			tpof = params.varType || 'object',
			ext = {
				enc: params.encode,
				dec: params.decode,
				ty: type
			};

		if(type >= 0) throw new Error("MsgPack Error: Failed to add core extension; type code must be negative: "+(+type));

		(exts[tpof] = exts[tpof] || []).push(ext);
		extTypes[type] = ext;
	}

	t.encode = function(obj,asBuf/*=false*/) {
		asBuf = !!asBuf;
		var data = new BinWriter();

		var iterated = [];

		function encode(o) {
			var tp = typeof o;
			if(tp in exts) {
				for(var i=0,ext,buf;i<exts[tp].length;i++) {
					ext = exts[tp][i];
					buf = ext.enc(o);
					if(buf === false) continue;
					if(typeof buf !== "string")
						throw new Error("MsgPack Error: Extension code "+ext.ty+" failed to return a string");

					if(buf.length === 1) data.i8(0xd4);
					else if(buf.length === 2) data.i8(0xd5);
					else if(buf.length === 4) data.i8(0xd6);
					else if(buf.length === 8) data.i8(0xd7);
					else if(buf.length === 16) data.i8(0xd8);
					else if(buf.length < 256) data.i8(0xc7).i8(buf.length);
					else if(buf.length < 65536) data.i8(0xc8).i16(buf.length);
					else data.i8(0xc9).i32(buf.length);

					data.i8(ext.ty).buf(buf);
				}
			}
			if(tp === "bigint" && o <= 0xffffffff) {
				o = Number(o); tp = "number";
			}
			if(o && o.constructor.name.match(/^(Big)?(Uint|Int|Float)(8|16|32|64)(Clamped)?Array$|^(ArrayBuffer|DataView)$/)) {
				// buffer
				o = normalizeString(o);
				if(o.length < 256)
					data.i8(0xc4).i8(o.length).buf(o);
				else if(o.length < 65536)
					data.i8(0xc5).i16(o.length).buf(o);
				else
					data.i8(0xc6).i32(o.length).buf(o);
			} else if(tp === null || tp === undefined) {
				// nil
				data.i8(0xc0);
			} else if(tp === "boolean") {
				// boolean
				data.i8(0xc2 + o);
			} else if(tp === "number") {
				if((o|0) === o) {
					// int
					if(o < 0) {
						// negative
						if(o >= -32)
							data.i8(o);
						else if(o >= -128)
							data.i8(0xd0).i8(o);
						else if(o >= -32768)
							data.i8(0xd1).i16(o);
						else if(o >= -0x80000000)
							data.i8(0xd2).i32(o);
						else
							data.i8(0xd3).i32(o / 0x100000000).i32(o);
					} else {
						// positive
						if(o < 128)
							data.i8(o);
						else if(o < 256)
							data.i8(0xcc).i8(o);
						else if(o < 65536)
							data.i8(0xcd).i16(o);
						else if(o <= 0xffffffff)
							data.i8(0xce).i32(o);
						else
							data.i8(0xcf).i32(o / 0x100000000).i32(o);
					}
				} else {
					// float
					if(needsF64(o))
						data.i8(0xcb).f64(o);
					else
						data.i8(0xca).f32(o);
				}
			} else if(tp === "bigint") {
				data.i8(o < 0 ? 0xd3 : 0xcf);
				data.i32(Number(o >> bi.bits)).i32(Number(o & bi.mask));
			} else if(tp === "string") {
				o = encodeUTF(o);
				if(o.length < 32)
					data.i8(0xa0 | o.length).buf(o);
				else if(o.length < 256)
					data.i8(0xd9).i8(o.length).buf(o);
				else if(o.length < 65536)
					data.i8(0xda).i16(o.length).buf(o);
				else
					data.i8(0xdb).i32(o.length).buf(o);
			} else if(tp === "object") {
				if(iterated.indexOf(o) > -1)
					throw new Error("MsgPack Error: Failed to encode object with recursive properties");
				iterated.push(o);
				if(Array.isArray(o)) {
					// array
					if(o.length < 16)
						data.i8(0x90 | o.length);
					else if(o.length < 65536)
						data.i8(0xdc).i16(o.length);
					else
						data.i8(0xdd).i32(o.length);
					for(var i=0;i<o.length;i++)
						encode(o[i]);
				} else {
					// map
					var l = 0;
					for(var i in o) {
						if(o[i] === undefined) continue;
						l++;
					}
					if(l < 16)
						data.i8(0x80 | l);
					else if(l < 65536)
						data.i8(0xde).i16(l);
					else
						data.i8(0xdf).i32(l);

					for(var i in o) {
						if(o[i] === undefined) continue;
						encode(i);
						encode(o[i]);
						if(--l < 0) throw new Error("MsgPack Error: Failed to encode transforming Proxy object");
					}
					if(l) throw new Error("MsgPack Error: Failed to encode transforming Proxy object");
				}
				iterated.pop();
			}
		}
		encode(obj);

		if(asBuf) return toBuffer(data.data());
		return data.data();
	}

	t.decode = function(buf,binsAsBufs/*=false*/) {
		binsAsBufs = !!binsAsBufs;
		var data = new BinReader(buf);

		function obj(n) {
			var o = {};
			for(var i=0;i<n;i++)
				o[decode()] = decode();
			return o;
		}
		function arr(n) {
			var o = [];
			for(var i=0;i<n;i++)
				o.push(decode());
			return o;
		}
		function bin(buf) {
			if(!binsAsBufs) return buf;

			var o = new Uint8Array(buf.length);
			for(var i=0;i<buf.length;i++)
				o[i] = buf.charCodeAt(i);
			return o.buffer;
		}
		function ext(type,buf) {
			if(!(type in extTypes)) {
				console.warn("MsgPack Warning: Failed to decode unregistered extension type "+type);
				return null;
			}
			return extTypes[type].dec(buf);
		}
		function decode() {
			var b = data.ui8(), l;
			if((b&0x80) === 0) return b; // +fixint
			if((b&0xe0) === 0xe0) return b|(-1^255); // -fixint
			if((b&0xf0) === 0x80) return obj(b&15); // fixmap
			if((b&0xf0) === 0x90) return arr(b&15); // fixarray
			if((b&0xe0) === 0xa0) return decodeUTF(data.buf(b&31)); // fixstr
			switch(b) {
				case 0xc1: // ehh.. just map it to nil
				case 0xc0: return null; // nil
				case 0xc2: return false; // false
				case 0xc3: return true; // true
				case 0xc4: return bin(data.buf(data.ui8())); // bin 8
				case 0xc5: return bin(data.buf(data.ui16())); // bin 16
				case 0xc6: return bin(data.buf(data.ui32())); // bin 32
				case 0xc7: l = data.ui8(); return ext(data.ui8(),data.buf(l)); // ext 8
				case 0xc8: l = data.ui16(); return ext(data.ui8(),data.buf(l)); // ext 16
				case 0xc9: l = data.ui32(); return ext(data.ui8(),data.buf(l)); // ext 32
				case 0xca: return data.f32(); // float 32
				case 0xcb: return data.f64(); // float 64
				case 0xcc: return data.ui8(); // uint 8
				case 0xcd: return data.ui16(); // uint 16
				case 0xce: return data.ui32(); // uint 32
				case 0xcf: return data.ui32()*0x100000000 + data.ui32(); // uint 64
				case 0xd0: return data.i8(); // int 8
				case 0xd1: return data.i16(); // int 16
				case 0xd2: return data.i32(); // int 32
				case 0xd3: l = data.i32()*0x100000000; return l + (l<0?-1:1)*data.ui32(); // int 64
				case 0xd4: return ext(data.i8(),data.buf(1)); // fixext 1
				case 0xd5: return ext(data.i8(),data.buf(2)); // fixext 2
				case 0xd6: return ext(data.i8(),data.buf(4)); // fixext 4
				case 0xd7: return ext(data.i8(),data.buf(8)); // fixext 8
				case 0xd8: return ext(data.i8(),data.buf(16)); // fixext 16
				case 0xd9: return decodeUTF(data.buf(data.ui8())); // str 8
				case 0xda: return decodeUTF(data.buf(data.ui16())); // str 16
				case 0xdb: return decodeUTF(data.buf(data.ui32())); // str 32
				case 0xdc: return arr(data.ui16()); // array 16
				case 0xdd: return arr(data.ui32()); // array 32
				case 0xde: return obj(data.ui16()); // map 16
				case 0xdf: return obj(data.ui32()); // map 32
			}
			throw new Error("MsgPack Error: Somehow encountered unknown byte code: "+b);
		}
		var obj = decode();
		if(!data.eof()) throw new Error("MsgPack Error: Trying to decode more data than expected");

		return obj;
	}

	if(typeof window.module === "object" && typeof window.module.exports === "object") module.exports = t;
	return t;
})(this);