/*
  よく使うローレベルな関数集
 */
var slice1 = [].slice;

(function(window) {
  var ArrayProto, ObjProto, _getConstructor, _getProto, breaker, concat, group, hasOwnProperty, nativeFilter, nativeForEach, nativeIndexOf, nativeIsArray, nativeKeys, nativeMap, nativeOwn, nativeProto, nativeSome, sake, slice, toString;
  ObjProto = Object.prototype;
  ArrayProto = Array.prototype;
  nativeForEach = ArrayProto.forEach;
  nativeMap = ArrayProto.map;
  nativeIndexOf = ArrayProto.indexOf;
  nativeSome = ArrayProto.some;
  nativeFilter = ArrayProto.filter;
  concat = ArrayProto.concat;
  slice = ArrayProto.slice;
  toString = ObjProto.toString;
  nativeKeys = ObjProto.keys;
  hasOwnProperty = ObjProto.hasOwnProperty;
  nativeOwn = Object.getOwnPropertyNames;
  nativeProto = Object.getPrototypeOf;
  nativeIsArray = Array.isArray;
  _getProto = function(obj) {
    return obj.__proto__;
  };
  _getConstructor = function(obj) {
    var ref;
    return obj != null ? (ref = obj.constructor) != null ? ref.prototype : void 0 : void 0;
  };
  breaker = {};
  group = function(behavior) {
    return function(obj, value, context) {
      var iterator, result;
      result = {};
      iterator = value === null ? sake.identity : sake.lookupIterator(value);
      sake.each(obj, function(value, index) {
        var key;
        key = iterator.call(context, value, index, obj);
        return behavior(result, key, value);
      });
      return result;
    };
  };
  sake = {
    _inArray: function(elem, array) {
      var i, len;
      i = 0;
      len = array.length;
      while (i < len) {
        if (array[i] === elem) {
          return i;
        }
        i++;
      }
      return -1;
    },

    /*
      check obj type is functuion
      from underscore.js
     */
    isFunc: function(obj) {
      return typeof obj === 'function';
    },
    isEmpty: function(obj) {
      var key;
      if (obj === null) {
        return true;
      }
      if (sake.isArray(obj) || sake.isString(obj)) {
        return obj.length === 0;
      }
      for (key in obj) {
        if (sake.has(obj, key)) {
          return false;
        }
      }
      return true;
    },
    isArray: nativeIsArray || function(obj) {
      return toString.call(obj) === '[object Array]';
    },
    isString: function(obj) {
      return toString.call(obj) === '[object String]';
    },

    /**
      継承する
     */
    extend: function(obj) {
      var arg, item, j, len, len1, prop;
      len = arguments.length;
      arg = slice.call(arguments, 1);
      for (j = 0, len1 = arg.length; j < len1; j++) {
        item = arg[j];
        if (item) {
          for (prop in item) {
            obj[prop] = item[prop];
          }
        }
      }
      return obj;
    },
    findWhere: function(list, properties) {
      return sake.where(list, properties, true);
    },
    where: function(list, properties, first) {
      if (sake.isEmpty(properties)) {
        if (first) {
          return 0;
        } else {
          return [];
        }
      }
      return sake[first ? 'find' : 'filter'](list, function(value) {
        var key;
        for (key in properties) {
          if (properties[key] !== value[key]) {
            return false;
          }
        }
        return true;
      });
    },

    /*
      collection to uniq.
      from underscore.js
     */
    uniq: function(array, isSorted, iterator, context) {
      var initial, results, seen;
      if (sake.isFunc(isSorted)) {
        context = iterator;
        iterator = isSorted;
        isSorted = false;
      }
      initial = iterator ? sake.map(array, iterator, context) : array;
      results = [];
      seen = [];
      sake.each(initial, function(value, index) {
        if ((isSorted ? !index || seen[seen.length - 1] !== value : !sake.contains(seen, value))) {
          seen.push(value);
          return results.push(array[index]);
        }
      });
      return results;
    },
    filter: function(obj, iterator, context) {
      var results;
      results = [];
      if (obj === null) {
        return results;
      }
      if (nativeFilter && obj.filter === nativeFilter) {
        return obj.filter(iterator, context);
      }
      sake.each(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) {
          return results.push(value);
        }
      });
      return results;
    },
    find: function(obj, iterator, context) {
      var result;
      result = null;
      sake.any(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) {
          result = value;
          return true;
        }
      });
      return result;
    },
    contains: function(obj, target) {
      if (obj === null) {
        return false;
      }
      if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
        return obj.indexOf(target) !== -1;
      }
      return sake.any(obj, function(value) {
        return value === target;
      });
    },
    diff: function(array) {
      var rest;
      rest = concat.apply(ArrayProto, slice.call(arguments, 1));
      return sake.filter(array, function(value) {
        return !sake.contains(rest, value);
      });
    },
    each: function(obj, iterator, context) {
      var i, keys, len;
      if (obj === null) {
        return;
      }
      if (nativeForEach && obj.forEach === nativeForEach) {
        return obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        i = 0;
        len = obj.length;
        while (i < len) {
          if (iterator.call(context, obj[i], i, obj) === breaker) {
            return;
          }
          i++;
        }
      } else {
        keys = sake.keys(obj);
        i = 0;
        len = keys.length;
        while (i < len) {
          if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) {
            return;
          }
          i++;
        }
      }
    },
    map: function(obj, iterator, context) {
      var results;
      results = [];
      if (obj === null) {
        return results;
      }
      if (nativeMap && obj.map === nativeMap) {
        return obj.map(iterator, context);
      }
      sake.each(obj, function(value, index, list) {
        return results.push(iterator.call(context, value, index, list));
      });
      return results;
    },
    keys: nativeKeys || function(obj) {
      var key, keys;
      if (obj !== Object(obj)) {
        throw new TypeError('Invalid object');
      }
      keys = [];
      for (key in obj) {
        if (sake.has(obj, key)) {
          keys.push(key);
        }
      }
      return keys;
    },
    indexBy: group(function(result, key, value) {
      return result[key] = value;
    }),
    lookupIterator: function(value) {
      var ref;
      return (ref = sake.isFunction(value)) != null ? ref : {
        value: function(obj) {
          return obj[value];
        }
      };
    },

    /*
      指定した key が与えられたオブジェクトに存在するかどうか
     */
    has: function(obj, key) {
      return hasOwnProperty.call(obj, key);
    },
    any: function(obj, iterator, context) {
      var result;
      iterator || (iterator = sake.identity);
      result = false;
      if (obj === null) {
        return result;
      }
      if (nativeSome && obj.some === nativeSome) {
        return obj.some(iterator, context);
      }
      sake.each(obj, function(value, index, list) {
        if (result || (result = iterator.call(context, value, index, list))) {
          return breaker;
        }
      });
      return !!result;
    },

    /*
      指定した jQuery Object が null かどうかを返す。
      length < 1 も含めて null とみなす。
      DOM の解釈待ち時点とか。
     */
    _$notNull: function($jqObj) {
      if (!$jqObj) {
        return false;
      } else if ($jqObj.length < 1) {
        return false;
      }
      return true;
    },
    identity: function(value) {
      return value;
    },

    /*
      文字列からメソッドなどを取得する
     */
    executeByString: function(str) {
      var j, len1, propName, ref, target;
      target = window;
      ref = str.split(".");
      for (j = 0, len1 = ref.length; j < len1; j++) {
        propName = ref[j];
        target = target[propName];
      }
      return target;
    },

    /*
      オブジェクトから key で指定したプロパティを取得する
     */
    getObjectValue: function(obj, key) {
      if (hasOwnProperty.call(obj, key)) {
        return obj[key];
      } else {
        return null;
      }
    },

    /*
      ターゲットが保持しているプロパティの一覧を配列で返す
     */
    getPropNames: function(target) {
      var i, o, props, proto;
      props = [];
      o = target;
      i = 0;
      while (o) {
        props = props.concat(sake.getOwnPropertyNames(o));
        proto = sake.getPrototypeOf(o);
        if (o === proto) {
          break;
        }
        o = proto;
      }
      props = sake.uniq(props);
      return props;
    },

    /**
     */
    getPrototypeOf: nativeProto || (typeof "test".__proto__ === "object" ? _getProto : _getConstructor),

    /*
      プロパティ一覧を取ってくる
     */
    getOwnPropertyNames: nativeOwn || function(obj) {
      var arr, k;
      arr = [];
      if ((function() {
        var results1;
        results1 = [];
        for (k in obj) {
          results1.push(obj.hasOwnProperty(k));
        }
        return results1;
      })()) {
        arr.push(k);
      }
      return arr;
    },

    /*
      指定された型から適切なデフォルト値を取得する
     */
    getDefault: function(type) {
      type = type.toLowerCase();
      if (type === "function" || type === "object") {
        return null;
      }
      if (type === "number" || type === "int") {
        return 0;
      }
      if (type === "array") {
        return [];
      }
      if (type === "string") {
        return "";
      }
      if (type === "date") {
        return new Date();
      }
    },

    /*
      中身を全部文字列にする
      なんかこれ _ にあった気がするんだが…
     */
    stringify: function(list) {
      var attr, j, len1, newlist, org;
      org = list.slice();
      newlist = [];
      for (j = 0, len1 = list.length; j < len1; j++) {
        attr = list[j];
        if (typeof attr === "string") {
          newlist.push(attr);
          continue;
        }
        if (attr === null || attr === void 0) {
          newlist.push("");
        } else {
          newlist.push(String(attr));
        }
      }
      return newlist;
    },

    /**
      汚物は消毒だ―!
      @param obj {Object} 消毒したいオブジェクト
      @param allowBrank {Boolean} Array の [] や String の "" を含まないかどうか
     */
    objCompact: function(obj, allowBrank) {
      var k, result;
      if (allowBrank == null) {
        allowBrank = false;
      }
      result = {};
      for (k in obj) {
        if (obj[k] !== null && obj[k] !== void 0) {
          if (!allowBrank) {
            if ((typeof obj[k] === "array") && obj[k].length < 1) {
              continue;
            }
            if (typeof obj[k] === "string" && "") {
              continue;
            }
          }
          result[k] = obj[k];
        }
      }
      return result;
    },
    compact: function(array) {
      return sake.filter(array, sake.identity);
    },

    /*
      複数の function を結合して位置度に実行する function として返す
     */
    bindFunctions: function(funcs, insert) {
      var bindedFuncs, callback, f, func, funcName, i, j, len, len1, names, newF;
      if (typeof funcs === 'string') {
        funcs = funcs.split(',');
      }
      bindedFuncs = [];
      for (j = 0, len1 = funcs.length; j < len1; j++) {
        funcName = funcs[j];
        func = this[funcName];
        if (func == null) {
          names = funcName.split('.');
          if (names.length > 1) {
            f = window[names[0]];
            i = 1;
            len = names.length;
            while (i < len) {
              newF = f[names[i]];
              if (newF != null) {
                f = newF;
                i++;
              } else {
                break;
              }
            }
            func = f;
          } else {
            func = window[funcName];
          }
        }
        if (func != null) {
          bindedFuncs.push(func);
        }
      }
      if (insert) {
        bindedFuncs = insert.concat(bindedFuncs);
      }
      callback = function() {
        var args, l, len2;
        args = 1 <= arguments.length ? slice1.call(arguments, 0) : [];
        for (l = 0, len2 = bindedFuncs.length; l < len2; l++) {
          func = bindedFuncs[l];
          func.apply(this, slice1.call(args));
        }
      };
      return callback;
    }
  };
  (function() {
    sake.objProps = sake.getPropNames(Object);
    return sake.objProps.push("__super__");
  })();
  return window.sake = sake;
})(window);

exports = sake;
