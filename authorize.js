var unirest = require('unirest');
var _ = require('lodash');

var WUNDERLIST_CLIENT_ID = null;
var WEBHOOK_URL = null;

// get all user's lists
function get_lists(access_token, cb) {
  return unirest.get('https://a.wunderlist.com/api/v1/lists')
    .header('X-Access-Token', access_token)
    .header('X-Client-ID', WUNDERLIST_CLIENT_ID)
    .end(function(response) {
      console.log('Lists: ' + JSON.stringify(response.body));

      var lists = JSON.parse(JSON.stringify(response.body));
      lists = _.filter(lists, {'list_type': 'list'});

      cb(lists);
    });
}

// picks a list which title contains the text 'webtask'
function pick_list(lists) {
  return _.find(lists, function(list) {
    return _.includes(list['title'], 'webtask');
  });
}

// registers a list to receive webhook notifications
function register_list(access_token, list, cb) {
  return unirest.post('https://a.wunderlist.com/api/v1/webhooks')
    .header('X-Access-Token', access_token)
    .header('X-Client-ID', WUNDERLIST_CLIENT_ID)
    .send({
      'list_id': list['id'],
      'url': WEBHOOK_URL,
      'processor_type': 'generic',
      'configuration': ''
    })
    .end(function(response) {
      console.log('WebHook: ' + JSON.stringify(response.body));

      cb();
    });
}

/**
 * @param {secret} WUNDERLIST_CLIENT_ID - Wunderlist Client ID
 * @param {secret} WUNDERLIST_CLIENT_SECRET - Wunderlist Client Secret
 * @param {secret} WUNDERLIST_STATE - Wunderlist State
 * @param {secret} WEBHOOK_URL - WebTask WebHook url
 */
// Authorize Wunderlist
// Registers a list which title contains the text 'webtask' to receive webhook notifications
module.exports = function (ctx, cb) {
  WUNDERLIST_CLIENT_ID = ctx.data.WUNDERLIST_CLIENT_ID;
  if (!WUNDERLIST_CLIENT_ID) return cb(new Error('WUNDERLIST_CLIENT_ID secret is missing'));

  var WUNDERLIST_CLIENT_SECRET = ctx.data.WUNDERLIST_CLIENT_SECRET;
  if (!WUNDERLIST_CLIENT_SECRET) return cb(new Error('WUNDERLIST_CLIENT_SECRET secret is missing'));

  var WUNDERLIST_STATE = ctx.data.WUNDERLIST_STATE;
  if (!WUNDERLIST_STATE) return cb(new Error('WUNDERLIST_STATE secret is missing'));

  WEBHOOK_URL = ctx.data.WEBHOOK_URL;
  if (!WEBHOOK_URL) return cb(new Error('WEBHOOK_URL secret is missing'));

  console.log('ctx.data');
  console.log(JSON.stringify(ctx.data, null, 4));

  if (ctx.data.state === WUNDERLIST_STATE) {
    unirest.post('https://www.wunderlist.com/oauth/access_token')
      .send({
        'client_id': WUNDERLIST_CLIENT_ID,
        'client_secret': WUNDERLIST_CLIENT_SECRET,
        'code': ctx.data.code
      })
      .end(function(response) {
        console.log('Response: ' + JSON.stringify(response.body));

        var access_token = JSON.parse(JSON.stringify(response.body))['access_token'];
        if (access_token) {
          console.log('Access Token: ' + access_token);

          get_lists(access_token, function(lists) {
            console.log('Lists: ' + lists);

            var list = pick_list(lists);

            if (list) {
              register_list(access_token, list, function() {
                cb(null, "Adding WebHook to list '" + list['title'] + "'");
              });
            } else {
              cb(null, "Create a list which title contains the text 'webtask'");
            }
          });
        } else {
          cb(null, 'Unauthorized');
        }
      });
  } else {
    cb(null, 'Denied');
  }
};