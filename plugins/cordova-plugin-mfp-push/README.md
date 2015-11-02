<!---Licensed Materials - Property of IBM
5725-I43 (C) Copyright IBM Corp. 2015. All Rights Reserved.
US Government Users Restricted Rights - Use, duplication or
disclosure restricted by GSA ADP Schedule Contract with IBM Corp.-->

# IBM MobileFirst Platform Foundation Push Plugin
This plugin adds push notification functionality to Android by making changes to the AndroidManifest.xml file.
You must complete further steps to set up Android push notifications. See the following end-to-end example.

## Installation
To add this plugin to a Cordova project using the MobileFirst CLI, run this inside of your Cordova project:

		mfp cordova plugin add cordova-plugin-mfp-push

After doing that, you'll need to open your AndroidManifest.xml and add this line right before the closing `</application>` tag

		<meta-data android:name="com.google.android.gms.version" android:value="4030500"/>

- *Note:* If you would like to use another version of the Google Play Services, then you will need to set them up manually and change `4030500` to either a different integer or to `@integer/google_play_services_version` depending on your setup. The specific integer given enables you to simply add the tag without needing to manually add a Google Play Services dependency yourself.

You'll also need to add your API Key and Sender ID to application-descriptor.xml. In the same directory as the application-descriptor.xml, run the 'mfp config' command like this:

		mfp config android_push_sender_key YOUR_API_KEY
		mfp config android_push_sender_id YOUR_SENDER_ID

## Supported Platforms
- Android

## Additional Setup and Testing
- [End-to-End Push Notifications for Android in Cordova Projects](E2E_PN_Android_Cordova.md) details a basic end-to-end process for setting up and testing push notifications for Android in Cordova projects.

## Documentation
- [Push Notifications](http://www-01.ibm.com/support/knowledgecenter/SSHS8R_7.1.0/com.ibm.worklight.dev.doc/devref/t_setting_up_push_notification_android.html)
- [API](http://www-01.ibm.com/support/knowledgecenter/SSHS8R_7.1.0/com.ibm.worklight.apiref.doc/html/refjavascript-client/html/WL.Client.Push.html)
