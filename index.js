'use strict';
const fs = require('fs');
const util = require('util');

// Based on Knuth; per wikipedia
// Takes the Poisson rate and output a Poisson rv
function poissonGenerator(lambda) {
  const L = Math.exp(-1 * lambda);
  let k = 0;
  let p = 1;
  while (p > L) {
    k++;
    const rand = Math.random();
    p *= rand;
  }
  return k - 1;
}

// nextEventTimeGenerator take Poisson rate as argument
// Creates rate parameter given by 120/lambda
// As max T is 120, we take this as numerator to generator rate parameter
function nextEventTimeGenerator(lambda) {
  return Math.floor(-Math.log(1 - Math.random()) / (1 / lambda));
}

// Sample space properties
const eventSpace = [
  {
    event: 'Customer 1 arrives',
    rate: 3,
    paymentPerRide: 0, // pays a fixed fee
    penalty: 1,
    fixedFee: 0.5
  },
  {
    event: 'Customer 2 arrives',
    rate: 1,
    paymentPerRide: 0, // pays a fixed fee
    penalty: 0.25,
    fixedFee: 1
  },
  {
    event: 'Customer 3 arrives',
    rate: 4,
    paymentPerRide: 1.25,
    penalty: 0 // no penalty if Customer 3 does not find a Citibike
  },
  {
    event: 'Bike returned',
    rate: 6
  }
];

const eventCounter = {};

function runSimulation(simulationRound) {
  const fileName = `Simulation#${simulationRound}.csv`;
  eventCounter[simulationRound] = {};

  const colHeaders =
    'TimeRemaining,Event,BicyclesTaken,BikeRemaining,CurrentProfit';

  let timeRemaining = 120; // total time alloted per HW
  let amountInHand =
    (eventSpace[0].fixedFee * eventSpace[0].rate +
      eventSpace[1].fixedFee * eventSpace[1].rate) *
    timeRemaining;
  let currentNumOfBicycles = 10;

  const initialValues = `${timeRemaining}, N/A, N/A, ${currentNumOfBicycles}, ${amountInHand}`;
  fs.writeFileSync(fileName, `${colHeaders}\n${initialValues}`);

  while (timeRemaining > 0) {
    /**
     * randEvent determines which of 4 possible event happens next
     * Possible values are numbers between 1 and 4 (inclusive) which means the following
     * 1 -> Customer 1 arrives
     * 2 -> Customer 2 arrives
     * 3 -> Customer 3 arrives
     * 4 -> Citibike returned
     */
    const randEventIdx = Math.ceil(Math.random() * 4);
    const randEvent = eventSpace[randEventIdx - 1];
    if (eventCounter[simulationRound]) {
      eventCounter[simulationRound]++;
    } else {
      eventCounter[simulationRound] = 1;
    }
    const nextEventArrival = nextEventTimeGenerator(randEvent.rate);
    timeRemaining -= nextEventArrival;

    if (timeRemaining < 0) break;

    if (randEventIdx === 4) {
      const bicyclesReturned = poissonGenerator(randEvent.rate);
      currentNumOfBicycles += bicyclesReturned;
      fs.appendFileSync(
        fileName,
        `\n${timeRemaining}, ${randEvent.event}, -${bicyclesReturned}, ${currentNumOfBicycles}, ${amountInHand}`
      );
    } else {
      let bicyclesRequired = poissonGenerator(randEvent.rate);
      const fixedFeeMember = randEventIdx === 1 || randEventIdx === 2;
      // if not enough bicycles for Customer 1 or 2, then need to handle penalty situation
      // pay penalty based on shortfall of bicycles
      if (currentNumOfBicycles < bicyclesRequired) {
        const shortFall = bicyclesRequired - currentNumOfBicycles;
        if (fixedFeeMember) {
          amountInHand -= shortFall * randEvent.penalty;
        }
        bicyclesRequired -= shortFall;
      }
      currentNumOfBicycles -= bicyclesRequired;
      if (randEventIdx === 3) {
        amountInHand += randEvent.paymentPerRide * bicyclesRequired;
      }
      fs.appendFileSync(
        fileName,
        `\n${timeRemaining}, ${randEvent.event}, ${bicyclesRequired}, ${currentNumOfBicycles}, ${amountInHand}`
      );
    }
  }
}

for (let i = 1; i <= 5; i++) {
  runSimulation(i);
}

console.log(util.inspect(eventCounter, { showHidden: false, depth: null }));
