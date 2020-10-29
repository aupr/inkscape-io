/*
 *
 * SCADAvis.io Synoptic API © 2018-2020 Ricardo L. Olsen / DSC Systems ALL RIGHTS RESERVED.
 * 
 * WARNING: THE UNAUTHORIZED COPY OR HOST OF THIS FILE IS ILLEGAL!
 * 
 * LICENSE AGREEMENT:
 * THE USER OF THIS SOFTWARE LIBRARY HEREBY AGREES (UNLESS SPECIFICALLY LICENSED OU AUTHORIZED TO) 
 * TO JUST LINK (POINT TO OUR SERVERS) ITS OWN WEB APPS TO THIS SOFTWARE LIBRARY AND STRICTLY 
 * SHALL NOT IN ANY WAY HOST IT BY HIMSELF OR BY THIRD PARTY MEANS.
 *    
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
 
/**
 * SCADAvis.io synoptic API.
 * @class scadavis - Must be created with the "new" keyword. E.g. var svgraph = new scadavis("div1", "", "https://svgurl.com/svgurl.svg");
 * @param {string} [container] - ID of the container object. If empty or null the iframe will be appended to the body.
 * @param {string} [iframeparams] - Parameter string for configuring iframe (excluding id and src and sandbox) e.g. 'frameborder="0" height="250" width="250"'.
 * @param {string} [svgurl] - URL for the SVG file.
 * @param {{container: string|Object, iframeparams: string, svgurl: string}} [paramsobj] - Alternatively parameters can be passed in an object.
 * E.g.: svgraph = new scadavis( {container: "div1"} );
 */
function scadavis(container, iframeparams, svgurl) {
    var _this = this;
    var version = "1.0.5";
    var id;
    var iframehtm;
    var scrolling = ' scrolling="no" '; 

    if (typeof container === "object") {
        _this.container = container.container || "";
        _this.apikey = container.apikey || "";
        _this.iframeparams = container.iframeparams || 'frameborder="0" height="250" width="250"';
        _this.svgurl = container.svgurl || "";
    }
    else {
        _this.container = container || "";
        _this.apikey = apikey || "";
        _this.iframeparams = iframeparams || 'frameborder="0" height="250" width="250"';
        _this.svgurl = svgurl || "";
    }

    _this.iframe = null;
    _this.componentloaded = false;
    _this.readyfordata = false;
    _this.domain = "https://scadavis.io";
    _this.rtdata = { data: { type: "tags", tags: [] } };
    _this.npts = {};
    _this.vals = {};
    _this.qualifs = {};
    _this.descriptions = {};
    _this.npt = 0;
    _this.svgobj = null;
    _this.zoomobj = null;
    _this.moveobj = null;
    _this.enabletoolsobj = null;
    _this.enablekeyboardobj = null;
    _this.enableflashobj = null;
    _this.hidewatermarkobj = null;
    _this.setcolorobj = [];
    _this.resetobj = null;
    _this.tagsList = "";
    _this.onready = null;
    _this.onclick = null;
    _this.loadingSVG = 0;

    /**
     * Generate an unique DOM element ID.
     * @private
     * @method guidGenerator
     * @returns {string} DOM ID.
     */
    _this.guidGenerator = function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    /**
     * Create a DOM element from HTML.
     * @method createElementFromHTML
     * @private
     * @returns {string} DOM ID.
     */
    _this.createElementFromHTML = function (htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }

    id = _this.guidGenerator();

    if (typeof _this.container === "string") {
        _this.container = document.getElementById(_this.container);
        if (_this.container === null) {
            _this.container = document.body;
        }
    }

    // default is scrolling='no'
    if ( _this.iframeparams.indexOf("scrolling") >=0  )
       scrolling = ''; 

    iframehtm = '<iframe id="' + id + '" sandbox="allow-scripts allow-same-origin" ' + _this.iframeparams + scrolling + ' src="a.html"></iframe>'
    if (_this.container.innerHTML !== undefined)
        _this.container.appendChild(_this.createElementFromHTML(iframehtm));
    else
        _this.container.insertAdjacentHTML('afterend', iframehtm);

    _this.iframe = document.getElementById(id);

    /**
     * Load the SVG synoptic display file from a SVG URL.
     * @method loadURL
     * @param {string} svgurl - The SVG URL.
     */
    _this.loadURL = function (svgurl) {
        _this.svgobj = null;
        _this.readyfordata = false;
        _this.svgurl = svgurl;
        if (_this.svgurl !== "" && _this.loadingSVG === 0) {
            _this.loadingSVG = 1;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', _this.svgurl); // here you point to the SVG synoptic display file
            xhr.onload = function () {
                if (xhr.status === 200) {
                    _this.loadingSVG = 0;
                    if (_this.componentloaded) // SCADAvis component already loaded?
                        _this.iframe.contentWindow.postMessage(xhr.responseText, _this.domain); // send the SVG file contents to the component
                    else
                        _this.svgobj = xhr.responseText; // buffers the result for later use (this can save some time)
                }
            };
            xhr.onreadystatechange = function (oEvent) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                    } else {
                        _this.loadingSVG = 0;
                        console.log("SCADAvis.io API: error loading SVG URL. " + xhr.statusText);
                    }
                }
            };
            xhr.send();
        }
    }

    /**
     * Reset all data values and tags.
     * @method resetData
     */
    _this.resetData = function () {
        _this.npt = 0;
        _this.npts = [];
        _this.vals = [];
        _this.qualifs = [];

        var obj = { data: { type: "resetData" } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.resetobj = obj;
    }

    /**
     * Update values for tags to the component. Send all tags available.
     * @method updateValues
     * @param {Object.<string, number>} [values] - values in a object like { "tag1" : 1.0, "tag2": 1.2, "tag3": true }.
     */
    _this.updateValues = function (values) {
        if (!_this.readyfordata) 
          return;
           
        if (typeof values === "object" && values !== null)
            Object.keys(values).map(function (tag, index) {
                var n;
                if (tag in _this.npts) {
                    n = _this.npts[tag];
                }
                else {
                    n = ++_this.npt;
                    _this.npts[tag] = n;
                }
                _this.vals[tag] = values[tag];
                _this.qualifs[tag] = 0x00;
            });

        var rtdata = { data: { type: "tags", tags: [] } };
        Object.keys(_this.npts).map(function (tag, index) {
            rtdata.data.tags[index] = {};
            rtdata.data.tags[index].path = tag;
            rtdata.data.tags[index].value = _this.vals[tag];
            rtdata.data.tags[index].quality = !(_this.qualifs[tag] & 0x80);
            if (typeof _this.vals[tag] == "number")
                rtdata.data.tags[index].type = "float";
            else
                if (typeof _this.vals[tag] == "boolean")
                    rtdata.data.tags[index].type = "bool";
                else
                    rtdata.data.tags[index].type = "string";
            rtdata.data.tags[index].parameters = { Value: { TagClientItem: _this.npts[tag], Alarmed: ((_this.qualifs[tag] & 0x100) === 0x100), Desc: _this.descriptions[tag] } };
        });
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(rtdata, _this.domain);
    }

    /**
     * Set a value for a tag. The component will be updated immediately if the component is ready for data.
     * Notice that updating the component at too many times per second can cause performance problems.
     * Preferably update many values using storeValue() then call updateValues() once (repeat after a second or more).
     * @method setValue
     * @param {string} tag - Tag name.
     * @param {number} value - Value for the tag.
     * @param {bool} [failed=false] - True if value is bad or old, false or absent if value is good.
     * @param {bool} [alarmed=false] - True if value is alarmed, false or absent if value is normal.
     * @param {string} [description=tag] - Description.
     * @returns {bool} Returns true if the component was updated (true) or the value was buffered (false).
     */
    _this.setValue = function (tag, value, failed, alarmed, description) {
        var n;
        failed = failed || false;
        alarmed = alarmed || false;
        description = description || tag;
        if (tag in _this.npts) {
            n = _this.npts[tag];
        }
        else {
            n = ++_this.npt;
            _this.npts[tag] = n;
        }
        _this.vals[tag] = value;
        _this.qualifs[tag] = (failed ? 0x80 : 0x00) | (alarmed ? 0x100 : 0x00);
        _this.descriptions[tag] = description;
        if (_this.readyfordata) {
            var rtdata = { data: { type: "tags", tags: [] } };
            rtdata.data.tags[0] = {};
            rtdata.data.tags[0].path = tag;
            rtdata.data.tags[0].value = value;
            rtdata.data.tags[0].quality = !(_this.qualifs[tag] & 0x80);
            if (typeof value == "number")
                rtdata.data.tags[0].type = "float";
            else
                if (typeof value == "boolean")
                    rtdata.data.tags[0].type = "bool";
                else
                    rtdata.data.tags[0].type = "string";
            rtdata.data.tags[0].parameters = { Value: { TagClientItem: n, Alarmed: ((_this.qualifs[tag] & 0x100) === 0x100), Desc: _this.descriptions[tag] } };
            _this.iframe.contentWindow.postMessage(rtdata, _this.domain);
        }
        return _this.readyfordata;
    }

    /**
     * Store a value for a tag. The component will not be updated until called updateValues().
     * @method storeValue
     * @param {string} tag - Tag name.
     * @param {number} value - Value for the tag.
     * @param {bool} [failed=false] - True if value is bad or old, false or absent if value is good.
     * @param {bool} [alarmed=false] - True if value is alarmed, false or absent if value is normal.
     * @param {string} [description=tag] - Description.
     * @returns {bool} - Returns true if the component is ready for data, false if not.
     */
    _this.storeValue = function (tag, value, failed, alarmed, description) {
        var n;
        failed = failed || false;
        alarmed = alarmed || false;
        description = description || tag;
        if (tag in _this.npts) {
            n = _this.npts[tag];
        }
        else {
            n = ++_this.npt;
            _this.npts[tag] = n;
        }
        _this.vals[tag] = value;
        _this.qualifs[tag] = (failed ? 0x80 : 0x00) | (alarmed ? 0x100 : 0x00);;
        _this.descriptions[tag] = description;
        return _this.readyfordata;
    }

    /**
     * Reset all data values and tags.
     * @method resetData
     */
    _this.resetData = function () {
        _this.npt = 0;
        _this.npts = {};
        _this.vals = {};
        _this.qualifs = {};
        _this.descriptions = {};

        var obj = { data: { type: "resetData" } };
        if (_this.readyfordata)
            window.postMessage(obj, _this.domain);
        else
            _this.resetobj = obj;
    }

    /**
     * Get a value for a tag.
     * @method getValue
     * @param {Object} tag - Tag name.
     * @returns {nuber} Returns the value for the tag or null if not found.
     */
    _this.getValue = function (tag) {
        if (tag in _this.vals) {
            return _this.vals[tag];
        }
        return null;
    }

    /**
     * Recover the API Key.
     * @method getApiKey
     * @returns {string} API Key.
     */
    _this.getApiKey = function () {
        return _this.apikey;
    }

    /**
     * Get SCADAvis.io API Version.
     * @method getVersion
     * @returns {string} SCADAvis.io API Version.
     */
    _this.getVersion = function () {
        return version;
    }

    /**
     * Get the DOM element of the iframe.
     * @method getIframe
     * @returns {Object} DOM element reference.
     */
    _this.getIframe = function () {
        return _this.iframe;
    }

    /**
     * Get the current state of the component.
     * @method getComponentState
     * @returns {number} 0=not loaded, 1=loaded and ready for graphics, 2=SVG graphics processed and ready for data.
     */
    _this.getComponentState = function () {
        if (_this.componentloaded == false)
            return 0;
        else
            if (_this.readyfordata == false)
                return 1;
        return 2;
    }

    /**
     * Get SCADAvis.io Component Version.
     * @method getComponentVersion
     * @returns {string} SCADAvis.io Component Version.
     */
    _this.getComponentVersion = function () {
        return version;
    }

    /**
     * Get tags list from the loaded SVG graphics.
     * @method getTagsList
     * @returns {string} Tags list.
     */
    _this.getTagsList = function () {
        return _this.tagsList;
    }

    /**
     * Move the graphic. Multiple calls have cumulative effect.
     * @method moveBy
     * @param {number} [dx=0] Horizontal distance.
     * @param {number} [dy=0] Vertical distance.
     * @param {boolean} [animate=false] Animate or not.
     */
    _this.moveBy = function (dx, dy, animate) {
        dx = dx || 0;
        dy = dy || 0;
        animate = animate || false;
        var obj = { data: { type: "moveBy", dx: dx, dy: dy, animate: animate } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.moveobj = obj;
    }

    /**
     * Apply zoom level. Multiple calls have cumulative effect.
     * @method zoomTo
     * @param {number} [zoomLevel=1.1] Zoom level. >1 zoom in, <1 zoom out.
     * @param {string|{x: number, y: number}} [target={x:0,y:0}] Id of object to zoom in/out or x/y coordinates.
     * @param {boolean} [animate=false] Animate or not.
     */
    _this.zoomTo = function (zoomLevel, target, animate) {
        zoomLevel = zoomLevel || 1.1;
        animate = animate || false;
        var obj = { data: { type: "zoomTo", zoomLevel: zoomLevel, target: target, animate: animate } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.zoomobj = obj;
    }

    /**
     * Apply default zoom level/position.
     * @method zoomToOriginal
     * @param {boolean} [animate=false] Animate or not.
     */
    _this.zoomToOriginal = function (animate) {
        animate = animate || false;
        var obj = { data: { type: "zoomToOriginal", animate: animate } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
    }

    /**
     * Enable or disable pan and zoom tools.
     * @method enableTools
     * @param {boolean} [panEnabled=true] Enable/disable Pan tool.
     * @param {boolean} [zoomEnabled=true] Enable/disable Zoom tool.
     */
    _this.enableTools = function (panEnabled, zoomEnabled) {
        if ( typeof panEnabled === "undefined" || panEnabled )
          panEnabled = true;
        if ( typeof zoomEnabled === "undefined" || zoomEnabled )
          zoomEnabled = true;
        var obj = { data: { type: "enableTools", panEnabled: panEnabled, zoomEnabled: zoomEnabled } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.enabletoolsobj = obj;
    }

    /**
     * Enable or disable pan and zoom via mouse.
     * @method enableMouse
     * @param {boolean} [panEnabled=true] Enable/disable pan via mouse.
     * @param {boolean} [zoomEnabled=true] Enable/disable zoom via mouse.
     */
    _this.enableMouse = function (panEnabled, zoomEnabled) {
        if ( typeof panEnabled === "undefined" || panEnabled )
          panEnabled = true;
        if ( typeof zoomEnabled === "undefined" || zoomEnabled )
          zoomEnabled = true;
        var obj = { data: { type: "enableMouse", panEnabled: panEnabled, zoomEnabled: zoomEnabled } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.enablemouseobj = obj;
    }

    /**
     * Enable or disable keyboard functions (zoom & pan).
     * @method enableKeyboard
     * @param {boolean} [keyEnabled=true] Enable/disable Pan tool.
     */
    _this.enableKeyboard = function (keyEnabled) {
        if ( typeof keyEnabled === "undefined" || keyEnabled )
          keyEnabled = true;
        var obj = { data: { type: "enableKeyboard", keyEnabled: keyEnabled } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.enablekeyboardobj = obj;
    }

    /**
     * Enable or disable alarm flash (objects blinking when alarmed).
     * @method enableAlarmFlash
     * @param {boolean} [alarmFlashEnabled=true] Enable/disable global alarm flash.
     */
    _this.enableAlarmFlash = function (alarmFlashEnabled) {
        if ( typeof alarmFlashEnabled === "undefined" || alarmFlashEnabled )
        alarmFlashEnabled = true;
        var obj = { data: { type: "enableAlarmFlash", alarmFlashEnabled: alarmFlashEnabled } };
        if (_this.componentloaded)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.enableflashobj = obj;
    }

    /**
     * Hides the watermark.
     * @method hideWatermark
     */
    _this.hideWatermark = function () {
        var obj = { data: { type: "hideWatermark" } };
        if (_this.readyfordata)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.hidewatermarkobj = obj;
    }

    /**
     * Set color code for color shortcuts.
     * @method setColor
     * @param {number} [colorNumber] Color shortcut number.
     * @param {string} [colorCode] Color code.
     */
    _this.setColor = function (colorNumber, colorCode) {
        var obj = { data: { type: "setColor", colorNumber: colorNumber, colorCode: colorCode } };
        if (_this.componentloaded)
            _this.iframe.contentWindow.postMessage(obj, _this.domain);
        else
            _this.setcolorobj.push(obj);
    }

    /**
     * Set event listeners.
     * @method on
     * @param {string} event Event name, one of: "ready", "click" (the first parameter of callback is the element id).
     * @param {function} callback Callback function.
     * @returns True for valid event, false for invalid event name.
     */
    _this.on = function (event, callback) {
        var ret = false;
        switch (event) {
            case "ready":
                _this.onready = callback;
                ret = true;
                break;
            case "click":
                _this.onclick = callback;
                ret = true;
                break;
            default:
                break;
        }

        return ret;
    }

    _this.componentloaded = false;
    _this.readyfordata = false;

    if (_this.svgurl !== "")
        _this.loadURL(_this.svgurl);

    window.addEventListener('message', function (event) { // receive messages, watch for messages from the SCADAvis.io component.

        // for better security: check the origin of the message ( must be from the SCADAvis.io domain and component iframe )
        if (event.source === _this.iframe.contentWindow &&
            event.origin === _this.domain) {

            // when message of type "loaded", get and send an SVG file to it
            if (typeof event.data === "object" && event.data.data.type !== undefined && event.data.data.type === "loaded") {
                _this.componentloaded = true;
                if (_this.setcolorobj.length>0) {
                    for (var i=0; i<_this.setcolorobj.length; i++)
                      event.source.postMessage(_this.setcolorobj[i], event.origin);
                    _this.setcolorobj = [];
                }
                if (_this.enableflashobj !== null)
                    event.source.postMessage(_this.enableflashobj, event.origin); // control alarm flash
                if (_this.svgobj !== null)
                    event.source.postMessage(_this.svgobj, event.origin); // send the SVG file contents to the component
                else
                    if (_this.svgurl !== "")
                        _this.loadURL(_this.svgurl);
            }

            // when message type "ready", the SVG screen is processed, then we can send real time data to the SCADAvis.io component
            if (typeof event.data === "object" && event.data.data.type !== undefined && event.data.data.type === "ready") {
                _this.readyfordata = true;
                _this.tagsList = event.data.data.attributes.tagsList;
                _this.updateValues();
                    if (_this.zoomobj) {
                        event.source.postMessage(_this.zoomobj, event.origin);
                        _this.zoomobj = null;
                    }
                    if (_this.moveobj) {
                        event.source.postMessage(_this.moveobj, event.origin);
                        _this.moveobj = null;
                    }
                    if (_this.enabletoolsobj) {
                        event.source.postMessage(_this.enabletoolsobj, event.origin);
                        _this.enabletoolsobj = null;
                    }
                    if (_this.enablemouseobj) {
                        event.source.postMessage(_this.enablemouseobj, event.origin);
                        _this.enablemouseobj = null;
                    }
                    if (_this.enablekeyboardobj) {
                        event.source.postMessage(_this.enablekeyboardobj, event.origin);
                        _this.enablekeyboardobj = null;
                    }
                    if (_this.hidewatermarkobj) {
                        event.source.postMessage(_this.hidewatermarkobj, event.origin);
                        _this.hidewatermarkobj = null;
                    }
                    if (_this.resetobj) {
                        event.source.postMessage(_this.resetobj, event.origin);
                        _this.resetobj = null;
                    }
                    if (_this.onready)
                        _this.onready();
            }

            // when message of type "click", emit the event callback
            if (typeof event.data === "object" && event.data.data.type !== undefined && event.data.data.type === "click") {
                if (_this.onclick)
                    _this.onclick(event.data.data.attributes.event, event.data.data.attributes.tag);
            }
        }
    });
}
