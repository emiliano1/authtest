# Wunderlist WebTask log activity WebHook
 
This webhook will log all activities in your list. The log is saved to a Redis database.
Only lists that contain the text 'webtask' in the title are monitored.
 
 
## Setup

 1. Create RedisLabs account
 1. Create the `webhook` webtask
 1. Create Wunderlist app
 1. Create the `authorize` webtask
 1. Create a 'webtask' list in Wunderlist
 1. Authorize Wunderlist App
 1. Testing
 
### 1. Create RedisLabs account
 
Visit https://redislabs.com and create a free account (30MB storage).
 
Copy the Redis access url in the format `redis://[host]:[port]`
 
### 2. Create the `webhook` webtask
 
Run this command to create the `webhook` webtask endpoint:
 
```shell
$ wt create --secret REDIS_URL=redis_url webhook.js 
```

 - `REDIS_URL` is the redis access url you copied in `Step 1`.

Copy the url that is generated.

### 3. Create Wunderlist app

Visit https://developer.wunderlist.com/apps/new and create a new app.
Fill the Name, Description, App Icon and App URL with any value you want.

In field `Auth Callback URL`, paste the webhook url you copied in `Step 2`.

Copy the `client_id` and `client_secret`.

### 4. Create the `authorize` webtask

Run this command to create the `authorize` webtask endpoint:

```shell
$ wt create --secret WUNDERLIST_CLIENT_ID=wunderlist_client_id --secret WUNDERLIST_CLIENT_SECRET=wunderlist_client_secret --secret WUNDERLIST_STATE=wunderlist_state --secret WEBHOOK_URL=webhook_url authorize.js
```

 - `WUNDERLIST_CLIENT_ID` is the App client ID you copied in `Step 3`.
 - `WUNDERLIST_CLIENT_SECRET` is the App client secret you copied in `Step 3`.
 - `WUNDERLIST_STATE` is any random word you want to use. (copy it, as we will need to use it in a later step)
 - `WEBHOOK_URL` is the webhook url you copied in `Step 2`.
 
 Copy the url that is generated.
 
### 5. Create a 'webtask' list in Wunderlist

In order to use this webhook, you will need to create a new list in Wunderlist, which title contains the text 'webtask'.

This is to make sure we are not using any of your real lists.

### 6. Authorize Wunderlist App

Now you need to authorize the new app to access your lists.

Access this url:

`https://www.wunderlist.com/oauth/authorize?client_id=CLIENT_ID&redirect_uri=AUTHORIZE_URL&state=WUNDERLIST_STATE`

 - `CLIENT_ID` is the App client ID you copied in `Step 3`
 - `AUTHORIZE_URL` is the `authorize` webtask endpoint url you copied in `Step 4`
 - `WUNDERLIST_STATE` is the secret word you copied in `Step 4`

Make sure you pass the correct values, otherwise the authorization will fail.
 
### 7. Testing

Create some tasks in your new list in Wunderlist. Rename these tasks, mark them as completed. Remove them.

Now use a Redis client to see the activity log that was created.

Here are some useful redis commands:

```shell
# list all registered list IDs
$ echo "keys *" | redis-cli -h HOST -p PORT
# 1) "299229839"

# list all log entries for the list 299229839
$ echo "hgetall 299229839" | redis-cli -h HOST -p PORT
# 1) "1492516099.3506608"
# 2) "Task Test created"
# 3) "1492519233.3757474"
# 4) "Task Test renamed to New Test"
# 5) "1492519235.3251886"
# 6) "Task New Test completed!"
# 7) "1492519248.8771832"
# 8) "Task New Test deleted"
```