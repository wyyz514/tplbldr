var helpers = (function(){
    var wordBetweenBraces = new RegExp(/\{(.*?)\}/);

    function makeArray() {
        return Array.prototype.slice.call(this);
    }
    /**
    makeRequest
    ------------
    wrapper around jquery ajax
    can handle get and post requests
    postData (object) is passed as the second argument of the function
    a function is returned expecting the url. When executed this function
    returns a http promise which can have a success function or error function
    for performing operations on the data returned or taking action on error.
 */
    function makeRequest(method) {
        var postData;
        if(arguments[1] && typeof arguments[1] === "object") {
            postData = arguments[1];
        }
        return function getPromise(url) {
            //returns thenable ajax promise
            if (typeof $ != 'undefined' && $.ajax) {
                return $.ajax({
                    method:method,
                    url:url,
                    data:postData ? postData : ""
                });
            }
            else {
                return new Promise(function(resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open(method, url, true);
                    xhr.onreadystatechange = function() {
                        if(xhr.status == 200 && xhr.readyState == 4) {
                            resolve(JSON.parse(xhr.responseText));
                        }
                    }
                    xhr.onerror = function(e) {
                        reject(e);
                    }
                    xhr.send();
                });
            }
        }
    }

    /**
    combineProps
    ------------
    Takes a data object (from remote source usually) and any otherProps to include,
    and combines these into one object for more straightforward usage
  */
    function combineProps(a, b) {
        var newObj = {}; //object to return

        //get keys of the data object
        var aKeys = Object.keys(a);

        //get keys of the otherProps object and add those to the 
        //keys of the data object if they don't already exist
        //IOW combine the keys into one array
        Object.keys(b).map(function(key){
            if(aKeys.indexOf(key) < 0) {
                aKeys.push(key);
            }
        });

        //here, we're just constructing a new object
        //that combines the key value's in the two data sources
        //a.props + b.props = newObj.props
        //note that if the same prop appears in a and b, the prop in a is used
        //and the one in b is ignored
        aKeys.forEach(function(key){
            if(a.hasOwnProperty(key) && dig(a, key) && !(b.hasOwnProperty(key) && dig(b, key))) {
                newObj[key] = dig(a, key);
            }
            else if(b.hasOwnProperty(key) && dig(b, key)){
                newObj[key] = dig(b, key);
            }
            else {
                newObj[key] = key + " not found";
            }
        });

        //for combining properties into a new property
        //ie prop[name] = prop[firstname] +  prop[lastname]
        if(b['toBuild']) {
            var keys = Object.keys(b['toBuild']);
            var newProp = "";
            keys.map(function(key){
                b['toBuild'][key].map(function(prop){
                    if(dig(newObj, prop))
                        newProp += dig(newObj, prop) + " ";
                    else {
                        newProp = "";
                        return;
                    }
                });
                newObj[key] = newProp;
                newProp = "";
            });
        }

        //if some properties need formatting
        //using pre-defined formatting functions
        if(b['toFormat']) {
            var keys = Object.keys(b['toFormat']);

            keys.map(function(key){
                if(dig(newObj, key)) {
                    var value = dig(newObj, key);
                    
                    if(b['toFormat'][key].length == 1) {
                        value = formatters[b['toFormat'][key][0]](value);
                        newObj[key] = value;
                    }
                    else {
                        var formatter = b['toFormat'][key].reduce(function(prev, next) {
                            return compose( (typeof prev == "function" ? prev : formatters[prev]), (typeof next == "function" ? next : formatters[next]) );
                        });
                        newObj[key] = formatter(value);
                    }
                }
            });
            console.log(newObj);
        }

        /*
            paramLink = {
             link: '/{somethingToReplace}/path',
             attrToFill: new key to add to the data obj,
             fallbackParam: another key to look for if somethingToReplace is not found in the data obj
            }
        */
        if(b['toLink']) {
            b['toLink'].map(function(paramLink){
                var linkWithParam = paramLink["link"];
                try {
                    var paramKey = wordBetweenBraces.exec(linkWithParam)[1];
                    if(!paramKey)
                        throw new Error("paramKey not found in toLink: can't find anything between braces");
                    else {
                        //hack
                        var replacementParam = newObj[paramKey] ? newObj[paramKey] : newObj[paramLink.fallbackParam];
                        var linked = linkWithParam.replace("{"+paramKey+"}", replacementParam);
                        var newProp = paramLink['attrToFill'];
                        newObj[newProp] = linked;
                    }
                }catch(e) {
                    console.error(e);
                }
            });
        }
        return newObj;
    }

    /**
  setProps
  --------
  uses parent element to find children
  with attr specified and obj to populate
  ie <div data-attr='name' class='with-attr'></div> will be populated with
  obj.name
*/
    function setProps(attr, obj) {

        var otherProps = arguments[2];
        //returns a function expecting the wrapper element
        return function setPropsOn(el) {
            var data = otherProps? combineProps(obj, otherProps) : obj;
            var childrenWithAttr = el.querySelectorAll(".with-attr");
            var _childrenWithAttr = makeArray.call(childrenWithAttr);

            _childrenWithAttr.map(function(c){
                var key = c.getAttribute(attr);

                if(key === "image" || key === 'avatar') {
                    c.src = data[key] ? data[key] : dig(data, key);
                }
                else if(key.toLowerCase().match("link")){
                    c.href = data[key] ? data[key] : dig(data, key);
                }
                else {
                    c.innerHTML = (data[key] ? data[key] : dig(data, key)) || "";
                }
            });

            return el;
        }
    }

    function toggleClass(className) {
        return function toggleClassNameOn(el) {
            var _el = document.querySelector(el);
            if(!_el) {
                console.log("Could not find element", el);
                return;
            }

            if(_el.classList.contains(className)) {
                _el.classList.remove(className);
            }
            else {
                _el.classList.add(className);
            }
            return el;
        }
    }

    function stringifyEl(el) {
        if(typeof el.reduce === "function") {
            return el.reduce(function(prev, next){
                return prev + next.outerHTML;
            }, "");
        }
        else {
            return el.outerHTML;
        }
    }

    function compose(f1, f2) {
        return function composed(x) {
            return f1(f2(x));
        }
    }

    function appendTo(selector) {
        return function appendToSel(content) {
            try {
                var el = document.querySelector(selector);
                el.appendChild(content);
            }
            catch(e) {
                throw new Error(e);
            }
        }
    }

    function clear(selector) {
        return function clearSelected(parent) {
            var parentEl = document.querySelector(parent);
            try {
                if(selector === "*") {
                    parentEl.innerHTML = "";
                    return;
                }

                var childrenToRemove = Array.prototype.slice.call(parentEl.querySelectorAll(selector));
                childrenToRemove.map(function(c){
                    typeof $ != 'undfined' ? $(c).remove() : c.parentElement.removeChild(c);
                });
            }catch(e) {
                throw new Error(e);
            }
        }
    }

    function createEventHandler(handler) {
        return function eventHandler(e) {
            handler(e);
        }
    }


    function formatPrice(price) {
        var currency = arguments[1] || '$';
        var parsedPrice = parseFloat(price).toFixed(2).toString();
        var priceChunks = parsedPrice.split(".");
        var formattedPrice = ""+currency+""+ Math.round(price);
        return formattedPrice;
    }

    function capitalize(s) {

        if(typeof s === "string") {
            var chunks = s.toLowerCase().split(" ");
            var _chunks = chunks.map(function(c){
                if(c.length > 0 )
                    return c[0].toUpperCase().concat(c.substr(1).toLowerCase());
            });
            return _chunks.join(" ");
        }
    }

    function lower(s) {
        return s.toLowerCase();
    }

    function join(s) {
        return s.replace(/\s/g, "");
    }

    function filterBy(data, predicate) {
        return function() {
            var key = arguments[0] ? arguments[0] : "";
            return data.filter(function(datum){
                if(key) {
                    if(predicate(datum[key]))
                        return datum;
                }

                if(predicate(datum))
                    return datum;
            });    
        }
    }

    //dig into a nested object
    //eg dig({...}, "some.path.to.some.value")
    //returns the value
    function dig(o, path) {
        function _dig(arr, index, cont) {
            //don't iterate over the last key
            //instead pass it to the continuation
            //to return the value
            if(index == arr.length - 1) {
                return cont(arr[index]);
            }
            //cont(arr[index]) == o[x] in the first invocation of _dig
            return _dig(arr, index + 1, function(y){return cont(arr[index])[y]});
        }
        return _dig(path.split("."), 0, function(x){return o[x]});
    }

    var formatters = {};

    formatters['price'] = formatPrice;
    formatters['capitalize'] = capitalize;
    formatters['join'] = join; formatters['lower'] = lower;
    formatters["upper"] = function (s) {
        return s.toUpperCase();
    }
    
    return {
        makeRequest:makeRequest,
        setProps:setProps,
        toggleClass:toggleClass,
        compose:compose,
        stringifyEl:stringifyEl,
        appendTo:appendTo,
        clear:clear,
        createEventHandler:createEventHandler,
        capitalize:capitalize,
        format: formatters,
        filterBy:filterBy,
        dig:dig,
        makeArray: makeArray
    }
})();
