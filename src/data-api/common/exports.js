window.MT         = window.MT || {};
window.MT.DataAPI = window.MT.DataAPI || DataAPI;
window.MT.DataAPI['v' + DataAPI.version] = DataAPI;

if ( typeof module === 'object' && module && typeof module.exports === 'object' ) {
    module.exports = DataAPI;
}
