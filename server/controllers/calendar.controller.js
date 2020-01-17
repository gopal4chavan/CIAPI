const User = require("../models/index").User;
const GoogleClient = require('../models/_googleCalendar');
const OutlookClient = require('../models/_outlookCalendar');
const syncCalendarSchedular = require('../schedular/schedular');

module.exports = {
  googleAuthorise: function(req, res){
    res.redirect(GoogleClient.authUrl());
  },
  googleCallback: async function(req, res){
    try{
      await GoogleClient.fetchCalendars(req.query.code, req.userId);
      res.status(201).send({message: 'success'});
    }catch(e){
      console.log(e);
    }
  },
  outlookAuthorise: function(req, res){
    res.redirect(OutlookClient.getAuthUrl());
  },
  outlookCallback: async function(req, res){
    try{
      await OutlookClient.fetchCalendars(req.query.code, req.userId);
      res.status(201).send({message: 'success'});
    }catch(e){
      console.log(e);
    }
  },
  syncCalendars: async function(req, res){
    await GoogleClient.syncCalendars(req.userId, syncCalendarSchedular);
    await OutlookClient.syncCalendars(req.userId, syncCalendarSchedular);
    res.status(200).send({message: 'syncing events'})
  }
}