let Bull = require('bull');

const outlookClient = require('../models/_outlookCalendar');
const googleClient = require('../models/_googleCalendar');


// Create's a new Queue connected redis server
let SyncEventsQueue = new Bull('sync-events', 'redis://127.0.0.1:6379');

// Process the Google proxy jobs
SyncEventsQueue.process('GOOGLE_PROXY', async(job, done) => {
  await outlookClient.createProxyGoogleCalendar(job.data);
  await outlookClient.syncProxyGoogleCalendar(job.data);
  done();
});

// Process the outlook proxy jobs
SyncEventsQueue.process('OUTLOOK_PROXY', async(job, done) => {
  await googleClient.createProxyOutlookCalendar(job.data);
  await googleClient.syncProxyOutlookCalendar(job.data);
  done();
});

// Add's jobs to queue
// object is data( i,e. userId)
// type is either GOOGLE_PROXY or OUTLOOK_PROXY
async function addSyncCalendarJobToQueue(object, type){
  await SyncEventsQueue.add(type, object);
}

module.exports = {
  addSyncCalendarJobToQueue: addSyncCalendarJobToQueue
}

























// Life cycle event's for the queue
// helpful for debugging

SyncEventsQueue.on('error', function(error) {
  console.log("error");
  console.log(error);
});

SyncEventsQueue.on('waiting', function(jobId){
  console.log(" waiting ");
});

SyncEventsQueue.on('active', function(job, jobPromise){
  console.log("active");
})

SyncEventsQueue.on('stalled', function(job){
  console.log("stalled");
})

SyncEventsQueue.on('progress', function(job, progress){
  console.log(" A job's progress was updated!");
})

SyncEventsQueue.on('completed', function(job, result){
  console.log(" job successfully completed" );
})

SyncEventsQueue.on('failed', function(job, err){
  console.log(" job failed");
  console.log(err);
})

SyncEventsQueue.on('paused', function(){
  console.log(" The queue has been paused.");
})

SyncEventsQueue.on('resumed', function(job){
  console.log(" The queue has been resumed.");
})

SyncEventsQueue.on('cleaned', function(jobs, type) {
  console.log(" Old jobs have been cleaned from the queue. `jobs` is an array of cleaned");
  // console.log(" jobs, and `type` is the type of jobs cleaned.
});

SyncEventsQueue.on('drained', function() {
  console.log(" Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)");
});

SyncEventsQueue.on('removed', function(job){
  console.log(" A job successfully removed.");
});