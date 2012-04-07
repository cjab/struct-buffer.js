describe("StructBuffer", function() {
  var buffer, struct, definition;


  beforeEach(function() {
    definition = {
      id:   'Uint32',
      name: ['Uint8', 12]
    };
    buffer = new ArrayBuffer(64);
    struct = new StructBuffer(definition, buffer);
  });


  describe("#set", function() {

    it("should set the value of a field in the current struct", function() {
      struct.set('id', 5);
      expect(struct.get('id')).toEqual(5);
    });

    it("should not set value of a field in other structs", function() {
      struct.set('id', 5);
      struct.seek(1);
      expect(struct.get('id')).toEqual(0);
    });
  });
});
