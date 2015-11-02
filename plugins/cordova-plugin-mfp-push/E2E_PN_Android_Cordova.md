# End-to-End Push Notifications for Android in Cordova Projects

This document will help you set up and test push notifications for the Android platform.

### Prerequisites
If you don't already have a backend project with a server running:
- `mfp create backendServer`
- `cd backendServer`
- `mfp start`
- Confirm the server is running by using `mfp status`

## Setup

### Create a Pure Cordova project with the Android platform
- If you don't already have a Pure Cordova project:
    - `mfp cordova create myApp -p android`
    - `cd myApp`

### Update your AndroidManifest.xml
There are a number of changes that need to be made to AndroidManifest.xml. This can be done either by adding our push plugin, or by making the changes manually.

#### Using the Plugin
- Run the following command within your project folder:

````
mfp cordova plugin add cordova-plugin-mfp-push
````

- After doing that, you'll need to open your AndroidManifest.xml and add this line right before the closing `</application>` tag:

```xml
<meta-data android:name="com.google.android.gms.version" android:value="4030500"/>
```

#### Manually
- Add the following before the opening `<application>` tag:

````xml
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.GET_ACCOUNTS" />
<uses-permission android:name="android.permission.USE_CREDENTIALS" />
<permission android:name="$PACKAGE_NAME.permission.C2D_MESSAGE" android:protectionLevel="signature" />
<uses-permission android:name="$PACKAGE_NAME.permission.C2D_MESSAGE" />
````

- Add the following before the closing `</application>` tag:

````xml
<service android:name=".GCMIntentService"/>
<service android:name=".ForegroundService"/>
<receiver android:name="com.worklight.androidgap.push.WLBroadcastReceiver" android:permission="com.google.android.c2dm.permission.SEND">
    <intent-filter>
        <action android:name="com.google.android.c2dm.intent.RECEIVE" />
        <category android:name="$PACKAGE_NAME" />
    </intent-filter>
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <category android:name="$PACKAGE_NAME" />
    </intent-filter>
    <intent-filter>
        <action android:name="com.google.android.c2dm.intent.REGISTRATION" />
        <category android:name="$PACKAGE_NAME" />
    </intent-filter>
</receiver>
<meta-data android:name="com.google.android.gms.version" android:value="4030500" />
````

- **Important:** Make sure to replace any occurrences of `$PACKAGE_NAME` with your package name, for example `com.ibm.myApp`

- *Note:* If you would like to use another version of the Google Play Services, then you will need to set them up manually and change `4030500` to either a different integer or to `@integer/google_play_services_version` depending on your setup. The specific integer given enables you to simply add the tag without needing to manually add a Google Play Services dependency yourself.

### Edit application-descriptor.xml
- Add a `<pushSender>` tag with values for `key` (API Key) and `senderId` inside of the `<android>` tag, so that it looks similar to the line shown below. 

Note: Your API Key should be a mix of alphanumeric characters while your Sender ID should be only numeric characters

````xml
<pushSender key="YOUR_API_KEY" senderId="YOUR_SENDER_ID"/>
````

- You can also use the CLI to set these values using the following commands, which will automatically add the tag for you if it doesn't already exist (this must be done in the same directory as application-descriptor.xml in your Pure Cordova project folder)

````
mfp config android_push_sender_key YOUR_API_KEY
mfp config android_push_sender_id YOUR_SENDER_ID
````

### Setup Conclusion
- Call `mfp push` from your project folder
- That's it!

Note that if you created a new pure cordova project, your app currently won't do anything when you send pushes to it. See the testing section below to implement a bit of code in order to test push notifications.

## Testing
This part of the document will help you set up your app so that it will show a notification or dialog containing a message from a push when it arrives. The dialog is shown if the device is unlocked and the app is on-screen, otherwise the notification is shown.

### Edit index.js
- In your project folder, open /www/js/index.js
- Find the `wlCommonInit` function and add the following line inside the end of it:

```javascript
WL.Client.connect({onSuccess: connectSuccess, onFailure: connectFailure});
```

- Add the following code above the `wlCommonInit` function:

```javascript
function connectSuccess() {
    if (WL && WL.Client.Push) {
        WL.Client.Push.onMessage = function(props, payload) {
            var msg = typeof props.alert === 'string' ? props.alert : props.alert.body;
            WL.SimpleDialog.show('Notification', msg, [{
                text: 'Close',
                handler: function() {}
            }]);
        };
    }
}

function connectFailure() {
    alert("Failed to connect to MFP Server");
}
```

- Save index.js, call `mfp push`, then call `mfp cordova run` to run your app on a device or emulator
    - Note that for push notifications to work on an emulator, it must be using one of the "Google APIs..." targets, as opposed to the regular "Android x.x.x" targets. You can check what target an emulator is using by opening the AVD manager and looking at the value in the "Target Name" column.

### Create a Simple PushAdapter
An easy way to enable testing of push notifications is to create a simple adapter in your backendServer project
- Navigate your console to the root of your backend server project, then call the following:

```
mfp add adapter PushAdapter -t http
```

- Open /adapters/PushAdapter/PushAdapter.xml, and replace the two `<procedure>` tags at the end of the file with the following line:

```xml
<procedure name="sendPush"/>
```

- Open /adapters/PushAdapter/PushAdapter-impl.js, and replace its contents with the following:

```javascript
function sendPush(pushText, payload) {
    var pushOptions = {};
    pushOptions.message = {};
    pushOptions.message.alert = pushText;
    WL.Server.sendMessage("YOUR_APPLICATION_ID", pushOptions);
    return {
        result: "Notification sent to all users."
    };
}
```

- **Important:** Make sure to replace YOUR_APPLICATION_ID with the value of the `id` element in the `<application>` tag from application-descriptor.xml in your pure cordova project. For example: "com_ibm_myApp".
- Save both files, then call `mfp push` from the root of your backend server project

### Testing using PushAdapter
- Do the following command from within your backend server project to trigger a push notification in your app:

```
mfp adapter call PushAdapter/sendPush \"Test Message\"
```

- If your app is open on your screen, you should just see a dialog pop up with the message. Otherwise, a notification should be generated with the message, and the dialog will be shown the next time you open the app.
- If you wish, you may also use the server's REST APIs to send pushes (the REST APIs refer to them as "messages")
