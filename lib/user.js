'use strict';

exports.authenticate = async (username, password) => {
    if (
        username === process.env.RESTIFY_APP_USER &&
        password === process.env.RESTIFY_APP_PASSWORD
    ) {
        return { uid: 1, name: username, admin: false };
    } else {
        throw new Error('Invalid Credentials');
    }
};
