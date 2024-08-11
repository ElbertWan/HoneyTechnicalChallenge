const isInteger = (number) => Number.isInteger(number);

const validateDailyVariables = (profile) => {
  if (!profile) {
    throw new Error('/invalid profile/');
  }
};

const validateMonthUsageVariables = (day) => {
  if (!isInteger(day)) {
    throw new Error('/must be an integer/');
  } else if (day < 1 || day > 365) {
    throw new Error('/day out of range/');
  }
  return;
};

module.exports = {
  validateDailyVariables,
  validateMonthUsageVariables,
};
