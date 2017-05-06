define(['jquery'], function($) {
    var TResource = function() {
        var cacheEnabled = false;
        var log = false;

        var fs = nodeRequire("fs");
        var path = nodeRequire("path");

        /*
         * Set cache support (i.e. use of localStorage)
         * If true, check validity of cached data, ensuring that it is no older than 1 day
         * @param {boolean} value
         */
        this.setCacheEnabled = function(value, version) {

            var clearCache = function() {
                var toBeRemoved = [];

                for (var i=0; i<localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key.substring(0, 7)=="client.") {
                        toBeRemoved.push(key);
                    }
                }

                for (i=0;i<toBeRemoved.length;i++) {
                    localStorage.removeItem(toBeRemoved[i]);
                }
            }
            cacheEnabled = value;
            if (cacheEnabled) {
                // check validity of data
                var oldVersion = localStorage.getItem("client.version");
                if (oldVersion) {
                    oldVersion = parseInt(oldVersion);
                    if (version !== oldVersion) {
                        // Versions differ: clear cache
                        clearCache();
                    }
                } else {
                    // cache does not contain version: clear it
                    clearCache();
                }
                try {
                    localStorage.setItem("client.version", version);
                } catch (e) {
                    // in case setItem throws an exception (e.g. private mode)
                    // set cacheEnabled to false
                    cacheEnabled = false;
                }
            }
            return cacheEnabled;
        };

        /*
         * Get value from a JSON resource file
         * @param {String} name the name of resource file
         * @param {Array} fields the fields to retrieve from resource file. If empty, returns all file content
         * @param {Function} callback
         * @param {Function} errorCallback
         */
        this.get = function(name, fields, callback, errorCallback) {
            if (cacheEnabled) {
                // try to retrieve value from local storage
                var value = localStorage.getItem("client."+name);
                if (value) {
                    // value is available from local storage
                    callback.call(this,JSON.parse(value));
                    return;
                }
            }
            var self = this;
            try {
                // remove "file://" from url
                var newName = name.substr(7);
                var newName = path.normalize(newName);
                var content = fs.readFileSync(newName, {encoding: 'utf8'});
                var data = JSON.parse(content);
                var value;
                if (fields.length>0) {
                    value = {};
                    for (var i=0; i<fields.length; i++) {
                        if (typeof data[fields[i]] !== 'undefined') {
                            value[fields[i]] = data[fields[i]];
                            self.log("found field '"+fields[i]+"' in resource '"+name);
                        }
                    }
                } else {
                    value = data;
                }
                if (cacheEnabled) {
                    try  {
                        localStorage.setItem("client."+name,JSON.stringify(value));
                    } catch (e) {
                        this.error("Error trying to cache value "+value+": "+e);
                    }
                }
                callback.call(this, value);
            }
            catch (error) {
                window.console.log("error while reading file: "+error);
                if (typeof errorCallback !== 'undefined') {
                    errorCallback.call(this, error);
                } else {
                    self.error("Error loading resource '"+name+"'");
                    callback.call(this, {});
                }
            }
        };


         /*
         * Get value from a text resource file
         * @param {String} name the name of resource file
         * @param {Function} callback
         * @param {Function} errorCallback
         */
        this.getPlain = function(name, callback, errorCallback) {
            if (cacheEnabled) {
                // try to retrieve value from local storage
                var value = localStorage.getItem("client."+name);
                if (value) {
                    // value is available from local storage
                    // postpone callback execution
                    setTimeout(function() {
                        callback.call(this,value);
                    }, 0);
                    return;
                }
            }
            var self = this;
            try {
                // remove "file://" from url
                var newName = name.substr(7);
                var newName = path.normalize(newName);
                var content = fs.readFileSync(newName, {encoding: 'utf8'});
                if (cacheEnabled) {
                    try {
                        localStorage.setItem("client."+name,content);
                    } catch (e) {
                        this.error("Error trying to cache value "+content+": "+e);
                    }
                }
                callback.call(this, content);
            }
            catch (error) {
                window.console.log("error while reading file: "+error);
                if (typeof errorCallback !== 'undefined') {
                    errorCallback.call(this, error);
                } else {
                    self.error("Error loading resource '"+name+"'");
                    callback.call(this, {});
                }
            }
        };
        var log, error;

        this.setLog = function(value) {
            log = value;
        };

        this.setError = function(value) {
            error = value;
        };

        this.log = function(message) {
            if (log) {
                window.console.log(message);
            }
        };

        this.error = function(message) {
            if (error) {
                window.console.error(message);
            } else {
                this.log("ERROR> "+message);
            }
        };
    };

    var resourceInstance = new TResource();

    return resourceInstance;
});
