'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'CalendarEvents',
        'isRecurringInstance'
      ),
      queryInterface.removeColumn(
        'CalendarEvents',
        'isException'
      ),
      queryInterface.removeColumn(
        'CalendarEvents',
        'type'
      ),
      queryInterface.addColumn(
        'CalendarEvents',
        'domainType',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'CalendarEvents',
        'eventType',
        Sequelize.STRING
      ),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'CalendarEvents',
        'isRecurringInstance',
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        'CalendarEvents',
        'isException',
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        'CalendarEvents',
        'type',
        Sequelize.STRING
      ),
      queryInterface.removeColumn(
        'CalendarEvents',
        'domainType'
      ),
      queryInterface.removeColumn(
        'CalendarEvents',
        'eventType'
      ),
    ]);
  }
};
