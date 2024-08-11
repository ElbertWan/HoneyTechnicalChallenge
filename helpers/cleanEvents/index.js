const cleanEvents = (events) => {
  let cleanedEvents = [];
  cleanedEvents.push(events[0]);
  for (let x = 1; x < events.length; x++) {
    if (events[x].timestamp > events[x - 1].timestamp) {
      cleanedEvents.push(events[x]);
    }
  }
  return cleanedEvents;
};

module.exports = {
  cleanEvents,
};
