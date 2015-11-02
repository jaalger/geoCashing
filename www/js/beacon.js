var Beacon = (function(){
    var that = this;

    this.accuracy = 0.25;
    
    this.callback = function(){};
    
    this.uuids = [];
    
    function init() {
        that.delegate = new cordova.plugins.locationManager.Delegate();
        that.delegate.didRangeBeaconsInRegion = didRangeBeaconsInRegion;
        
        cordova.plugins.locationManager.setDelegate(that.delegate);
        cordova.plugins.locationManager.requestWhenInUseAuthorization();
    }
    
    function didRangeBeaconsInRegion(pluginResult) {
        var i, signalStrength = 0;
        
        var beacons = [];

        for (i = 0; i < pluginResult.beacons.length; i++) {
            var beacon = pluginResult.beacons[i];
            
            beacons.push(beacon);
        }
        
        beacons = sortBeacons(beacons);
        
        if(typeof that.scanCallback === 'function') {
            that.scanCallback(beacons);
        }
    }
    
    function setAccuracy(accuracy) {
        accuracy = parseFloat(accuracy);
    }
    
    function scan(uuid, callback){
        that.uuids.push(uuid);

        var region = new cordova.plugins.locationManager.BeaconRegion('beacon', uuid);
        cordova.plugins.locationManager.startRangingBeaconsInRegion(region).fail(console.error).done();
        
        that.scanCallback = callback;
    }
    
    function stopMonitoring() {
        that.uuids.forEach(function(id){
            var region = new cordova.plugins.locationManager.BeaconRegion('beacon', id);

            cordova.plugins.locationManager.stopMonitoringForRegion(region).fail(console.error).done();
        });
    }
    
    function sortBeacons(beacons) {
        beacons.sort(function(a, b) {
            return parseFloat(a.accuracy) - parseFloat(b.accuracy);
        });
        
        return beacons;
    }
    
    return {
        init: init,
        scan: scan,
        stopMonitoring: stopMonitoring,
        sortBeacons: sortBeacons,
        setAccurary: setAccuracy
    };
})();