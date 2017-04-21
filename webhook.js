var redis = require('redis');

/**
 * @param {secret} REDIS_URL - Redis url in the format [redis:]//[[user][:password@]][host][:port][/db-number]
 */

// Receives Wunderlist WebHook notifications for changed items in a registered list
// Logs the operations to Redis
module.exports = function (ctx, cb) {
  var REDIS_URL = ctx.data.REDIS_URL;
  if (!REDIS_URL) return cb(new Error('REDIS_URL secret is missing'));

  var client = redis.createClient({url: REDIS_URL});

  console.log('ctx.data');
  console.log(JSON.stringify(ctx.data, null, 4));

  var msg = null;

  switch (ctx.data.operation) {
    case 'create':
      msg = 'Task ' + ctx.data.after.title + ' created';
      break;
    case 'update':
      if (ctx.data.after.completed && !ctx.data.before.completed) {
        msg = 'Task ' + ctx.data.after.title + ' completed!';
      } else if (ctx.data.after.title != ctx.data.before.title) {
        msg = 'Task ' + ctx.data.before.title + ' renamed to ' + ctx.data.after.title;
      } else {
        msg = 'Task ' + ctx.data.after.title + ' updated';
      }
      break;
    case 'delete':
      msg = 'Task ' + ctx.data.after.title + ' deleted';
      break;
    default:
      msg = 'Operation not supported: ' + ctx.data.operation;
  }

  // log format
  // LIST_ID:
  //   TIMESTAMP: LOG MESSAGE 1
  //   TIMESTAMP: LOG MESSAGE 2
  console.log('Saving to redis...');
  console.log('[' + ctx.data.after.list_id + '][' + ctx.data.enqueued_at + '] ' + msg);

  client.hset(ctx.data.after.list_id, ctx.data.enqueued_at, msg, redis.print);

  cb(null, 'ok');
};