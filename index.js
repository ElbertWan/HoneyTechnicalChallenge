const {
  validateMonthUsageVariables,
  validateDailyVariables,
} = require("./validation/index");
const { EnergyEvent } = require("./types/EnergyEvent/index");
const {
  EnergyEventInProfileFormat,
} = require("./types/EnergyEventInProfileFormat/index");

/* The maximum number of minutes in a period (a day) */

const MAX_IN_PERIOD = 1440;

/**
 * PART 1
 *
 * You have an appliance that uses energy, and you want to calculate how
 * much energy it uses over a period of time.
 *
 * As an input to your calculations, you have a series of events that contain
 * a timestamp and the new state (on or off). You are also given the initial
 * state of the appliance. From this information, you will need to calculate
 * the energy use of the appliance i.e. the amount of time it is switched on.
 *
 * The amount of energy it uses is measured in 1-minute intervals over the
 * period of a day. Given there is 1440 minutes in a day (24 * 60), if the
 * appliance was switched on the entire time, its energy usage would be 1440.
 * To simplify calculations, timestamps range from 0 (beginning of the day)
 * to 1439 (last minute of the day).
 *
 * HINT: there is an additional complication with the last two tests that
 * introduce spurious state change events (duplicates at different time periods).
 * Focus on getting these tests working after satisfying the first tests.
 *
 * The structure for `profile` looks like this (as an example):
 * ```
 * {
 *    initial: 'on',
 *    events: [
 *      { state: 'off', timestamp: 50 },
 *      { state: 'on', timestamp: 304 },
 *      { state: 'off', timestamp: 600 },
 *    ]
 * }
 * ```
 */
const calculateEnergyUsageSimple = (profile) => {
  //validates profile
  validateDailyVariables(profile);

  //in the case that there are no events but there is an initial state
  if (profile.events.length === 0) {
    if (profile.initial === "on") {
      return MAX_IN_PERIOD;
    }
    return 0;
  }

  const eventsData = profile.events;
  let energyEvents = [];

  // push initial energy state derived from profile.initial
  const initialEnergyState = new EnergyEvent(
    profile.initial,
    eventsData[0].timestamp
  );
  energyEvents.push(initialEnergyState);

  // calculate and push energy states from profile.events
  for (let x = 0; x < eventsData.length - 1; x++) {
    energyEvents.push(
      new EnergyEvent(
        eventsData[x].state,
        eventsData[x + 1].timestamp - eventsData[x].timestamp
      )
    );
  }

  // calculate and push final energy state calculated with MAX_IN_PERIOD
  const finalEnergyEvent = new EnergyEvent(
    eventsData[eventsData.length - 1].state,
    MAX_IN_PERIOD - eventsData[eventsData.length - 1].timestamp
  );
  energyEvents.push(finalEnergyEvent);

  // filter out events where state is 'on'
  const filteredOnEnergyEvents = energyEvents.filter(
    (energyEvent) => energyEvent.state === "on"
  );
  // add up times of all 'on' events
  const totalEnergyUsed = filteredOnEnergyEvents.reduce((acc, energyEvent) => {
    return (acc += energyEvent.duration);
  }, 0);
  return totalEnergyUsed;
};

/**
 * PART 2
 *
 * You purchase an energy-saving device for your appliance in order
 * to cut back on its energy usage. The device is smart enough to shut
 * off the appliance after it detects some period of disuse, but you
 * can still switch on or off the appliance as needed.
 *
 * You are keen to find out if your shiny new device was a worthwhile
 * purchase. Its success is measured by calculating the amount of
 * energy *saved* by device.
 *
 * To assist you, you now have a new event type that indicates
 * when the appliance was switched off by the device (as opposed to switched
 * off manually). Your new states are:
 * * 'on'
 * * 'off' (manual switch off)
 * * 'auto-off' (device automatic switch off)
 *
 * (The `profile` structure is the same, except for the new possible
 * value for `initial` and `state`.)
 *
 * Write a function that calculates the *energy savings* due to the
 * periods of time when the device switched off your appliance. You
 * should not include energy saved due to manual switch offs.
 *
 * You will need to account for redundant/non-sensical events e.g.
 * an off event after an auto-off event, which should still count as
 * an energy savings because the original trigger was the device
 * and not manual intervention.
 */

const calculateEnergySavings = (profile) => {
  //validates profile
  validateDailyVariables(profile);

  const events = profile.events;

  //in the case that there are no events but there is an initial state
  if (profile.events.length === 0) {
    if (profile.initial === "on") {
      return 0;
    } else if (profile.initial === "off") {
      return 0;
    } else {
      return MAX_IN_PERIOD;
    }
  }

  let energyEvents = [];
  //calcuate and push initial state derived from profile.initial
  const initialEnergyState = new EnergyEvent(
    profile.initial,
    events[0].timestamp
  );
  energyEvents.push(initialEnergyState);

  //calulate and push rest of events
  for (let x = 0; x < events.length - 1; x++) {
    let eventState = events[x].state;

    //if off status comes after auto-off, we push an auto-off state. This won't affect the final value as we are using filter/reduce on 'auto-off'
    if (
      energyEvents[energyEvents.length - 1].state === "auto-off" &&
      events[x].state === "off"
    ) {
      eventState = "auto-off";
    }
    energyEvents.push(
      new EnergyEvent(eventState, events[x + 1].timestamp - events[x].timestamp)
    );
  }

  //calculate final energy state with MAX_IN_PERIOD
  //for the edge case if final value is off when previous value is auto-off
  let finalEventState = events[events.length - 1].state;
  if (
    energyEvents[energyEvents.length - 1].state === "auto-off" &&
    events[events.length - 1].state === "off"
  ) {
    finalEventState = "auto-off";
  }
  const finalEnergyEvent = new EnergyEvent(
    finalEventState,
    MAX_IN_PERIOD - events[events.length - 1].timestamp
  );
  energyEvents.push(finalEnergyEvent);

  //filter events by state of 'auto-off'
  const filteredOnEnergyEvents = energyEvents.filter(
    (energyEvent) => energyEvent.state === "auto-off"
  );
  //find total energy saved using reduce
  const totalEnergySaved = filteredOnEnergyEvents.reduce((acc, energyEvent) => {
    return (acc += energyEvent.duration);
  }, 0);

  return totalEnergySaved;
};

/**
 * PART 3
 *
 * The process of producing metrics usually requires handling multiple days of data. The
 * examples so far have produced a calculation assuming the day starts at '0' for a single day.
 *
 * In this exercise, the timestamp field contains the number of minutes since a
 * arbitrary point in time (the "Epoch"). To simplify calculations, assume:
 *  - the Epoch starts at the beginning of the month (i.e. midnight on day 1 is timestamp 0)
 *  - our calendar simply has uniform length 'days' - the first day is '1' and the last day is '365'
 *  - the usage profile data will not extend more than one month
 *
 * Your function should calculate the energy usage over a particular day, given that
 * day's number. It will have access to the usage profile over the month.
 *
 * It should also throw an error if the day value is invalid i.e. if it is out of range
 * or not an integer. Specific error messages are expected - see the tests for details.
 *
 * (The `profile` structure is the same as part 1, but remember that timestamps now extend
 * over multiple days)
 *
 * HINT: You are encouraged to re-use `calculateEnergyUsageSimple` from PART 1 by
 * constructing a usage profile for that day by slicing up and rewriting up the usage profile you have
 * been given for the month.
 */

const pushDayProfile = (
  energyEventsByDay,
  energyEvents,
  initialEnergyState
) => {
  energyEventsByDay.push({
    initial: initialEnergyState,
    events: energyEvents,
  });
};

const calculateEnergyUsageForDay = (monthUsageProfile, day) => {
  //validates day value (must be > 1 && < 366)
  validateMonthUsageVariables(day);

  let energyEventsByDay = [];
  let dailyEnergyEvents = [];
  let initialDailyEnergyState = monthUsageProfile.initial;
  let currentDay = 0;
  let monthlyEvents = monthUsageProfile.events;

  //returns energy usage if required day is bigger than final date of final event AND there are no events;
  if (monthlyEvents.length === 0) {
    return calculateEnergyUsageSimple({
      initial: initialDailyEnergyState,
      events: [],
    });
    //returns energy usage if required day is bigger than day after final event;
  } else if (
    day >
    Math.ceil(monthlyEvents[monthlyEvents.length - 1].timestamp / MAX_IN_PERIOD)
  ) {
    return calculateEnergyUsageSimple({
      initial: monthlyEvents[monthlyEvents.length - 1].state,
      events: [],
    });
  }

  for (let x = 0; x < monthlyEvents.length; x++) {
    //while loop takes into account when there are day skips between change events.
    while (
      Math.floor(monthlyEvents[x].timestamp / MAX_IN_PERIOD) > currentDay
    ) {
      currentDay++;
      // pushing previous day's profile to energyEventsByDay
      pushDayProfile(
        energyEventsByDay,
        dailyEnergyEvents,
        initialDailyEnergyState
      );

      // resetting initialDailyEnergyState by latest event state
      if (dailyEnergyEvents.length > 0) {
        initialDailyEnergyState =
          energyEventsByDay[energyEventsByDay.length - 1].events[
            energyEventsByDay[energyEventsByDay.length - 1].events.length - 1
          ].state;
      } else {
        initialDailyEnergyState =
          energyEventsByDay[energyEventsByDay.length - 1].initial;
      }

      dailyEnergyEvents = [];
    }
    dailyEnergyEvents.push(
      new EnergyEventInProfileFormat(
        monthlyEvents[x].state,
        monthlyEvents[x].timestamp % MAX_IN_PERIOD
      )
    );
  }

  //push final day after last event has been added
  pushDayProfile(energyEventsByDay, dailyEnergyEvents, initialDailyEnergyState);
  if (dailyEnergyEvents.length > 0) {
    initialDailyEnergyState =
      dailyEnergyEvents[dailyEnergyEvents.length - 1].state;
  }
  currentDay++;

  // returns energy usage if day is within first day and day of last event
  return calculateEnergyUsageSimple(energyEventsByDay[day - 1]);
};

module.exports = {
  calculateEnergyUsageSimple,
  calculateEnergySavings,
  calculateEnergyUsageForDay,
  MAX_IN_PERIOD,
};
