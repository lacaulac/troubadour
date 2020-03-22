const TimeUtils = {
    getMinutes: function(secs) {
        let s = Math.round(secs);
        return (s - (s%60))/60;
    },
    getSeconds: function(secs) {
        let s = Math.round(secs);
        return s % 60;
    }
}