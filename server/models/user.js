'use strict';
const Calendar = require("./index").Calendar;
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {});
  User.associate = function(models) {
    // associations can be defined here
    User.hasMany(models.Calendar,{
      foreignKey: 'userId',
      as: 'calendars',
    });
    User.hasMany(models.CalendarEvents,{
      foreignKey: 'userId',
      as: 'calendarEvents'
    });
  };
  
  // Class Method to find user by ID
  User.findById = async function(id){
    let user;
    try{
      user = await User.findOne({
        where: {id: id}
      });
      if(!user){
        throw new Error('Something went wrong');
      }
    }catch(e){
      throw new Error(e.message);
    }
    return user;
  };

  return User;
};