	// We need to store the jsonp callback gobally
	if (!YUI.GEO_LOCATION_JSONP) {
		YUI.GEO_LOCATION_JSONP = [];
	}
	
	/**
     * A simple function to get the latitude and longitude from the HTML5 geolocation API with fallbacks the Google Gears 
	 * Geolocation API and IP based geo positioning. Inspired by http://github.com/codepo8/YQL-Geo-Library and others.
     * @module geolocation
     */
	
	/**
     * A simple function to get the latitude and longitude from the HTML5 geolocation API with fallbacks the Google Gears 
	 * Geolocation API and IP based geo positioning. Inspired by http://github.com/codepo8/YQL-Geo-Library and others.
     * @class geolocation
	 * @param fSuccess {Function} Success callback function called when all is done and ok.
	 * @param fFailure {Function} Failure callback function called when something has gone wrong.
	 * @param oContext {Object} OPTIONAL Set the scope of the callback functions to this object.
     */
	
	var YLang = Y.Lang,
		w3c,
		gears,
		ip,
		jsonp;
	
	/**
     * <p>Try and use the HTML5 Geolocation API if that fails goto gears</p>
     *
     * @method w3c
     * @private
     */
	w3c = function() {
		var self = this;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				self.success({ 
					latitude: position.coords.latitude, 
					longitude: position.coords.longitude, 
					provider: "W3C"
				});
		    }, function(oError) {
				gears.call(self);
		    });
		} else {
			gears.call(this);
		}
	};
	
	/**
     * <p>Try and use the Google Gears Geolocation API if that fails goto ip</p>
     *
     * @method gears
     * @private
     */
	gears = function() {
		var self = this,
			gearsGeoLocation;
		if (window.google && window.google.gears) {
			gearsGeoLocation = window.google.gears.factory.create('beta.geolocation');
			if (gearsGeoLocation.hasPermission) {
				gearsGeoLocation.getCurrentPosition(function(position) {
					self.success({ 
						latitude: position.latitude, 
						longitude: position.longitude, 
						provider: "Gears"
					});
			    }, function() {
					ip.call(self);
			    });
			} else {
				ip.call(this);
			}
		} else {
			ip.call(this);
		}
	};
	
	/**
     * <p>Try and use the Google Gears Geolocation API if that fails call the failure callback function</p>
     *
     * @method w3c
     * @private
     */
	ip = function() {
		jsonp('http://jsonip.appspot.com', null, function(oIpData){
			if (oIpData && oIpData.ip) {
				jsonp('http://query.yahooapis.com/v1/public/yql', {
					q: 'SELECT * FROM geo.places WHERE woeid IN (SELECT place.woeid FROM flickr.places WHERE (lat,lon) in (SELECT Latitude, Longitude FROM ip.location WHERE ip = "' + oIpData.ip + '"))',
					format: 'json',
					env: 'http://datatables.org/alltables.env'
				}, function(oData){
					if (!oData.error && oData.query && oData.query.results && oData.query.results.place) {
						this.success({ 
							latitude: oData.query.results.place.centroid.latitude,
							longitude: oData.query.results.place.centroid.longitude,
							provider: "IP"
						});
					} else {
						this.failure();
					}
				}, this);
			} else {
				this.failure();
			}
		}, this);
	};
	
	/**
	 * <p>Used to make jsonp request when IP look up is used</p>
	 * @method jsonp
	 * @private
	 * @param sUrl {String} sUrl Url to the JSONP service
	 * @param oParams {Object} Object with key value pairs of the params passed to JSONP service
	 * @param fCallback {Function} Callback function called when it's done
	 * @param oContext {Object} Becomes this in the callback
	 * @return {} Don't return anyting usefull
	 */
	jsonp = function(sUrl, oParams, fCallback, oContext) {
		
		oParams = oParams || {};
		
		var elScript = document.createElement('script'),
			elHead = document.getElementsByTagName('head')[0],
			aParams = [],
			timer,
			sSrc,
			i = YUI.GEO_LOCATION_JSONP.length;
		
		YUI.GEO_LOCATION_JSONP[i] = function(oData) {
			clearTimeout(timer);
			elHead.removeChild(elScript);
			fCallback.call(oContext, oData);
			YUI.GEO_LOCATION_JSONP[i] = function() {};
		};
		
		oParams.callback = 'YUI.GEO_LOCATION_JSONP[' + i + ']';
		
		Y.Object.each(oParams, function(sValue, sKey){
			aParams.push(sKey + '=' + encodeURIComponent(sValue));
		});
		
		sSrc = sUrl + '?' + aParams.join('&');
		
	    elScript.setAttribute('src', sSrc);

		timer = setTimeout(function(){
			elHead.removeChild(elScript);
			fCallback.call(oContext);
		}, 30000);

		elHead.appendChild(elScript);
	};
		
	/**
	 * @method Y.geolocation
	 * @param fSuccess {Function} Success callback function called when all is done and ok.
	 * @param fFailure {Function} Failure callback function called when something has gone wrong.
	 * @param oContext {Object} OPTIONAL Set the scope of the callback functions to this object.
	 * @static
	 */
	Y.geolocation = function(fSuccess, fFailure, oContext) {
		w3c.call({
			/**
	        * @private
	        * @property success
	        * @description The callback method
			* @param {Object} The object containing 
	        */
			success: function(oCoords){
				if (YLang.isObject(oCoords) && YLang.isValue(oCoords.latitude) && YLang.isValue(oCoords.latitude)) {
					if (Y.Lang.isFunction(fSuccess)) {
						fSuccess.call(oContext, oCoords);
					}				
				} else if (Y.Lang.isFunction(fFailure)) {
					fFailure.call(oContext);
				}
			},
			/**
	        * @private
	        * @property failure
	        * @description The callback method
	        */
			failure: function(oError){
				fFailure.call(oContext);
			}
		});
	};