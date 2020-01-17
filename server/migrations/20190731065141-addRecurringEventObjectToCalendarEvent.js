'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'CalendarEvents',
      'recurringEventObject',
      Sequelize.TEXT
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'CalendarEvents',
      'recurringEventObject'
    )
  }
};
