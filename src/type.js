'use strict';

class Type {
  constructor(name) {
    this.name = name.toLowerCase();
  }

  toString() {
    return this.name;
  }
}

[
  'ANY',
  'BOOLEAN',
  'NUMBER',
  'STRING',
  'VOID',
].forEach((t) => {
  Type[t] = new Type(t);
});

// https://www.prepar3d.com/SDKv5/sdk/references/variables/units_of_measurement.html
const SimVarTypes = {
  bool: Type.BOOLEAN,
  boolean: Type.BOOLEAN,
  number: Type.NUMBER,
  string: Type.STRING,
};

// All the number types
[
  // Distance
  'meters',
  'centimeters',
  'kilometers',
  'millimeters',
  'miles',
  'decimiles',
  'nautical miles',
  'feet',
  'inches',
  'yards',
  // Area
  'square inches',
  'square feet',
  'square yards',
  'square meters',
  'square centimeters',
  'square kilometers',
  'square millimeters',
  'square miles',
  // Volume
  'cubic inches',
  'cubic feet',
  'cubic yards',
  'cubic miles',
  'cubic milimeters',
  'cubic centimeters',
  'cubic meters',
  'cubic kilometers',
  'liters',
  'gallons',
  'quarts',
  // Temperature
  'kelvin',
  'rankine',
  'fahrenheit',
  'celsius',
  // Angle
  'radians',
  'rounds',
  'degrees',
  'degree latitude',
  'degree longitude',
  'grads',
  // Global Position
  'degrees latitude',
  'degrees longitude',
  'meters latitude',
  // Angular Velocity
  'radians per second',
  'revolutions per minute',
  'minutes per round',
  'nice minutes per round',
  'degrees per second',
  // Speed
  'meters per second',
  'meters per minute',
  'feet per second',
  'feet per minute',
  'kph',
  'knots',
  'mph',
  'machs',
  // Acceleration
  'meters per second squared',
  'g force',
  'feet per second squared',
  // Time
  'seconds',
  'minutes',
  'hours',
  'days',
  'hours over 10',
  // Power
  'watts',
  'ft lb per second',
  'horsepower',
  // Volume Rate
  'meters cubed per second',
  'gallons per hour',
  'liters per hour',
  // Weight
  'kilograms',
  'geepounds',
  'pounds',
  // Weight Rate
  'kilograms per second',
  'pounds per hour',
  'pounds per second',
  // Electrical Current
  'amps',
  // Electrical Potential
  'volts',
  // Frequency
  'hz',
  'khz',
  'mhz',
  // Density
  'kilograms per cubic meter',
  'slugs per cubic foot',
  'pounds per gallon',
  // Pressure
  'pascals',
  'newtons per square meter',
  'kpa',
  'kilogram force per square centimeter',
  'mmHg',
  'cmHg',
  'inHg',
  'atm',
  'psi',
  'millimeters of water',
  'bars',
  // Torque
  'newton meter',
  'foot-pounds',
  // Misc
  'part',
  'half',
  'third',
  'percent',
  'percent over 100',
  'decibels',
  'position 16k',
  'position 32k',
  'enum',
].forEach((n) => {
  SimVarTypes[n] = Type.NUMBER;
});

module.exports = {
  Type,
  SimVarTypes,
};
