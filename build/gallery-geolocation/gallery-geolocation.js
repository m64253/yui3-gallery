YUI.add('gallery-geolocation', function(Y) {

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
		ip;
	
	/**
     * <p>Try and use the HTML5 Geolocation API if that fails goto gears</p>
     *
     * @method w3c
     * @private
     */
	w3c = function(bGoToNext) {
		var self = this;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				self.success({ 
					latitude: position.coords.latitude, 
					longitude: position.coords.longitude, 
					provider: "W3C"
				});
		    }, function(oError) {
				if (!bGoToNext) {
					gears.call(self);
				} else {
					self.failure();
				}
		    });
		} else if (!bGoToNext) {
			gears.call(this);
		} else {
			this.failure();
		}
	};
	
	/**
     * <p>Try and use the Google Gears Geolocation API if that fails goto ip</p>
     *
     * @method gears
     * @private
     */
	gears = function(bGoToNext) {
		var self = this,
			gearsGeoLocation;
		if (window.google && google.gears && YLang.isFunction(google.gears.factory.create)) {
			gearsGeoLocation = google.gears.factory.create('beta.geolocation');
			if (gearsGeoLocation.hasPermission) {
				gearsGeoLocation.getCurrentPosition(function(position) {
					self.success({ 
						latitude: position.latitude, 
						longitude: position.longitude, 
						provider: "Gears"
					});
			    }, function() {
					if (!bGoToNext) {
						ip.call(this);
					} else {
						this.failure();
					}
			    });
			} else {
				if (!bGoToNext) {
					ip.call(this);
				} else {
					this.failure();
				}
			}
		} else if (!bGoToNext) {
			ip.call(this);
		} else {
			this.failure();
		}
	};
	
	/**
     * <p>Try and use the Google Gears Geolocation API if that fails call the failure callback function</p>
     *
     * @method w3c
     * @private
     */
	ip = function() {
		
		// Get the client IP address
		Y.jsonp('http://jsonip.appspot.com', {
			on: {
				success: function(oIpData) {
					
					// Make a request to YQL to get latitude and longitude
					var oYQLQuery = new Y.yql('SELECT * FROM geo.places WHERE woeid IN (SELECT place.woeid FROM flickr.places WHERE (lat,lon) in (SELECT Latitude, Longitude FROM ip.location WHERE ip = "' + oIpData.ip + '"))');
					
					oYQLQuery.on('query', function(oData){
						
						if (oData.results && oData.results.place) {
							this.success({ 
								latitude: oData.results.place.centroid.latitude,
								longitude: oData.results.place.centroid.longitude,
								provider: "IP"
							});
						} else {
							this.failure();
						}				
						
					}, this);
					
					oYQLQuery.on('error', this.failure, this);
				},
				failure: this.failure,
				timeout: this.failure
			},
			context: this
		});
	};
			
	/**
	 * @method Y.geolocation
	 * @param fSuccess {Function} Success callback function called when all is done and ok.
	 * @param fFailure {Function} Failure callback function called when something has gone wrong.
	 * @param oContext {Object} OPTIONAL Set the scope of the callback functions to this object.
	 * @param bForce {String} OPTIONAL Use <code>w3c</code> or <code>gears</code> or <code>ip</code>.
	 * @static
	 */
	Y.geolocation = function(fSuccess, fFailure, oContext, bForce) {
		
		var o = {
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
			};
		
		if (bForce === 'w3c') {
			w3c.call(o, true);
		} else if (bForce === 'gears') {
			gears.call(o, true);
		} else if (bForce === 'ip') {
			ip.call(o);
		} else {
			w3c.call(o);
		}
	};


}, '@VERSION@' ,{requires:['gallery-jsonp','gallery-yql']});
