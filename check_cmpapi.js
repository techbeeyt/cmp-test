// Check CmpApi interface
import { CmpApi, CmpStatus, EventStatus, DisplayStatus } from '@iabtcf/cmpapi';
import { TCModel } from '@iabtcf/core';

console.log('CmpStatus values:', Object.values(CmpStatus));
console.log('EventStatus values:', Object.values(EventStatus));
console.log('DisplayStatus values:', Object.values(DisplayStatus));

// Check CmpApi methods - use valid CMP ID
try {
  const cmpApi = new CmpApi(123, 1); // Use a valid CMP ID
  console.log('CmpApi methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(cmpApi)));
} catch (e) {
  console.log('CmpApi error:', e.message);
}

// Check TCModel
const tcModel = new TCModel();
console.log('TCModel properties:', Object.getOwnPropertyNames(tcModel));