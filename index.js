'use strict';

require('dotenv').config();
const Restify = require('restify');
const rjwt = require('restify-jwt-community');
const jwt = require('jsonwebtoken');
const user = require('./lib/user');
const err = require('restify-errors');
const server = Restify.createServer({ onceNext: true });

const corsMiddleware = require('restify-cors-middleware2');
const cors = corsMiddleware({
    origins: ['*'],
    allowHeaders: ['Authorization'],
    exposeHeaders: ['Authorization'],
});

const configJWK = {
    secret: process.env.RESTIFY_APP_JWT_SECRET,
};

// Middleware setup
server.pre(cors.preflight);
server.use(cors.actual);
server.use(Restify.plugins.queryParser());
server.use(Restify.plugins.bodyParser({ mapParams: false }));

// JWT middleware
server.use(
    rjwt(configJWK).unless({
        path: ['/auth'],
    })
);

// Route: GET /user
server.get('/user', (req, res, next) => {
    res.send(req.user);
});

// Route: POST /auth
server.post('/auth', (req, res, next) => {
    const { username, password } = req.body;

    console.log('Authenticating user...');
    user.authenticate(username, password)
        .then((data) => {
            const token = jwt.sign(data, configJWK.secret, {
                expiresIn: '15m',
            });
            const { iat, exp } = jwt.decode(token);

            res.send({ iat, exp, token });
            console.log('Authentication successful');
        })
        .catch(() => {
            next(new err.UnauthorizedError('Invalid Credentials'));
        });
});

const url = '/api/members';
const members = [
    {
        firstName: 'Yander',
        lastName: 'Sanchez',
        address: '7777 Jesus Nazareth',
        ssn: '777-77-7777',
    },
];

function validString(item) {
    return typeof item === 'string' && item.trim().length > 1;
}

// Route: GET /api/members
server.get(url, (req, res, next) => {
    console.log('GET /api/members');
    res.send(members);
});

// Route: POST /api/members
server.post(url, (req, res, next) => {
    try {
        const body = req.body || {};
        const firstName = body.firstName || '';
        const lastName = body.lastName || '';
        const address = body.address || '';
        const ssn = body.ssn || '';

        if (
            !validString(firstName) ||
            !validString(lastName) ||
            !validString(address)
        ) {
            throw new err.BadRequestError(
                'Invalid first name, last name, or address'
            );
        }

        const regex = /^\d{3}-\d{2}-\d{4}$/;
        if (!regex.test(ssn)) {
            throw new err.BadRequestError('Invalid SSN');
        }

        const duplicate = members.find((m) => m.ssn === ssn);
        if (duplicate) {
            throw new err.BadRequestError('Duplicate SSN');
        }

        const item = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address: address.trim(),
            ssn,
        };

        members.push(item);
        res.send(201, item);
    } catch (error) {
        next(error);
    }
});

// Start server
server.listen(process.env.PORT || 80, () => {
    console.log('%s listening at %s', server.name, server.url);
});
