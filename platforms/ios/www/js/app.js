var MyApp = (function(){
    var tasks = [];
    
    var that = this;
    
    this.eventList = [];
    this.beaconList = [];
    this.paymentWindow = null;
    this.completeDistance = 999.00;
    this.activeBeacons = {};
    this.currentBeacon = {};
    this.completeBeacons = {};
    this.totalBeacons = 0;
    this.activeCheckout = false;
    this.$taskPageListTemplate = null;
    this.$taskPageList = null;
    
    this.coupon = {
        description: null,
        code: null
    };

    this.endpoints = {
        events: 'http://dakmastercc.mybluemix.net/locations',
        beacons: 'http://dakmastercc.mybluemix.net/getBeacons?event=MOC',
        coupons: 'http://dakmastercc.mybluemix.net/flow?name=Meg%20Johnson&ccNum=5455330760000018&cvc=098&mm=09&yy=16'
    };
    
    function getTotalBeacons() {
        return that.totalBeacons;
    }
    
    function completedTaskCount() {
        return Object.keys(that.completeBeacons).length;
    }
    
    function isTaskComplete(beacon) {
        return typeof that.completeBeacons[beacon.minor] !== 'undefined';
    }
    
    function pullEventData() {
        var req = new WLResourceRequest(that.endpoints.events, WLResourceRequest.GET);

        req.send().then(eventDataPulledSuccessfull).fail(beaconDataPulledError);
    }
    
    function eventDataPulledSuccessfull(data) {
        that.eventList = data.responseJSON;
        
        renderPageEvent();
    }
    
    function beaconDataPulledError(error) {
        console.error(error);
    }
    
    function pullBeaconData() {
        var req = new WLResourceRequest(that.endpoints.beacons, WLResourceRequest.GET);

        req.send().then(beaconDataPulledSuccessfull).fail(beaconDataPulledError);
    }
    
    function beaconDataPulledSuccessfull(data) {
        that.beaconList = data.responseJSON;
        
        renderPageTask();
    }
    
    function beaconDataPulledError(data) {
        console.error(data);
    }

    function renderPageEvent() {
        var $template = $('#event-list-template');
        var $eventList = $('#event-list');

        $eventList.html(null);
        
        that.eventList.forEach(function(event){
            
            var $node = $($template.html());

            $node.find('.name').html(event.name);
            $node.find('.image').attr('src', event.image);
            $node.find('.description').html(event.description);
            
            $eventList.append($node);
        });
        
        $('.event-item').on('click', function(){
            Lungo.Router.section('page-task');
        });
    }
    
    
    function pullCouponCode() {
        var resourceRequest = new WLResourceRequest(that.endpoints.coupons, WLResourceRequest.GET);

        resourceRequest.send().then(couponCodePulledSuccessfull).fail(couponCodePulledError)
    }
    
    function couponCodePulledSuccessfull(data) {
        that.coupon.code = data.responseJSON.couponCode;
        that.coupon.description = data.responseJSON.description;
    }
    
    function couponCodePulledError(error) {
        console.error(error);
    }

    function pageEventLoad(){
        pullEventData();
        
        var refresh = new Lungo.Element.Pull('#event-article', {
            onPull: "Pull down to refresh",
            onRelease: "Release to get list of Events",
            onRefresh: "Refreshing...",
            callback: function() {
                pullEventData();

                refresh.hide();
            }
        });
        
        pullCouponCode();
    }
    
    function pageEventUnload() {}
    
    function pageTaskLoad() {

        $('#page-task').find('.title').html("St. Louis, MO");
        
        if(that.$taskPageListTemplate === null) {
            that.$taskPageListTemplate = $('#task-list-template');
            that.$taskPageList = $('#task-list');
        }
        
        pullBeaconData();
        
        Beacon.scan('24DDF411-8CF1-440C-87CD-E368DAF9C93E', function(beacons){
            that.$taskPageList.html(null);
            
            beacons.forEach(function(beacon){
                
                if(typeof that.activeBeacons[beacon.uuid] === 'undefined') {
                    that.activeBeacons[beacon.uuid] = {};
                }
                
                if(typeof that.activeBeacons[beacon.uuid][beacon.minor] === 'undefined') {
                    that.totalBeacons++;
                }

                that.activeBeacons[beacon.uuid][beacon.minor] = beacon;
            });
           

            renderPageTask();
        });
        
        checkForCompletion();
        
        $(document).on('click', '#prize-button', function(){
            Lungo.Router.article('page-prize');
        });
        
        var refresh = new Lungo.Element.Pull('#task-article', {
            onPull: "Pull down to refresh",
            onRelease: "Release to get list of Tasks",
            onRefresh: "Refreshing...",
            callback: function() {
                pullBeaconData();

                refresh.hide();
            }
        });
    }
    
    function checkForCompletion() {
        var $prizeButton = $('#prize-button');

        if(getTotalBeacons() === completedTaskCount() && getTotalBeacons() > 0) {
            Beacon.stopMonitoring();

            if($prizeButton.is(':hidden')) {
                $prizeButton.show();
                Lungo.Router.article('page-prize');
            }
        } else {
            $prizeButton.hide();
        }
    }
    
    function getBeaconDetails(minor) {
        for(var i = 0; i < that.beaconList.length; i++) {
            if(parseInt(that.beaconList[i].Minor) === parseInt(minor)) {
                return that.beaconList[i];
            }
        }
        
        return null;
    }
    
    function renderPageTask() {
        that.$taskPageList.html(null);

        for(var uuid in that.activeBeacons) {
            var beacons = $.map(that.activeBeacons[uuid], function(beacon, index) {
                if(isTaskComplete(beacon)) {
                    beacon.accuracy = that.completeDistance;
                }
                
                return [beacon];
            });

            Beacon.sortBeacons(beacons).forEach(function(beacon){
                var $node = $(that.$taskPageListTemplate.html());

                var distance = beacon.accuracy;

                var details = getBeaconDetails(beacon.minor);
                
                if(details !== null) {
                    $node.find('.name').html(details.Location_Desc );
                
                    var imagePath = 'img/locations/'+details.UUID.toLowerCase()+'/'+details.Minor+'.jpg';

                    $node.find('.image').attr('src', imagePath);

                    if(distance === that.completeDistance) {
                        $node.find('.accuracy').html("DONE");
                        $node.addClass('light');
                    } else {

                        if(distance > 0) {
                            $node.find('.accuracy').html(distance+" m");
                        } else {
                            $node.find('.accuracy').html(null);
                        }

                        if(distance <= 0.25 && distance > 0) {
                            that.currentBeacon = beacon;
                            that.completeBeacons[beacon.minor] = beacon;
                            Lungo.Router.section('page-task-detail');
                        }
                    }

                    that.$taskPageList.append($node);
                }
            });
        }
    }
    
    function pageTaskUnload(){
        Beacon.stopMonitoring();
    }
    
    
    function pageTaskDetailLoad() {
        var details = getBeaconDetails(that.currentBeacon.minor);

        if(details !== null) {
            $('#task-done').html(completedTaskCount());
            $('#task-total').html(getTotalBeacons());
            $('#page-task-detail').find('.title').html(details.Location_Desc);
            $('#task-title').html(details.Location_Desc);
            $('#task-description').html(details.Location_About);
            
            var imagePath = 'img/locations/'+details.UUID.toLowerCase()+'/'+details.Minor+'.jpg';
            $('#task-image').attr('src', imagePath);

            $(document).on('click', '#masterpass-button', function(){
                purchaseItemMC({
                    name: details.data_name,
                    description: details.data_description,
                    amount: details.data_amount,
                    reference: details.data_reference
                });
            });
        }
        
    }
    
    function purchaseItemMC(item) {

        if(!that.activeCheckout) {
            that.activeCheckout = true;
            
            that.paymentWindow = window.open('payment.html','_blank', 'location=no');

            that.paymentWindow.addEventListener('loadstop', function() {
                that.paymentWindow.executeScript({code: "loadData("+JSON.stringify(item)+")"});
            });

            that.paymentWindow.addEventListener('exit', function(){
                that.activeCheckout = false;
                that.paymentWindow.close();
            });
        }
    }
    
    function pageTaskDetailUnload() {}

    function pagePrizeLoad() {
        
        $('#coupon-code').html(that.coupon.code)
        $('#coupon-description').html(that.coupon.description);
        
        $(document).on('click', '#buy-jersey', function(){
            purchaseItemMC({
                name: "St. Louis Jersey",
                description: "St. Louis Sports team jersey",
                amount: 5000,
                reference: 00000
            });
        });
    }
    
    return {
        PageEventLoad: pageEventLoad,
        PageEventUnload: pageEventUnload,
        PageTaskLoad: pageTaskLoad,
        PageTaskUnload: pageTaskUnload,
        PageTaskDetailLoad: pageTaskDetailLoad,
        PageTaskDetailUnload: pageTaskDetailUnload,
        PagePrizeLoad: pagePrizeLoad,
        CompletedTaskCount: completedTaskCount
    };
})();

Lungo.Events.init({
    'load section#login': function(){},
    'load section#page-event' : MyApp.PageEventLoad,
    'unload section#page-event' : MyApp.PageEventUnload,
    'load section#page-task' : MyApp.PageTaskLoad,
    'unload section#page-task' : MyApp.PageTaskUnload,
    'load section#page-task-detail': MyApp.PageTaskDetailLoad,
    'unload section#page-task-detail': MyApp.PageTaskDetailUnload,
    'load section#page-prize': MyApp.PagePrizeLoad
});

Lungo.ready(function() {
    $(document).on('click', '#login-button', function(){
        Lungo.Router.section('page-event');
    });
});