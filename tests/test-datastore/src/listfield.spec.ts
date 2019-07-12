/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  Field, ListField
} from '@phosphor/datastore';

type ListValue = number;

/**
 * Return a shuffled copy of an array
 */
function shuffle<T>(array: ReadonlyArray<T>): T[] {
  let ret = array.slice();
  for (let i = ret.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [ret[i], ret[j]] = [ret[j], ret[i]]; // swap elements
  }
  return ret;
}

describe('@phosphor/datastore', () => {

  describe('ListField', () => {

    let field: ListField<ListValue>;

    beforeEach(() => {
        field = new ListField<ListValue>({
          description: 'A list field storing numbers'
        });
    });

    describe('constructor()', () => {

      it('should create a list field', () => {
        expect(field).to.be.instanceof(ListField);
      });

    });

    describe('type', () => {

      it('should return the type of the field', () => {
        expect(field.type).to.equal('list');
      });

    });

    describe('createValue()', () => {

      it('should create an initial value for the field', () => {
        let value = field.createValue();
        expect(value).to.eql([]);
      });

    });

    describe('createMetadata()', () => {

      it('should create initial metadata for the field', () => {
        let metadata = field.createMetadata();
        expect(metadata.ids).to.eql([]);
        expect(metadata.cemetery).to.eql({});
      });

    });

    describe('applyUpdate', () => {

      it('should return the result of the update', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        let splice = {
          index: 0,
          remove: 0,
          values: [1, 2, 3]
        };
        let { value, change, patch } = field.applyUpdate({
          previous,
          update: splice,
          metadata,
          version: 1,
          storeId: 1
        });
        expect(value).to.eql([1, 2, 3]);
        expect(change[0]).to.eql({ index: 0, removed: [], inserted: [1, 2, 3]});
        expect(patch.length).to.equal(1);
        expect(patch[0].removedValues.length).to.equal(splice.remove);
        expect(patch[0].insertedValues).to.eql(splice.values);
        expect(patch[0].removedIds.length).to.equal(splice.remove);
        expect(patch[0].insertedIds.length).to.equal(splice.values.length);
      });

      it('should accept multiple splices', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        let splice1 = {
          index: 0,
          remove: 0,
          values: [1, 2, 3]
        };
        let splice2 = {
          index: 1,
          remove: 1,
          values: [4, 5]
        };
        let { value, change, patch } = field.applyUpdate({
          previous,
          update: [splice1, splice2],
          metadata,
          version: 1,
          storeId: 1
        });
        expect(value).to.eql([1, 4, 5, 3]);
        expect(change.length).to.eql(2);
        expect(change[0]).to.eql({ index: 0, removed: [], inserted: [1, 2, 3]});
        expect(change[1]).to.eql({ index: 1, removed: [2], inserted: [4, 5]});
        expect(patch.length).to.equal(2);
        expect(patch[0].removedValues.length).to.equal(splice1.remove);
        expect(patch[0].insertedValues).to.eql(splice1.values);
        expect(patch[0].removedIds.length).to.equal(splice1.remove);
        expect(patch[0].insertedIds.length).to.equal(splice1.values.length);
        expect(patch[1].removedValues.length).to.equal(splice2.remove);
        expect(patch[1].insertedValues).to.eql(splice2.values);
        expect(patch[1].removedIds.length).to.equal(splice2.remove);
        expect(patch[1].insertedIds.length).to.equal(splice2.values.length);
      });

    });

    describe('applyPatch', () => {

      it('should return the result of the patch', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        // Create a patch
        let { patch } = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, values: [1, 2, 3] },
          metadata,
          version: 1,
          storeId: 1
        });
        // Reset the metadata
        metadata = field.createMetadata();
        // Apply the patch
        let patched = field.applyPatch({
          previous,
          metadata,
          patch
        });
        expect(patched.value).to.eql([1, 2, 3]);
        expect(patched.change[0]).to.eql({
          index: 0,
          removed: [],
          inserted: [1, 2, 3]
        });
      });

      it('should allow for out-of-order patches', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();

        let firstUpdate = field.applyUpdate({
          previous,
          update: { index: 0, remove: 0, values: [1, 8, 4] },
          metadata,
          version: 1,
          storeId: 1
        });
        let secondUpdate = field.applyUpdate({
          previous: firstUpdate.value,
          update: { index: 1, remove: 1, values: [2, 3] },
          metadata,
          version: 2,
          storeId: 1
        });
        expect(secondUpdate.value).to.eql([1, 2, 3, 4]);

        // Now if we apply these patches on another client in 
        // a different order, they should give the same result.
        metadata = field.createMetadata();
        let firstPatch = field.applyPatch({
          previous,
          metadata,
          patch: secondUpdate.patch
        });
        let secondPatch = field.applyPatch({
          previous: firstPatch.value,
          metadata,
          patch: firstUpdate.patch
        });
        expect(secondPatch.value).to.eql([1, 2, 3, 4]);
      });

      it('should allow for racing updates', () => {
        let previous = field.createValue();
        let metadata = field.createMetadata();
        let values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let shuffled = shuffle(values);
        let updated: undefined | Field.UpdateResult<
          ListField.Value<ListValue>,
          ListField.Change<ListValue>,
          ListField.Patch<ListValue>
        >;
        shuffled.forEach(value => {
          updated = field.applyUpdate({
            previous: updated && updated.value || previous,
            metadata,
            update: {
              index: 0,
              remove: 0,
              values: [value]
            },
            version: values.length - 1 - value,
            storeId: 1
          });
        });
      });

    });

    describe('mergeChange', () => {

      it('should merge two successive changes', () => {
        let change1 = [
          {
            index: 0,
            removed: [],
            inserted: [0, 1]
          }
        ];
        let change2 = [
          {
            index: 1,
            removed: [1],
            inserted: [2, 3]
          }
        ];
        let result = field.mergeChange(change1, change2);
        expect(result).to.eql([...change1, ...change2]);
      });

    });

    describe('mergePatch', () => {

      it('should merge two successive patches', () => {
        let patch1 = [
          {
            removedIds: [],
            removedValues: [],
            insertedIds: ['id-1', 'id-2'],
            insertedValues: [0, 1]
          }
        ];
        let patch2 = [
          {
            removedIds: ['id-1'],
            removedValues: [0],
            insertedIds: ['id-3', 'id-4'],
            insertedValues: [2, 3]
          }
        ];
        let result = field.mergePatch(patch1, patch2);
        expect(result).to.eql([...patch1, ...patch2]);
      });

    });

  });

});
