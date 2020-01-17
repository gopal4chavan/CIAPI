'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Calendars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      calendarType: {
        type: Sequelize.STRING
      },
      calendarName: {
        type: Sequelize.STRING
      },
      externalCalendarID: {
        type: Sequelize.STRING
      },
      accessToken:{
        type: Sequelize.TEXT
      },
      refreshToken:{
        type: Sequelize.TEXT
      },
      expiresAt: {
        type: Sequelize.DATE
      },
      alias: {
        type: Sequelize.STRING
      },
      isPrimary:{
        type: Sequelize.BOOLEAN
      },
      next_sync_token:{
        type: Sequelize.STRING
      },
      synced:{
        type: Sequelize.BOOLEAN
      },
      userId:{
        type: Sequelize.INTEGER,
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id',
          as: 'userId',
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Calendars');
  }
};