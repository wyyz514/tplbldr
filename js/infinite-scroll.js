var InfiniteScroll = (function() {
    
    var infiniteScrollContainerSelector = "#infinite-scroll-container";
    var infiniteScrollContainer;
    var leftClickHeld = false;
    var initialClickPosition = 0;
    var finalClickPosition = 0;
    
    var boundMoveFirstElementChild;
    
    try {
        infiniteScrollContainer = document.querySelector(infiniteScrollContainerSelector);
        boundMoveFirstElementChild = moveFirstElementChild.call(infiniteScrollContainer);
        
    }
    catch (e) {
        return "Make sure you have the infinite scroll element in the DOM with id " + infiniteScrollContainerSelector + "\n" + e.message;
    }
    
    var subscribers = [];
    
    function subscribe(event, cb) {
        var subscription = {
            event: event,
            cb: cb
        };
        
        var subscriberAlreadyExists = subscribers.filter(function(subscriber) {
            if(subscriber.event == event && cb.toString() === subscriber.cb.toString()) {
                return subscriber;
            }
        })[0];
        
        if(subscriberAlreadyExists) {
            return "There is already a subscription for this event";
        }
        else {
            subscribers.push(subscription);
        }
        return subscription;
    }
    
    function updateSubscribers(event) {
        var updatedSubscribers = subscribers.filter(function(subscriber){
            if(subscriber.event == event) {
                return subscriber;
            }
        }).map(function(subscriber){
            subscriber.cb();
            return subscriber;
        });
        
        console.log(event)
        return updatedSubscribers;
    }
    
    function moveFirstElementChild() {
        var firstChildElement = this.firstElementChild;
        var lastYPos = 0;
        var translateDistance;
        
        return function(currentYPos) {
            if(lastYPos > currentYPos) {
                translateDistance = 0;
                lastYPos = 0;
                if(finalClickPosition - initialClickPosition > 50 && !leftClickHeld)
                    updateSubscribers("dragEnd")
            }
            else if(lastYPos == currentYPos) {
                translateDistance = 0;
            }
            else {
                translateDistance = 50;
            }
            
            firstChildElement.style.transform = "translateY(" + translateDistance +"px)";
            lastYPos = currentYPos;
        }
    }

    function drag(yPos, cb) {
        cb(yPos);
    }



    function attachMouseListeners() {
        this.addEventListener("mousedown", (e) => {
            if (e.button == 0) {
                leftClickHeld = true;
                initialClickPosition = e.y;
                console.log("left click held")
            }
        });

        document.addEventListener("mouseup", (e) => {
            if (e.button == 0) {
                leftClickHeld = false;
                finalClickPosition = e.y;
                console.log("left click unheld")
            }
        });

        this.addEventListener("mousemove", (e) => {
            if (leftClickHeld) {
                drag(e.y, boundMoveFirstElementChild);
            }
            else {
                drag(0, boundMoveFirstElementChild);
            }
        });
    }

    attachMouseListeners.call(infiniteScrollContainer);
    
    return {
        subscribe: subscribe
    };
})();
