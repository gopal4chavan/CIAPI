'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'CalendarEvents',
      'isRecurringInstance',
      Sequelize.BOOLEAN
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'CalendarEvents',
      'isRecurringInstance'
    );
  }
};
