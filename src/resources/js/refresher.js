/** 
 * JWT Token refresher module
 */
const tokenRefresher = function () {
    /** Token refresher URL */
    const tokenRefresherUrl = '/refresh';
    /** Interval time */
    const interval_time = 3600000;
    /** INDIe Cookie name */
    const COOKIE_NAME = 'MY_COOKIE';

    /** 
     * Set up the interval
     */
    function setUp() {
        setInterval(refreshToken, interval_time);
    }

    /**  
     * Send the refresher request and set the cookie
    */
    function refreshToken() {
        const request = new XMLHttpRequest();
        request.open('PUT', tokenRefresherUrl, true);
        request.send();

        request.onload = function () {
            if (this.status >= 200) {
                const response = JSON.parse(this.response);
                setCookie(response.cookie);
                console.log('Token refreshed successfully');
            } else {
                console.error('Refresh token error');
            }
        }
    }

    /**
     * Set the cookie value
     * 
     * @param {*} value Cookie value
     */
    function setCookie(value) {
        const d = new Date();
        d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = COOKIE_NAME + "=" + value + ";" + expires + ";path=/; domain=my_domain";
    }

    // Call the setup
    setUp();

    return {};
};