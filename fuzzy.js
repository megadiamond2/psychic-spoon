/* ========================================
   Fuzzy Logic Inference Engine
   Mamdani-style (Matches Chapter 4)
======================================== */

function triangular(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

function densityLow(x)    { return triangular(x, 0, 0, 40); }
function densityMedium(x) { return triangular(x, 20, 50, 80); }
function densityHigh(x)   { return triangular(x, 60, 100, 100); }

function waitShort(x)  { return triangular(x, 0, 0, 40); }
function waitMedium(x) { return triangular(x, 20, 50, 90); }
function waitLong(x)   { return triangular(x, 60, 120, 180); }

var greenSets = {
  veryShort: { a: 5,  b: 10, c: 20 },
  short:     { a: 15, b: 25, c: 40 },
  medium:    { a: 30, b: 45, c: 60 },
  long:      { a: 50, b: 65, c: 80 },
  veryLong:  { a: 70, b: 85, c: 95 }
};

var rules = [
  { dens: "low",    wait: "short",  out: "veryShort" },
  { dens: "low",    wait: "medium", out: "short" },
  { dens: "low",    wait: "long",   out: "medium" },
  { dens: "medium", wait: "short",  out: "short" },
  { dens: "medium", wait: "medium", out: "medium" },
  { dens: "medium", wait: "long",   out: "long" },
  { dens: "high",   wait: "short",  out: "medium" },
  { dens: "high",   wait: "medium", out: "long" },
  { dens: "high",   wait: "long",   out: "veryLong" }
];

function fuzzifyDensity(value) {
  return {
    low: densityLow(value),
    medium: densityMedium(value),
    high: densityHigh(value)
  };
}

function fuzzifyWaiting(value) {
  return {
    short: waitShort(value),
    medium: waitMedium(value),
    long: waitLong(value)
  };
}

function evaluateRules(densFuzzy, waitFuzzy) {
  var outputStrength = {
    veryShort: 0, short: 0, medium: 0, long: 0, veryLong: 0
  };
  rules.forEach(function (rule) {
    var densDegree = densFuzzy[rule.dens] || 0;
    var waitDegree = waitFuzzy[rule.wait] || 0;
    var strength = Math.min(densDegree, waitDegree);
    if (strength > outputStrength[rule.out]) {
      outputStrength[rule.out] = strength;
    }
  });
  return outputStrength;
}

function defuzzify(outputStrength) {
  var numerator = 0;
  var denominator = 0;
  for (var x = 5; x <= 90; x += 0.5) {
    var mu = 0;
    for (var setName in outputStrength) {
      var strength = outputStrength[setName];
      if (strength <= 0) continue;
      var set = greenSets[setName];
      var membership = triangular(x, set.a, set.b, set.c);
      var clipped = Math.min(membership, strength);
      if (clipped > mu) mu = clipped;
    }
    numerator += x * mu;
    denominator += mu;
  }
  if (denominator === 0) return 25;
  return Math.round(numerator / denominator);
}

function calculateGreenDuration(density, waitingTime) {
  var densFuzzy = fuzzifyDensity(Number(density));
  var waitFuzzy = fuzzifyWaiting(Number(waitingTime));
  var outputStrength = evaluateRules(densFuzzy, waitFuzzy);
  var greenDuration = defuzzify(outputStrength);
  return { greenDuration: greenDuration, densFuzzy: densFuzzy, waitFuzzy: waitFuzzy, outputStrength: outputStrength };
}

window.calculateGreenDuration = calculateGreenDuration;
