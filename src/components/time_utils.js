function extractDateTime(timestamp) {
    const regex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    const match = timestamp.match(regex);

    if (match) {
        const [_, year, month, day, hour, minute] = match;
        return { year, month, day, hour, minute };
    } else {
        throw new Error("Invalid timestamp format");
    }
}

export function get_update_time_local(time_string) {
    var update_time_string = time_string.replace("UTC", "Z");
    var update_date = new Date(update_time_string); // Convert update_time string to a date object.
    var update_time = update_date;
    //for UTC conversion.
    var offset = update_date.getTimezoneOffset();
    var local = new Date(update_date.getTime() + offset * 60000);
    var update_time_local = " " + update_time;
    var update_time_utc = "UTC: " + update_time_string;
    return update_time_local;
}

export function get_update_time_utc(time_string) {
    var update_time_string = time_string.replace("UTC", "Z");
    var update_date = new Date(update_time_string); // Convert update_time string to a date object.
    var update_time = update_date;
    //for UTC conversion.
    var offset = update_date.getTimezoneOffset();
    var local = new Date(update_date.getTime() + offset * 60000);
    var update_time_local = " " + update_time;
    var update_time_utc = "UTC: " + update_time_string;
    return update_time_utc;
}
