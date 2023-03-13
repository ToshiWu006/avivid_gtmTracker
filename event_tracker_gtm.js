var AviviD = AviviD === undefined ? {} : AviviD;

(async function() {
    AviviD.addFan = AviviD.addFan === undefined ? {} : AviviD.addFan;
    AviviD.fetch_tracking_enable = async function() {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/tracking/enable'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': AviviD.web_id
                },
                success: function(result) {
                    let status = result['enable_tracking'] == 1 ? true : false;
                    resolve(status)
                },
                fail: function(xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };
    //// 1. check allowed web_id
    var enable = await AviviD.fetch_tracking_enable();
    if (enable) {
        AviviD.fetch_tracking_config = async function() {
            return new Promise((resolve, reject) => {
                // let url = 'https://rhea-cache.advividnetwork.com/api/getTrackingConfig'; // https://rhea-cache.advividnetwork.com/api/
                let url = 'https://rhea-cache.advividnetwork.com/api/tracking/config';
                jQuery.ajax({
                    type: 'GET',
                    url: url,
                    cache: true,
                    dataType: 'json',
                    data: {
                        'web_id': AviviD.web_id
                    },
                    success: function(result) {
                        resolve(result);
                    },
                    fail: function(xhr, ajaxOptions, thrownError) {
                        reject(false);
                    },
                });
            });
        };

        AviviD.get_device_type_int = function() {
            let useragent = navigator.userAgent;
            useragent = useragent.toLowerCase();
            let platform = 0;
            if (useragent.indexOf('iphone') != -1) {
                platform = 2; // 2: ios
            } else if (useragent.indexOf('android') != -1) {
                platform = 1; // 1: android
            } else if (useragent.indexOf('ipad') != -1) {
                platform = 3; // 3: ipad
            } else {
                platform = 0; // 0: pc
                if ([
                        'iPad Simulator',
                        'iPhone Simulator',
                        'iPod Simulator',
                        'iPad',
                        'iPhone',
                        'iPod'
                    ].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) { // iPad on iOS 13 detection
                    platform = 3; // 3: ipad
                };
            };
            return platform;
        };
        AviviD.platform_int = AviviD.get_device_type_int();
        // cookie related
        AviviD.get_hostname = function(url) {
            return (url !== "" ? new URL(url).hostname : "");
        };
        AviviD.get_feature_domain = function(url) {
            let domain = (url !== "" ? new URL(url).hostname : "");
            let isIP = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(domain);
            if (isIP) return domain;
            let domain_split_array = domain.split('.');
            let length = domain_split_array.length;
            // let domain_split_reverse = domain.split('.').reverse();
            if (length <= '2') {
                return domain;
            } else if (length == '3') {
                if (domain_split_array[1] == 'com') {
                    return domain;
                } else {
                    domain_split_array.shift(); //remove first element
                };
            } else if (length == '4') {
                if (domain_split_array[3] == 'com') {
                    domain_split_array.shift(); //remove first element
                    domain_split_array.shift(); //remove first element
                } else {
                    domain_split_array.shift(); //remove first element
                };
            } else {
                domain_split_array.shift(); //remove first element
            };
            return domain_split_array.join('.');
        };

        AviviD.set_cookie_minutes_tracking = function(name, value, minutes) {
            var domain = AviviD.get_feature_domain(location.href);
            var Mins = minutes || 60;
            var exp = new Date();
            exp.setTime(exp.getTime() + Mins * 60 * 1000);
            document.cookie = name + "=" + encodeURI(value) + ";expires=" + exp.toUTCString() + ";domain=" + domain + ";path=/;secure;";
        };

        AviviD.get_cookie_tracking = function(cookie_name = "AviviD_session_id") {
            let arr = document.cookie.match(new RegExp("(^| )" + cookie_name + "=([^;]*)(;|$)"));
            if (arr != null) {
                return decodeURI(arr[2]);
            };
            return "NaN";
        };

        AviviD.setSessionId_ifNull = function() {
            let cookie_name = "AviviD_session_id";
            let session_id = Date.now();
            if (AviviD.get_cookie_tracking(cookie_name) !== "NaN") {
                session_id = AviviD.get_cookie_tracking(cookie_name);
                AviviD.set_cookie_minutes_tracking(cookie_name, session_id, 30);
            } else {
                // let session_id = Date.now();
                AviviD.set_cookie_minutes_tracking(cookie_name, session_id, 30);
            };
            return session_id;
        };

        //// cart parser
        AviviD.fetch_cart_parser = async function() {
            return new Promise((resolve, reject) => {
                let url = 'https://rhea-cache.advividnetwork.com/api/tracking/cart'; // https://rhea-cache.advividnetwork.com/api/
                jQuery.ajax({
                    type: 'GET',
                    url: url,
                    cache: true,
                    dataType: 'json',
                    data: {
                        'web_id': AviviD.web_id
                    },
                    success: function(result) {
                        resolve(result)
                    },
                    fail: function(xhr, ajaxOptions, thrownError) {
                        reject(false)
                    },
                });
            });
        };
        AviviD.parse_Cart_obj = function(obj, parser, key) {
            if (parser[key] === undefined) {
                return '_'; // earily return
            }
            if (parser[key].split('.').length === 1) {
                var value = parser[key] === undefined ? '_' : obj[parser[key]];
            } else {
                // within a obj (not shown yet), two key
                var parser_array = parser[key].split('.')
                var value = obj[parser_array[0]][0][parser_array[1]];
            };
            return value;
        };
        //// update cookie and global variable
        AviviD.update_cart_price = function(cart_price, minutes = 60) {
            var cookie_cart_price = (AviviD.get_cookie_tracking('AviviD_cart_price') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_cart_price')) : 0;
            var updated_cart_price = cart_price + cookie_cart_price;
            updated_cart_price = updated_cart_price < 0 ? 0 : updated_cart_price;
            AviviD.set_cookie_minutes_tracking("AviviD_cart_price", updated_cart_price, minutes);
            AviviD.updated_cart_price = updated_cart_price;
        };

        //// update cart info (addCart or removeCart)
        AviviD.update_cart_info = function(obj, type = 'addCart') {
            console.log('update_cart_info');
            if (type === 'addCart') {
                var key = 'addCart';
                var parser = AviviD.tracking_cart_parser[key];
                //// build addCart info
                AviviD.addCart = AviviD.addCart === undefined ? {} : AviviD.addCart;
                AviviD.addCart.product_id = AviviD.parse_Cart_obj(obj, parser, 'product_id');
                AviviD.addCart.product_name = AviviD.parse_Cart_obj(obj, parser, 'product_name');
                AviviD.addCart.product_price = AviviD.parse_Cart_obj(obj, parser, 'product_price');
                AviviD.addCart.product_quantity = AviviD.parse_Cart_obj(obj, parser, 'product_quantity') === undefined ? 1 : AviviD.parse_Cart_obj(obj, parser, 'product_quantity');
                AviviD.addCart.total_price = parseInt(AviviD.addCart.product_price) * parseInt(AviviD.addCart.product_quantity);
                //// update total price in cookie
                AviviD.update_cart_price(AviviD.addCart.total_price);
                // let cart_item = AviviD.get_cookie_tracking("AviviD_cart_product") == 'NaN' ? 'NaN' : AviviD.get_cookie_tracking("AviviD_cart_product");
                var cart_id = AviviD.get_cookie_tracking("AviviD_cart_id") === 'NaN' ? 'NaN' : AviviD.get_cookie_tracking("AviviD_cart_id");
                if (cart_id !== 'NaN') {
                    AviviD.set_cookie_minutes_tracking("AviviD_cart_id", cart_id + ',' + AviviD.addCart.product_id, 60 * 24 * 7);
                } else {
                    AviviD.set_cookie_minutes_tracking("AviviD_cart_id", AviviD.addCart.product_id, 60 * 24 * 7);
                };
            } else if (type === 'removeCart') {
                var key = 'removeCart';
                var parser = AviviD.tracking_cart_parser[key];
                //// build removeCart info
                AviviD.removeCart = AviviD.removeCart === undefined ? {} : AviviD.removeCart;
                AviviD.removeCart.product_id = AviviD.parse_Cart_obj(obj, parser, 'product_id');
                AviviD.removeCart.product_name = AviviD.parse_Cart_obj(obj, parser, 'product_name');
                AviviD.removeCart.product_price = AviviD.parse_Cart_obj(obj, parser, 'product_price');
                AviviD.removeCart.product_quantity = AviviD.parse_Cart_obj(obj, parser, 'product_quantity');
                AviviD.removeCart.total_price = parseInt(AviviD.removeCart.product_price) * parseInt(AviviD.removeCart.product_quantity);
                //// update total price in cookie
                AviviD.update_cart_price(-AviviD.removeCart.total_price);
            };

            // AviviD.update_couponUI();
        };

        //// 2-1. fetch tracking config using web_id
        var data = await AviviD.fetch_tracking_config();
        //// 2-2. fetch cart parser
        AviviD.updated_cart_price = (AviviD.get_cookie_tracking('AviviD_cart_price') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_cart_price')) : 0;
        AviviD.tracking_cart_parser = await AviviD.fetch_cart_parser();
        AviviD.tracking_addCart_parser = AviviD.tracking_cart_parser.addCart;
        AviviD.tracking_removeCart_parser = AviviD.tracking_cart_parser.removeCart;
        // var data = data_array[0];

        AviviD.check_is_landing = function() {
            let feature_domain_now = AviviD.get_feature_domain(location.href);
            let feature_domain_last = AviviD.get_feature_domain(document.referrer);
            return (feature_domain_now === feature_domain_last) ? 0 : 1;
        };
        AviviD.get_landing_count = function() {
            let is_landing = AviviD.check_is_landing();
            let landing_count = AviviD.get_cookie_tracking("AviviD_landing_count") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_landing_count"));
            if (is_landing === 1) {
                ++landing_count;
                return landing_count;
                // AviviD.set_cookie_minutes_tracking("AviviD_landing_count", landing_count, set_expired_min);            
            } else {
                return landing_count;
            };
        };

        AviviD.config_tracking = {
            "set_time_pageview": 10, // 10 second
            "set_scroll_depth": 50, // %
            "set_timeout": 120, // second
            "gtm_code": data.gtm_code, //"GTM-W9F4QDN"
            "trigger_addToCart": data.addToCart_trigger_name, //"add_to_cart", 1st level
            "addToCart_index": data.addToCart_index, //"select index", 2nd level
            "addToCart_key": data.addToCart_key, //"select key", 3rd level
            "trigger_removeCart": data.removeCart_trigger_name, //"remove_from_cart", 1st level
            "removeCart_index": data.removeCart_index, //"select index", 2nd level
            "removeCart_key": data.removeCart_key, //"select key", 3rd level

            "trigger_purchase": data.purchase_trigger_name, //"ecomm" or "gtm.gaEnhance.purchase"(91app), 1st level
            "purchase_index": data.purchase_index, //"select index", 2nd level
            "purchase_key": data.purchase_key, //"select key", 3rd level
            "purchase_choose_index": data.purchase_choose_index, // final index for AviviD.tracking_purchase_array[], use last index if -1
            "purchase_key_valid": data.purchase_key_valid, // valid key

            "coupon_input_trigger": data.coupon_input_trigger, // fire for click selector
            "coupon_input_selector": data.coupon_input_selector, // coupon input selector
            "coupon_click_selector": data.coupon_click_selector, // button to enter coupon
            "coupon_enter_href": data.coupon_enter_href, // href to allow send enterCoupon event

            "ga_id": data.ga_id,

            "prevent_double": true,
        };
        // coupon ckecking
        // AviviD.is_coupon = 0;
        // trigger timing: 1.beforeunload, 2.add products to cart, 3.purchase products
        AviviD.record_user = {
            // current page attributes
            "dv": AviviD.platform_int,
            // "ul": AviviD.get_cookie_tracking("AviviD_url_last")==="NaN"? document.referrer : AviviD.get_cookie_tracking("AviviD_url_last"), // URI encoded
            "ul": document.referrer,
            "un": location.href,
            "m_t": document.querySelector("meta[property='og:title']") !== null ? document.querySelector("meta[property='og:title']").getAttribute('content') : '_',
            "w_ih": window.innerHeight, //px
            "s_h": document.body.scrollHeight, //px
            // "meta_url": document.querySelector("meta[property='og:url']") !== null ? document.querySelector("meta[property='og:url']").getAttribute('content') : '_', 
            "t_p": 0,
            "s_d": 0,
            "s_d_": 0,
            "c_c": 0,
            "t_nm": 0,
            "t_ns": 0,
            "t_nc": 0,
            "mt_nm": 0,
            "mt_ns": 0,
            "mt_nsa": [0], // times of focusing on something
            "mt_nd": 0,
            "mt_nda": [0], // times of focusing on something
            "mt_nd_": 0,
            "mt_nc": 0,
            "i_l": AviviD.check_is_landing(),
            "l_un": AviviD.get_cookie_tracking("AviviD_l_un") === "NaN" ? "_" : AviviD.get_cookie_tracking("AviviD_l_un"),
            "l_ul": AviviD.get_cookie_tracking("AviviD_l_ul") === "NaN" ? "_" : AviviD.get_cookie_tracking("AviviD_l_ul"),
            "ms_d_p": 0,
            "ms_d_pl": AviviD.get_cookie_tracking("AviviD_max_scroll_depth_page_last") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_scroll_depth_page_last")),
            
            // session based attributes
            "s_id": AviviD.setSessionId_ifNull(),
            "ps": 1, // initialize total pageviews in a session
            "t_p_t": AviviD.get_cookie_tracking("AviviD_time_pageview_total") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_time_pageview_total")), // total time of each pageview in a session
            "t_p_tl": AviviD.get_cookie_tracking("AviviD_time_pageview_total") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_time_pageview_total")), // total time of each pageview in a session(fix value)
            "c_c_t": AviviD.get_cookie_tracking("AviviD_click_count_total") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_click_count_total")), // click_count_total,  AviviD_click_count_total
            "i_ac": AviviD.get_cookie_tracking("AviviD_is_ac") === "NaN" ? 0 : AviviD.get_cookie_tracking("AviviD_is_ac"), // does add to cart this session
            "i_rc": AviviD.get_cookie_tracking("AviviD_is_rc") === "NaN" ? 0 : AviviD.get_cookie_tracking("AviviD_is_rc"), // does remove from cart this session

            // history based attributes (28days)
            "mps": AviviD.get_cookie_tracking("AviviD_max_pageviews") === "NaN" ? 1 : parseInt(AviviD.get_cookie_tracking("AviviD_max_pageviews")), // initialize max total pageviews in cookie expired date
            "mt_p": AviviD.get_cookie_tracking("AviviD_max_time_pageview") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_pageview")), // max time of one page during history
            "mt_p_t": AviviD.get_cookie_tracking("AviviD_max_time_pageview_total") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_pageview_total")), // max time of total pages in a session during history
            "ms_d": AviviD.get_cookie_tracking("AviviD_max_scroll_depth") === "NaN" ? 0 : Math.min(parseInt(AviviD.get_cookie_tracking("AviviD_max_scroll_depth")), 100),
            "ms_dl": AviviD.get_cookie_tracking("AviviD_max_scroll_depth") === "NaN" ? 0 : Math.min(parseInt(AviviD.get_cookie_tracking("AviviD_max_scroll_depth")), 100),

            "mt_nml": AviviD.get_cookie_tracking("AviviD_max_time_no_move") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_no_move")),
            "mt_nsl": AviviD.get_cookie_tracking("AviviD_max_time_no_scroll") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_no_scroll")),
            "mt_ncl": AviviD.get_cookie_tracking("AviviD_max_time_no_click") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_no_click")),
            "l_c": AviviD.get_landing_count(),
            "i_pb": AviviD.get_cookie_tracking("AviviD_is_pb") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_is_pb")),
        };
        AviviD.record_user.s_idl = AviviD.get_cookie_tracking("AviviD_session_idl") === "NaN" ? AviviD.record_user.s_id : AviviD.get_cookie_tracking("AviviD_session_idl");
        AviviD.time_addfan = {
            "start_no_move": Date.now(), // ms
            "start_no_scroll": Date.now(),
            "start_no_click": Date.now(),
            "timestamp_ms_load": Date.now(),

            "time_no_move": 0,
            "time_no_scroll": 0,
            "time_no_click": 0,
            "max_time_no_move": 0,
            "max_time_no_scroll": 0,
            "max_time_no_click": 0,
            "max_time_no_move_last": AviviD.get_cookie_tracking("AviviD_max_time_no_move") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_no_move")),
            "max_time_no_scroll_last": AviviD.get_cookie_tracking("AviviD_max_time_no_scroll") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_no_scroll")),
            "max_time_no_click_last": AviviD.get_cookie_tracking("AviviD_max_time_no_click") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_time_no_click")),
            // "max_scroll_depth_last": AviviD.get_cookie_tracking("AviviD_max_scroll_depth")==="NaN"? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_max_scroll_depth")),
            "time_pageview_total_last": AviviD.get_cookie_tracking("AviviD_time_pageview_total") === "NaN" ? 0 : parseInt(AviviD.get_cookie_tracking("AviviD_time_pageview_total")) // total time of each pageview in a session(fix value)
        };

        if (AviviD.platform_int === 0) {
            AviviD.event = {
                'down_event': 'mousedown',
                'move_event': 'mousemove',
                'up_event': 'mouseup'
            };
        } else { // mobile device use touch events
            AviviD.event = {
                'down_event': 'touchstart',
                'move_event': 'touchmove',
                'up_event': 'touchend'
            };
        };

        AviviD.feature_domain_now = AviviD.get_feature_domain(location.href);
        AviviD.feature_domain_last = AviviD.get_feature_domain(document.referrer);

        //正副品判斷參數
        AviviD.item_type = 0;
        AviviD.check_utm = function() {
            /**
             * @todo 因sw推播，來源有可能會變成原domain firebase.js的來源，所以要判斷當前網址的utm_source，且medium不為recommendation
             */
            var url = AviviD.record_user.un;
            if (url.indexOf('utm_source=likr') != -1) {
                if ((url.indexOf('utm_medium=recommendation') != -1) || (url.indexOf('utm_medium=ecguess') != -1) || (url.indexOf('utm_medium=ecotherview'))) {
                    return 0;
                } else {
                    return 1;
                };
            } else {
                return 0;
            };
        };

        if (AviviD.record_user.ul.indexOf(AviviD.feature_domain_now) == -1) {
            // 主商品
            AviviD.item_type = 1;
        } else {
            // 副品
            AviviD.item_type = AviviD.check_utm();
        };

        // check current url not equal to url_last and url_last is not ""
        AviviD.check_is_nextpage = function() {
            let c0 = AviviD.record_user.ul !== location.href;
            let c1 = AviviD.record_user.ul !== "";
            let criteria = c0 && c1;
            return criteria;
        };

        //// update cookie when beforeunolad(leave)
        AviviD.update_tracking_cookies = function() {
            const set_expired_min = 28 * 24 * 60; // minutes, 28 days

            // save max of time, all max time store longer time
            AviviD.set_cookie_minutes_tracking("AviviD_max_time_no_move", Math.max(AviviD.record_user.mt_nm, AviviD.record_user.mt_nml), set_expired_min);
            AviviD.set_cookie_minutes_tracking("AviviD_max_time_no_scroll", Math.max(AviviD.record_user.mt_ns, AviviD.record_user.mt_nsl), set_expired_min);
            AviviD.set_cookie_minutes_tracking("AviviD_max_time_no_click", Math.max(AviviD.record_user.mt_nc, AviviD.record_user.mt_ncl), set_expired_min);

            AviviD.set_cookie_minutes_tracking("AviviD_max_time_pageview", AviviD.record_user.mt_p, set_expired_min);
            AviviD.set_cookie_minutes_tracking("AviviD_max_time_pageview_total", AviviD.record_user.mt_p_t, set_expired_min);

            AviviD.set_cookie_minutes_tracking("AviviD_max_scroll_depth_page_last", AviviD.record_user.ms_d_p, set_expired_min);

            if (AviviD.get_cookie_tracking("AviviD_session_id") !== AviviD.record_user.s_id) { // session timeout
                // reset session_id and update last session_id
                AviviD.record_user.s_idl = AviviD.record_user.s_id;
                AviviD.set_cookie_minutes_tracking("AviviD_session_idl", AviviD.record_user.s_idl, set_expired_min);
                AviviD.record_user.s_id = Date.now().toString();
                AviviD.set_cookie_minutes_tracking("AviviD_session_id", AviviD.record_user.s_id, 30);
                AviviD.set_cookie_minutes_tracking("AviviD_time_pageview_total", 0, 30); // reset to zero
                AviviD.set_cookie_minutes_tracking("AviviD_pageviews", "NaN", 30); // reset to NaN
                AviviD.set_cookie_minutes_tracking("AviviD_click_count_total", 0, 30);
                // reset scrolling movements
                AviviD.set_cookie_minutes_tracking("AviviD_scroll_depth_last", 0, 30); // reset
                AviviD.set_cookie_minutes_tracking("AviviD_scroll_depth_px_last", 0, 30); // reset                
            } else { // session continued
                AviviD.set_cookie_minutes_tracking("AviviD_time_pageview_total", AviviD.record_user.t_p_t, 30);
                AviviD.set_cookie_minutes_tracking("AviviD_click_count_total", AviviD.record_user.c_c_t, 30);
                // scrolling movements
                AviviD.set_cookie_minutes_tracking("AviviD_scroll_depth_last", AviviD.record_user.s_d, 30); // session
                AviviD.set_cookie_minutes_tracking("AviviD_scroll_depth_px_last", AviviD.record_user.s_d_, 30); // session

            };
            // update max_scroll_depth, if there is scrollable
            if (document.body.scrollHeight > window.innerHeight * 2) { //save max_scroll depth only when scrollable range > 2-fold innerHeight
                AviviD.set_cookie_minutes_tracking("AviviD_max_scroll_depth", Math.max(AviviD.record_user.ms_d, AviviD.record_user.s_d), set_expired_min);
                // AviviD.set_cookie_minutes_tracking("AviviD_scroll_depth_mean2", (AviviD.record_user.scroll_depth_mean2+AviviD.record_user.scroll_depth)/2, set_expired_min); // debug
            };
        };
        if (AviviD.check_is_nextpage()) {
            AviviD.record_user.ps = AviviD.get_cookie_tracking("AviviD_pageviews") === "NaN" ? 1 : parseInt(AviviD.get_cookie_tracking("AviviD_pageviews")) + 1;

        } else { // F5 case
            AviviD.record_user.ps = AviviD.get_cookie_tracking("AviviD_pageviews") === "NaN" ? 1 : parseInt(AviviD.get_cookie_tracking("AviviD_pageviews"));

        };

        //// set important cookies
        AviviD.set_cookie_minutes_tracking("AviviD_pageviews", AviviD.record_user.ps, 30); // session
        AviviD.record_user.mps = Math.max(AviviD.record_user.ps, AviviD.record_user.mps); // update max_pageviews
        AviviD.set_cookie_minutes_tracking("AviviD_max_pageviews", AviviD.record_user.mps, 28 * 24 * 60); // 28 days, 
        AviviD.set_cookie_minutes_tracking("AviviD_landing_count", AviviD.record_user.l_c, 28 * 24 * 60); // 28 days, landing count

        //// counter for time
        setInterval(function() {
            //// do not exceed 1800 s
            AviviD.record_user.t_nm = Math.min((Math.floor((Date.now() - AviviD.time_addfan.start_no_move) / 1000)), 1800); // in seconds
            AviviD.record_user.t_ns = Math.min((Math.floor((Date.now() - AviviD.time_addfan.start_no_scroll) / 1000)), 1800); // in seconds
            AviviD.record_user.t_nc = Math.min((Math.floor((Date.now() - AviviD.time_addfan.start_no_click) / 1000)), 1800); // in seconds
            AviviD.record_user.mt_nm = Math.min(Math.max(AviviD.record_user.mt_nm, AviviD.record_user.t_nm), 1800);
            // AviviD.record_user.max_time_no_scroll = Math.max(AviviD.record_user.max_time_no_scroll, AviviD.record_user.time_no_scroll);
            AviviD.record_user.mt_nc = Math.min(Math.max(AviviD.record_user.mt_nc, AviviD.record_user.t_nc), 1800);
            // AviviD.record_user.max_time_pageview = Math.max(AviviD.record_user.max_time_pageview + AviviD.record_user.time_pageview);

            // update time of pageview
            AviviD.record_user.t_p = Math.min((Math.floor((Date.now() - AviviD.time_addfan.timestamp_ms_load) / 1000)), 1800); // in seconds, max 1800s
            AviviD.record_user.t_p_t = AviviD.record_user.t_p_tl + AviviD.record_user.t_p;
            AviviD.record_user.mt_p = Math.min(Math.max(AviviD.record_user.t_p, AviviD.record_user.mt_p), 1800); // in seconds, max 1800s
            AviviD.record_user.mt_p_t = Math.max(AviviD.record_user.mt_p_t, AviviD.record_user.t_p_t);

            // initialize to default true
            AviviD.config_tracking.prevent_double = true;
        }, 1000); // update about every second


        window.addEventListener('scroll', function(e) {
            AviviD.record_user.s_d = Math.min(Math.floor(window.pageYOffset / (document.body.scrollHeight - window.innerHeight + 1) * 100), 100); // do not exceed 100%
            AviviD.record_user.s_d_ = Math.floor(window.pageYOffset);
            // AviviD.config_tracking.max_time_no_scroll = Math.max(AviviD.config_tracking.max_time_no_scroll, AviviD.delta_addfan);
            AviviD.time_addfan.start_no_scroll = Date.now(); // initialize time when scrolling
            AviviD.record_user.ms_d = Math.min(Math.max(AviviD.record_user.ms_d, AviviD.record_user.s_d), 100);
            AviviD.record_user.ms_d_p = Math.max(AviviD.record_user.ms_d_p, AviviD.record_user.s_d);
            // if (AviviD.record_user.time_no_scroll > AviviD.record_user.max_time_no_scroll) {
            let l = AviviD.record_user.mt_nsa.length;
            if (AviviD.record_user.t_ns > AviviD.record_user.mt_nsa[l - 1]) {
                if (AviviD.record_user.mt_nsa[l - 1] === 0) { // initialize
                    AviviD.record_user.mt_nsa[0] = AviviD.record_user.t_ns;
                    AviviD.record_user.mt_nda[0] = AviviD.record_user.s_d;
                } else if (l > 10) {
                    // do nothing
                } else { // save array
                    AviviD.record_user.mt_nsa.push(AviviD.record_user.t_ns);
                    AviviD.record_user.mt_nda.push(AviviD.record_user.s_d);
                    if (AviviD.get_cookie_tracking("AviviD_session_id") !== AviviD.record_user.s_id) {
                        // session expired
                        AviviD.record_user.s_idl = AviviD.record_user.s_id;
                        AviviD.set_cookie_minutes_tracking("AviviD_session_idl", AviviD.record_user.s_idl, 28 * 24 * 60);
                        AviviD.record_user.s_id = Date.now().toString();
                        AviviD.set_cookie_minutes_tracking("AviviD_session_id", AviviD.record_user.s_id, 30);
                    } else {
                        // increase expired date of session_id to 30 min again
                        AviviD.set_cookie_minutes_tracking("AviviD_session_id", AviviD.record_user.s_id, 30);
                    };
                    // // increase expired date of session_id to 30 min again
                    // AviviD.set_cookie_minutes_tracking("AviviD_session_id",AviviD.record_user.s_id.toString(),30);
                    // increase expired date of session based attribute to 30 min again
                    AviviD.set_cookie_minutes_tracking("AviviD_time_pageview_total", AviviD.record_user.t_p_t.toString(), 30);
                    AviviD.set_cookie_minutes_tracking("AviviD_click_count_total", AviviD.record_user.c_c_t, 30);
                    AviviD.set_cookie_minutes_tracking("AviviD_scroll_depth_last", AviviD.record_user.s_d, 30); // session
                    AviviD.set_cookie_minutes_tracking("AviviD_scroll_depth_px_last", AviviD.record_user.s_d_, 30); // session
                    AviviD.set_cookie_minutes_tracking("AviviD_pageviews", AviviD.record_user.ps, 30); // session

                    //// refresh AviviD_is_coupon cookie only if in sending coupon mode and cookie existing
                    if (typeof(AviviD.addFan.AviviD_is_coupon) !== 'undefined' && AviviD.get_cookie_tracking('AviviD_is_coupon') != "NaN") {
                        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", AviviD.addFan.AviviD_is_coupon, 30); //session-based
                    };
                };
                AviviD.record_user.mt_nd = AviviD.record_user.s_d;
                AviviD.record_user.mt_nd_ = AviviD.record_user.s_d_;
                AviviD.record_user.mt_ns = Math.min(Math.max(AviviD.record_user.mt_ns, AviviD.record_user.t_ns), 1800);
            };
        });

        window.addEventListener(AviviD.event.move_event, function(e) {
            AviviD.time_addfan.start_no_move = Date.now(); // initialize time when touchmove or mouse move
        });

        window.addEventListener(AviviD.event.down_event, function(e) {
            AviviD.time_addfan.start_no_click = Date.now(); // initialize time when touchdown or move down
            ++AviviD.record_user.c_c;
            ++AviviD.record_user.c_c_t;

        });


        AviviD.LikrEventTrackingLoad = function() {
            let payload = {
                "s_id": AviviD.record_user.s_id,
                "s_idl": AviviD.record_user.s_idl,
                "dv": AviviD.record_user.dv,
                "ul": AviviD.record_user.ul,
                "un": AviviD.record_user.un,
                "i_l": AviviD.record_user.i_l,
                "m_t": AviviD.record_user.m_t,
                "ps": AviviD.record_user.ps,
                "t_p_t": AviviD.record_user.t_p_t,

                "l_c": AviviD.record_user.l_c,
                "c_c_t": AviviD.record_user.c_c_t,
                "mt_nm": AviviD.record_user.mt_nml, // use last
                "mt_ns": AviviD.record_user.mt_nsl, // use last
                "mt_nc": AviviD.record_user.mt_ncl, // use last
                // "mt_nd"        : AviviD.record_user.mt_nd,
                "mps": AviviD.record_user.mps,
                "mt_p": AviviD.record_user.mt_p,
                "mt_p_t": AviviD.record_user.mt_p_t,
                "ms_d": AviviD.record_user.ms_d,
                "s_h": AviviD.record_user.s_h,
                "w_ih": AviviD.record_user.w_ih,

                "i_ac": AviviD.record_user.i_ac,
                "i_rc": AviviD.record_user.i_rc,
                "i_pb": AviviD.record_user.i_pb,
            }
            let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
            let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
            let fb_id = AviviD.get_cookie_tracking('_fbp');
            let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
            let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
            let tracking_data = {
                'web_id': AviviD.web_id,
                'uuid': uuid,
                'ga_id': ga_id,
                'fb_id': fb_id,
                'ip': ip,
                'timestamp': Date.now(),
                "behavior_type": "likrTracking",
                'event_type': "load",
                "coupon": is_coupon,
                "item_type": AviviD.item_type,
                'load': payload,
            };
            if (AviviD.get_cookie_tracking("AviviD_s_id") != AviviD.record_user.s_id) {
                AviviD.set_cookie_minutes_tracking("AviviD_s_id", AviviD.record_user.s_id, 40320); 
                AviviD.set_cookie_minutes_tracking("AviviD_l_ul", AviviD.record_user.ul, 40320);
                AviviD.set_cookie_minutes_tracking("AviviD_l_un", AviviD.record_user.un, 40320);
                AviviD.record_user.l_ul = AviviD.record_user.ul
                AviviD.record_user.l_un = AviviD.record_user.un
            };
            console.log("trigger load");
            AviviD.tracking_data_aws_put.construct(tracking_data);

        }
        AviviD.LikrEventTrackingLoad(); // send loading status when code is loaded

        // tracking add to cart, purchase, beforeunload, timeout
        AviviD.LikrEventTrackingAddToCart = function() {
            // avivid_gtm_code: with two values normal or 91app
            if (AviviD.config_tracking.prevent_double && AviviD.config_tracking.trigger_addToCart !== "_") { // AviviD.config_tracking.prevent_double=true
                AviviD.config_tracking.prevent_double = false // prevent double trigger
                AviviD.record_user.i_ac = 1; // add to cart
                // x['event'] for 91app
                AviviD.tracking_addToCart_array = dataLayer.filter(x => x['event'] === AviviD.config_tracking.trigger_addToCart | x[1] === AviviD.config_tracking.trigger_addToCart);
                AviviD.tracking_addToCart_length = AviviD.tracking_addToCart_array.length;
                var choose_index = AviviD.config_tracking.addToCart_index
                // change product_id for easystore
                if (choose_index === 'Easystore') {
                    var choose_index = 2
                    AviviD.tracking_addToCart_array[AviviD.tracking_addToCart_length - 1][choose_index]['items'][0]['item_id'] = cart.latest_items[0]['variant_id'];
                }
                AviviD.tracking_addToCart = AviviD.tracking_addToCart_array[AviviD.tracking_addToCart_length - 1][choose_index];
                if (AviviD.config_tracking.addToCart_key !== '_') { //should parse one more level
                    AviviD.tracking_addToCart = AviviD.tracking_addToCart[AviviD.config_tracking.addToCart_key];
                    if (typeof AviviD.tracking_addToCart.length !== 'undefined') { // abnormal case => an array in key of add_to_cart
                        AviviD.tracking_addToCart = AviviD.tracking_addToCart[0]; // an array(object), choose first one
                    };
                };
                let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let fb_id = AviviD.get_cookie_tracking('_fbp');
                let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
                let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let tracking_data = {
                    'web_id': AviviD.web_id,
                    'uuid': uuid,
                    'ga_id': ga_id,
                    'fb_id': fb_id,
                    'ip': ip,
                    'timestamp': Date.now(),
                    "behavior_type": "likrTracking",
                    'event_type': "addCart",
                    "coupon": is_coupon,
                    'record_user': AviviD.record_user,
                    'cart': JSON.stringify(AviviD.tracking_addToCart), // parse offline
                };
                // console.log(tracking_data);
                console.log("trigger add to cart");
                // label addCart in cookie
                AviviD.set_cookie_minutes_tracking("AviviD_is_ac", 1, 30);
                AviviD.tracking_data_aws_put.construct(tracking_data);
                //// update addCart info
                AviviD.update_cart_info(AviviD.tracking_addToCart, 'addCart');
                //// update coupon
                if (AviviD.addFan !== undefined) {
                    (AviviD.update_couponUI !== undefined && AviviD.addFan.coupon_id !== undefined) ? AviviD.update_couponUI(): false;
                }
            }
        }

        // tracking remove cart 
        AviviD.LikrEventTrackingRemoveCart = function() {
            // avivid_gtm_code: with two values normal or 91app
            if (AviviD.config_tracking.prevent_double && AviviD.config_tracking.trigger_removeCart !== "_") { // AviviD.config_tracking.prevent_double=true
                AviviD.config_tracking.prevent_double = false // prevent double trigger
                AviviD.record_user.i_rc = 1; // remove from cart
                // x['event'] for 91app
                AviviD.tracking_removeCart_array = dataLayer.filter(x => x['event'] === AviviD.config_tracking.trigger_removeCart | x[1] === AviviD.config_tracking.trigger_removeCart);
                AviviD.tracking_removeCart_length = AviviD.tracking_removeCart_array.length;
                AviviD.tracking_removeCart = AviviD.tracking_removeCart_array[AviviD.tracking_removeCart_length - 1][AviviD.config_tracking.removeCart_index];

                if (AviviD.config_tracking.removeCart_key !== '_') { //should parse one more level
                    AviviD.tracking_removeCart = AviviD.tracking_removeCart[AviviD.config_tracking.removeCart_key];
                    if (typeof AviviD.tracking_removeCart.length !== 'undefined') { // abnormal case => an array in key of add_to_cart
                        AviviD.tracking_removeCart = AviviD.tracking_removeCart[0]; // an array(object), choose first one
                    };
                };
                let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let fb_id = AviviD.get_cookie_tracking('_fbp');
                let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
                let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let tracking_data = {
                    'web_id': AviviD.web_id,
                    'uuid': uuid,
                    'ga_id': ga_id,
                    'fb_id': fb_id,
                    'ip': ip,
                    'timestamp': Date.now(),
                    'event_type': "removeCart",
                    "coupon": is_coupon,
                    "behavior_type": "likrTracking",
                    'record_user': AviviD.record_user,
                    'remove_cart': JSON.stringify(AviviD.tracking_removeCart), // parse offline
                };
                // console.log(tracking_data);
                console.log("trigger remove cart");
                // label removeCart in cookie
                AviviD.set_cookie_minutes_tracking("AviviD_is_rc", 1, 30);
                AviviD.tracking_data_aws_put.construct(tracking_data);
                //// update removeCart info
                AviviD.update_cart_info(AviviD.tracking_removeCart, 'removeCart');
                //// update coupon
                if (AviviD.addFan !== undefined) {
                    (AviviD.update_couponUI !== undefined && AviviD.addFan.coupon_id !== undefined) ? AviviD.update_couponUI(): false;
                }
            }
        }

        AviviD.LikrEventTrackingPurchase = function() {
            // avivid_gtm_code: with two values normal or 91app
            if (AviviD.config_tracking.prevent_double && AviviD.config_tracking.trigger_purchase !== "_") { // AviviD.config_tracking.prevent_double=true
                AviviD.config_tracking.prevent_double = true // prevent double trigger
                // AviviD.tracking_purchase_array = dataLayer.filter(x => (x['event']===AviviD.config_tracking.trigger_purchase || x[1]===AviviD.config_tracking.trigger_purchase) && JSON.stringify(x).includes(AviviD.config_tracking.purchase_key_valid));
                AviviD.tracking_purchase_array = dataLayer.filter(x => (x['event'] === AviviD.config_tracking.trigger_purchase || x[1] === AviviD.config_tracking.trigger_purchase));
                var purchase_key_valid_array = AviviD.config_tracking.purchase_key_valid.split(',');
                if (AviviD.config_tracking.purchase_key_valid !== "_" && purchase_key_valid_array.length > 1) {
                    purchase_key_valid_array.forEach(element => {
                        AviviD.tracking_purchase_array = AviviD.tracking_purchase_array.filter(x => dfs(x, element));
                    });

                    function dfs(obj, target) {
                        if (typeof(obj) !== "object") {
                            return false;
                        };
                        let keys = Object.keys(obj);
                        if (target.split('.').length > 1) {
                            temp = true;
                            var obj2 = obj;
                            for (let t of target.split('.')) {
                                if (obj[t] === undefined) {
                                    // iterate all keys
                                    temp = temp && dfs(obj, t);
                                } else {
                                    // go depth
                                    temp = temp && dfs(obj2, t);
                                };
                                obj2 = (obj2 === undefined) ? obj2 : obj2[t];
                            };
                            return temp;
                        };
                        var res = false;
                        for (let key of keys) {
                            // console.log(key);
                            if (key === target || res) {
                                return true;
                            };
                            res = res || dfs(obj[key], target)
                        };
                        return res;
                    };
                };
                // AviviD.tracking_purchase_array = AviviD.tracking_purchase_array.filter(x => JSON.stringify(x).includes(AviviD.config_tracking.purchase_key_valid));
                AviviD.tracking_purchase_length = AviviD.tracking_purchase_array.length;
                if (AviviD.tracking_purchase_length !== 0) {
                    var choose_index = AviviD.config_tracking.purchase_choose_index == -1 ? AviviD.tracking_purchase_length - 1 : AviviD.config_tracking.purchase_choose_index;
                    var choose_index2 = AviviD.config_tracking.purchase_index
                    if (choose_index2 == '_') {
                        AviviD.tracking_purchase = AviviD.tracking_purchase_array[choose_index]
                    } else {
                        // change product_id for easystore
                        if (choose_index2 === 'Easystore') {
                            var choose_index2 = 2;
                            var check_purchase_data = typeof(window.purchase_data) == 'undefined' ? 'NaN' : window.purchase_data;
                            var check_purchase_data = typeof(window.checkout) != 'undefined' && check_purchase_data == 'NaN' ? window.checkout : check_purchase_data;
                            AviviD.tracking_purchase = AviviD.tracking_purchase_array[choose_index][choose_index2];
                            AviviD.tracking_purchase.items = check_purchase_data.line_items;
                        }
                        AviviD.tracking_purchase = AviviD.tracking_purchase_array[choose_index][choose_index2];
                    }
                    // AviviD.tracking_purchase = AviviD.tracking_purchase_array[choose_index][AviviD.config_tracking.purchase_index];
                    AviviD.tracking_purchase_send = {};
                    var key_array = AviviD.config_tracking.purchase_key.split(','); //ex: i3fresh:bitem,ship,order,order_coupon,amount
                    if (AviviD.config_tracking.purchase_key !== '_') { //should parse one more level
                        if (key_array.length === 1) { // normal case, directly parse
                            AviviD.tracking_purchase_send = AviviD.tracking_purchase[AviviD.config_tracking.purchase_key];
                            AviviD.tracking_purchase_is_send = true;
                        } else { // ex: i3fresh:bitem,ship,order,order_coupon,amount
                            for (let i = 0; i < key_array.length; i++) {
                                var key = key_array[i];
                                var value = AviviD.tracking_purchase[key];
                                AviviD.tracking_purchase_send[key] = value; // collect purchased object to be sent
                            };
                            AviviD.tracking_purchase_is_send = typeof AviviD.tracking_purchase_send[key_array[0]] === "undefined" ? false : true; // for i3fresh case, purchase_key(dataLayer) shown in product page
                        };

                    } else { // directly use second level
                        AviviD.tracking_purchase_send = AviviD.tracking_purchase === undefined ? {} : AviviD.tracking_purchase;
                        AviviD.tracking_purchase_is_send = true;
                    };
                    AviviD.config_tracking.prevent_double = AviviD.tracking_purchase === undefined ? true : false;
                    // AviviD.tracking_purchase_is_send = typeof AviviD.tracking_purchase_send[key_array[0]]==="undefined" ? false : true;

                    let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
                    let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                    let fb_id = AviviD.get_cookie_tracking('_fbp');
                    let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
                    let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                    let tracking_data = {
                        'web_id': AviviD.web_id,
                        'uuid': uuid,
                        'ga_id': ga_id,
                        'fb_id': fb_id,
                        'ip': ip,
                        'timestamp': Date.now(),
                        "behavior_type": "likrTracking",
                        'event_type': "purchase",
                        "coupon": is_coupon,
                        'record_user': AviviD.record_user,
                        'purchase': JSON.stringify(AviviD.tracking_purchase_send), // parse offline
                    };
                    // console.log(tracking_data);
                    if (AviviD.tracking_purchase_is_send) { // do not send if value of key_array[0] is undefined
                        console.log("trigger purchase");
                        // console.log(tracking_data);
                        // label purchased in cookie
                        AviviD.record_user.i_pb = 1;
                        AviviD.set_cookie_minutes_tracking("AviviD_is_pb", AviviD.record_user.i_pb, 365 * 24 * 60);
                        AviviD.tracking_data_aws_put.construct(tracking_data);
                    };
                };
            };
        };

        AviviD.LikrEventTrackingLeave = function() {
            let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
            let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
            let fb_id = AviviD.get_cookie_tracking('_fbp');
            let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
            let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
            let tracking_data = {
                'web_id': AviviD.web_id,
                'uuid': uuid,
                'ga_id': ga_id,
                'fb_id': fb_id,
                'ip': ip,
                'timestamp': Date.now(),
                "behavior_type": "likrTracking",
                'event_type': "leave",
                "coupon": is_coupon,
                'record_user': AviviD.record_user,
            };
            // console.log(tracking_data);
            console.log("trigger leave");
            //// lengthen expired date
            AviviD.set_cookie_minutes_tracking("AviviD_is_pb", AviviD.record_user.i_pb, 365 * 24 * 60);
            AviviD.tracking_data_aws_put.construct(tracking_data);
        };

        AviviD.LikrEventTrackingTimeout = function() {
            let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
            let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
            let fb_id = AviviD.get_cookie_tracking('_fbp');
            let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
            let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
            let tracking_data = {
                'web_id': AviviD.web_id,
                'uuid': uuid,
                'ga_id': ga_id,
                'fb_id': fb_id,
                'ip': ip,
                'timestamp': Date.now(),
                "behavior_type": "likrTracking",
                'event_type': "timeout",
                "coupon": is_coupon,
                'record_user': AviviD.record_user,
            };
            // console.log(tracking_data);
            console.log("trigger timeout");
            AviviD.tracking_data_aws_put.construct(tracking_data);
        };
        //// beforeunload is deprecated in ios
        if (AviviD.platform_int === 2 | AviviD.platform_int == 3) {
            AviviD.event.leave = "pagehide"
        } else {
            AviviD.event.leave = "beforeunload"
        };

        //// save cookie before unload page
        window.addEventListener(AviviD.event.leave, function(e) {
            // save scroll focusing event only when longer focuing time
            let l = AviviD.record_user.mt_nsa.length;
            if (AviviD.record_user.t_ns > AviviD.record_user.mt_nsa[l - 1]) {
                if (AviviD.record_user.mt_nsa[l - 1] === 0) { // initialize
                    AviviD.record_user.mt_nsa[0] = AviviD.record_user.t_ns;
                    AviviD.record_user.mt_nda[0] = AviviD.record_user.s_d;
                } else if (l > 10) {
                    // do nothing
                } else { // save array
                    AviviD.record_user.mt_nsa.push(AviviD.record_user.t_ns);
                    AviviD.record_user.mt_nda.push(AviviD.record_user.s_d);
                };
            };
            // session
            AviviD.update_tracking_cookies();
            AviviD.LikrEventTrackingLeave();
        });

        AviviD.config_tracking.send_timeout_event = 0;
        //// timer for timeout, use scroll and check every minute
        setInterval(function() {
            if (AviviD.record_user.t_ns >= 1800 && AviviD.config_tracking.send_timeout_event === 0) { // not scroll 30min and first to trigger timeout
                AviviD.LikrEventTrackingTimeout();
                AviviD.config_tracking.send_timeout_event = 1;
            };
        }, 60 * 1000);

        AviviD.parse_coupon_code = function() {
            //// setting input selector
            var coupon_text_selector = AviviD.config_tracking.coupon_input_selector;
            var coupon_code = coupon_text_selector !== "_" ? document.querySelector(coupon_text_selector).value : "_";
            return coupon_code;
        };

        AviviD.LikrEventTrackingEnterCoupon = function() {
            let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
            let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
            let fb_id = AviviD.get_cookie_tracking('_fbp');
            let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
            let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
            let coupon_code = AviviD.parse_coupon_code();
            let coupon_info = {
                "s_id": AviviD.record_user.s_id,
                "code": coupon_code,
            };
            let tracking_data = {
                'web_id': AviviD.web_id,
                'uuid': uuid,
                'ga_id': ga_id,
                'fb_id': fb_id,
                'ip': ip,
                'timestamp': Date.now(),
                "behavior_type": "likrTracking",
                'event_type': "enterCoupon",
                "coupon": is_coupon,
                "coupon_info": coupon_info,
            };
            // console.log(tracking_data);
            //// don't send if in preview mode
            if (AviviD.get_urlparam('avivid_preview_coupon') != 1) {
                AviviD.tracking_data_aws_put.construct(tracking_data);
                console.log("trigger enterCoupon event");
            };
        };

        if (AviviD.config_tracking.coupon_input_trigger === "_") {
            // direct add listener
            if (location.href.includes(AviviD.config_tracking.coupon_enter_href) || AviviD.config_tracking.coupon_enter_href === "_") {
                //// setting button, #btnShipM, .btn-coupon-apply
                if (AviviD.config_tracking.coupon_click_selector !== "_") {
                    jQuery(AviviD.config_tracking.coupon_click_selector).click(function(e) {
                        AviviD.LikrEventTrackingEnterCoupon();
                    });
                };
            };
        } else {
            // add listener of listener
            jQuery(AviviD.config_tracking.coupon_input_trigger).click(function(e) {
                if (location.href.includes(AviviD.config_tracking.coupon_enter_href) || AviviD.config_tracking.coupon_enter_href === "_") {
                    //// setting button, #btnShipM, .btn-coupon-apply
                    if (AviviD.config_tracking.coupon_click_selector !== "_") {
                        function check() {
                            jQuery(AviviD.config_tracking.coupon_click_selector).click(function(e) {
                                AviviD.LikrEventTrackingEnterCoupon();
                            });
                        };
                        setTimeout(check, 1000)
                    };
                };
            });
        }


        // if (location.href.includes(AviviD.config_tracking.coupon_enter_href) && AviviD.config_tracking.coupon_enter_href!=="_") {        
        //     //// setting button, #btnShipM, .btn-coupon-apply
        //     if (AviviD.config_tracking.coupon_click_selector!=="_") {            
        //         jQuery(AviviD.config_tracking.coupon_click_selector).click(function (e){
        //             AviviD.LikrEventTrackingEnterCoupon();
        //         });
        //     };
        // };
    } //// 1. check allowed web_id(fetch_tracking_enable)

    AviviD.fetch_addfan_enable = async function() {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/enable'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': AviviD.web_id
                },
                success: function(result) {
                    let status = result['enable_addfan'] == 1 ? true : false;
                    resolve(status)
                },
                fail: function(xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    var avivid_load_addfan = function() {
        if (AviviD.block_setting === undefined || AviviD.blacklist === undefined) {
            setTimeout(function() {
                avivid_load_addfan();
            }, 500);
        } else {
            if (AviviD.get_urlparam('avivid_debug_addfan') == 1) {
                AviviD.loadScript('https://rhea-cache.advividnetwork.com/coupon/debug/addFan_debug.js');
            } else {
                //// excluding platform : desktop
                // if (AviviD.platform_int !== 0) {
                //// preview mode or online
                AviviD.fetch_addfan_enable()
                    .then((addfan_status) => {
                        if (AviviD.get_urlparam('avivid_preview_coupon') == 1 || addfan_status) {
                            console.log('load addFan');
                            AviviD.loadScript('https://rhea-cache.advividnetwork.com/coupon/addFan.js');
                        };
                    });
                // };
            };
        };
    };
    avivid_load_addfan();

})();