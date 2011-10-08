//(function(){

  // Initial Setup
  // -------------

  var root = this;

  var previousStruct = root.Struct;

  var Struct;
  if (typeof exports !== 'undefined') {
    Struct = exports;
  } else {
    Struct = root.Struct = {};
  }



  StructField = function(offset, elementSize, length) {
    return {
      offset:      offset,
      length:      length,
      getter:      null,
      setter:      null,
      elementSize: elementSize
    };
  };


  /**
   * Creates an instance of Struct
   *
   * @constructor
   * @this {Struct}
   * @param {Object} description an object describing the fields in this struct
   * @param {ArrayBuffer} buffer the binary data this struct will be accessing
   */
  Struct = function(description, buffer) {
    var name, struct, type, length, field, dataView, i;

    dataView = new DataView(buffer);

    struct = {
      /** @private
       * The size, in bytes, of this struct
       */
      _size: 0,


      /** @private
       * The current position of this struct in the array buffer.
       * Position 0 would be at the first instance of struct data
       * in the array buffer, 1 the second and so on.
       */
      _position: 0,


      /** @private
       * The field objects representing the binary fields in our struct
       */
      _fields: {},


      /** @private
       * Calculate the full offset (in bytes) on the ArrayBuffer for a
       * given field. This will reflect the current position of the
       * struct the field belongs to as well.
       *
       * @param {StructField} field The field for which the offset
       * will be returned.
       * @return {Number}
       */
      _fieldOffset: function(field) {
        return (this._position * this._size) + field.offset;
      },


      /** @private
       * Calculate the position of the last struct in this buffer
       *
       * @return {Number} The last struct position
       */
      _lastPosition: function() {
        return Math.floor(dataView.byteLength / this._size) - 1;
      },


      /**
       * Add a new field to this struct. This will add the field to the
       * end of the current struct. This also adjusts the size of the
       * struct.
       *
       * @param {String} name The name of the field
       * @param {String} type The type of field this will be. The following
       * are valid field types:
       *   - int8
       *   - uint8
       *   - int16
       *   - uint16
       *   - int32
       *   - uint32
       *   - int64
       *   - uint64
       *   - float32
       *   - float64
       *   - char
       * @param {Number} length The number of elements in this field. For
       * example a field of type int8 and length 5 will contain an array
       * of five 8-bit integers.
       */
      addField: function(name, type, length) {
        var getter, setter, elementSize;

        length = length || 1;

        switch (type.toLowerCase()) {
          case 'int8':
            getter      = dataView.getInt8.bind(dataView);
            setter      = dataView.setInt8.bind(dataView);
            elementSize = Int8Array.BYTES_PER_ELEMENT;
            break;
          case 'uint8':
            getter      = dataView.getUint8.bind(dataView);
            setter      = dataView.setUint8.bind(dataView);
            elementSize = Uint8Array.BYTES_PER_ELEMENT;
            break;
          case 'int16':
            getter      = dataView.getInt16.bind(dataView);
            setter      = dataView.setInt16.bind(dataView);
            elementSize = Int16Array.BYTES_PER_ELEMENT;
            break;
          case 'uint16':
            getter      = dataView.getUint16.bind(dataView);
            setter      = dataView.setUint16.bind(dataView);
            elementSize = Uint16Array.BYTES_PER_ELEMENT;
            break;
          case 'int32':
            getter      = dataView.getUint32.bind(dataView);
            setter      = dataView.setUint32.bind(dataView);
            elementSize = Uint32Array.BYTES_PER_ELEMENT;
            break;
          case 'uint32':
            getter      = dataView.getUint32.bind(dataView);
            setter      = dataView.setUint32.bind(dataView);
            elementSize = Uint32Array.BYTES_PER_ELEMENT;
            break;
          case 'int64':
            getter      = dataView.getInt64.bind(dataView);
            setter      = dataView.setInt64.bind(dataView);
            elementSize = Int64Array.BYTES_PER_ELEMENT;
            break;
          case 'uint64':
            getter      = dataView.getUint64.bind(dataView);
            setter      = dataView.setUint64.bind(dataView);
            elementSize = Uint64Array.BYTES_PER_ELEMENT;
            break;
          case 'float32':
            getter      = dataView.getFloat32.bind(dataView);
            setter      = dataView.setFloat32.bind(dataView);
            elementSize = Float32Array.BYTES_PER_ELEMENT;
            break;
          case 'float64':
            getter      = dataView.getFloat64.bind(dataView);
            setter      = dataView.setFloat64.bind(dataView);
            elementSize = Float64Array.BYTES_PER_ELEMENT;
            break;
          case 'char':
            getter      = dataView.getUint8.bind(dataView);
            setter      = dataView.setUint8.bind(dataView);
            elementSize = Uint8Array.BYTES_PER_ELEMENT;
            break;
        }

        this._fields[name] = new StructField(this._size, elementSize, length);
        this._fields[name].getter = getter;
        this._fields[name].setter = setter;

        this._size += elementSize * length;
      },


      /**
       * Get the value of a field at the current position.
       *
       * @param {String} name The name of the field.
       * @return {Number|Array|String}
       */
      get: function(name) {
        var field          = this._fields[name],
            adjustedOffset = this._fieldOffset(field),
            elementSize    = field.elementSize,
            length         = field.length,
            value          = [],
            i;

        if (length > 1) {
          for (i = 0; i < length; i++) {
            value.push(field.getter(adjustedOffset + (i * elementSize)));
          }
        } else {
          value = field.getter(adjustedOffset);
        }

        return value;
      },


      /**
       * Set the value of a field. If the field is an array
       * (length > 1) then an array of values may be passed.
       *
       * @param {String} name The name of the field to be set.
       * @param {Number|String|Array} values The value(s) the field
       * will be assigned to
       * @return {Number|String|Array}
       */
      set: function(name, values) {
        var field          = this._fields[name],
            elementSize    = field.elementSize,
            adjustedOffset = this._fieldOffset(field),
            valueCount, i;

        if (!Array.isArray(values)) { values = [values]; }

        valueCount = values.length;
        for (i = 0; i < valueCount; i++) {
          field.setter(adjustedOffset + (i * elementSize), values[i]);
        }

        return this;
      },


      /**
       * Seek to another instance of this struct stored in the ArrayBuffer.
       * A positive index will seek from the beginning of the buffer while
       * a negative index will wrap around to the end of the buffer.
       *
       * For example struct.seek(0) will move to the first struct in the buffer
       * and struct.seek(1) the second. However, struct.seek(-1) will wrap
       * to the last item in the buffer.
       *
       * If the seek moves beyond the boundaries of the buffer an exception
       * is thrown.
       *
       * @param {Number} index The index of the struct to be moved to.
       */
      seek: function(index) {
        var lastPosition = this._lastPosition();

        index = Math.floor(index);

        if (index > lastPosition || index < -(lastPosition + 1)) {
          throw "BeyondBufferBoundsException";
        }

        if (index >= 0) { this._position = index; }
        else            { this._position = lastPosition + (index + 1); }
      },


      /**
       * Seek to the first instance of the struct in this ArrayBuffer
       */
      first: function() {
        this.seek(0);
      },


      /**
       * Seek to the last instance of the struct in this ArrayBuffer
       */
      last: function() {
        this.seek(-1);
      }
    };

    for (name in description) {
      if (description.hasOwnProperty(name)) {
        field = description[name];
        if (!Array.isArray(field)) { field = [field]; }

        type   = field[0];
        length = field[1];
        struct.addField(name, type, length);
      }
    }

    return struct;
  };
//}());

var buffer = new ArrayBuffer(64),
    data = new Struct({
      id:   'Uint32',
      name: ['Uint8', 12]
    }, buffer);
